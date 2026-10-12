const { google } = require('googleapis');
const fallbackStore = require('./local-storage-fallback');

// Exact required column headers
const DONORS_HEADERS = [
  'Donor ID',
  'Full Name',
  'PRN',
  'Department',
  'Year',
  'Division',
  'Mobile',
  'Age',
  'Blood Group',
  'Previous Donation',
  'Contact Consent',
  'Consent Timestamp',
  'Registration Date',
  'Verification Status',
  'Created By',
  'Verified By',
  'Verified At',
  'Updated At',
];

const ADMINS_HEADERS = [
  'Admin ID',
  'Name',
  'Email',
  'Role',
  'Active Status',
  'Created At',
];

const AUDIT_LOGS_HEADERS = [
  'Timestamp',
  'Admin ID',
  'Action',
  'Donor ID',
  'Result',
];

const SHEET_NAMES = {
  DONORS: 'Donors',
  ADMINS: 'Admins',
  AUDIT_LOGS: 'Audit Logs',
};

/**
 * Check if Google Sheets credentials are configured and valid in environment
 */
function isConfigured() {
  const spreadsheetId = (process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '').trim().replace(/^["']+|["']+$/g, '');
  const clientEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim().replace(/^["']+|["']+$/g, '');
  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').trim().replace(/^["']+|["']+$/g, '');

  if (!spreadsheetId || !clientEmail || !privateKey) return false;
  if (spreadsheetId.includes('your_spreadsheet_id') || clientEmail.includes('your-service-account')) return false;

  // Real RSA private key is > 1000 characters and must not contain placeholder '...'
  if (privateKey.includes('...') || privateKey.length < 500) {
    return false;
  }

  return true;
}

/**
 * Get authorized Google Sheets API client
 */
function getSheetsClient() {
  const clientEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').trim().replace(/^["']+|["']+$/g, '');
  let privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').trim().replace(/^["']+|["']+$/g, '');

  if (!clientEmail || !privateKey) {
    throw new Error('Google service account credentials are missing.');
  }

  // Handle newlines in private key from environment variables
  privateKey = privateKey.replace(/\\n/g, '\n').replace(/\r/g, '');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth, timeout: 5000 });
}

/**
 * Retry helper with exponential backoff for Google API rate limits and network glitches
 */
async function withRetry(operation, maxRetries = 2, initialDelayMs = 300) {
  let delay = initialDelayMs;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      const status = err?.status || err?.code || (err?.response && err.response.status);
      const isTransient = status === 429 || status === 500 || status === 503 || err.message?.includes('RATE_LIMIT');
      if (attempt === maxRetries || !isTransient) {
        throw err;
      }
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2;
    }
  }
}

// Cache sheet IDs and initialization state to avoid redundant calls
let sheetMetadataCache = null;
let spreadsheetInitialized = false;

// In-memory read cache to make dashboard load instantly
let donorsCache = null;
let donorsCacheTimestamp = 0;
const CACHE_TTL_MS = 5000; // 5 seconds cache for fast reads

let adminsCache = null;
let adminsCacheTimestamp = 0;

// Error cooldown to prevent repeated slow network roundtrips if Google Sheet is unshared (403)
let lastApiError = null;
let lastApiErrorTime = 0;
const API_ERROR_COOLDOWN_MS = 15000; // 15 seconds cooldown

function invalidateDonorsCache() {
  donorsCache = null;
  donorsCacheTimestamp = 0;
}

function invalidateAdminsCache() {
  adminsCache = null;
  adminsCacheTimestamp = 0;
}

function resetApiErrorCooldown() {
  lastApiError = null;
  lastApiErrorTime = 0;
  spreadsheetInitialized = false;
  invalidateDonorsCache();
  invalidateAdminsCache();
}

/**
 * Ensure all 3 worksheets exist and have correct header rows (runs only ONCE)
 */
async function ensureSpreadsheetInitialized() {
  if (!isConfigured() || spreadsheetInitialized) return;
  if (lastApiErrorTime && (Date.now() - lastApiErrorTime < API_ERROR_COOLDOWN_MS)) {
    return;
  }

  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  try {
    await withRetry(async () => {
      const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
      const existingSheets = metaRes.data.sheets || [];
      const sheetMap = {};
      existingSheets.forEach((s) => {
        sheetMap[s.properties.title] = s.properties.sheetId;
      });

      const requests = [];

      // Check missing sheets
      if (!sheetMap[SHEET_NAMES.DONORS]) {
        requests.push({ addSheet: { properties: { title: SHEET_NAMES.DONORS } } });
      }
      if (!sheetMap[SHEET_NAMES.ADMINS]) {
        requests.push({ addSheet: { properties: { title: SHEET_NAMES.ADMINS } } });
      }
      if (!sheetMap[SHEET_NAMES.AUDIT_LOGS]) {
        requests.push({ addSheet: { properties: { title: SHEET_NAMES.AUDIT_LOGS } } });
      }

      if (requests.length > 0) {
        const updateRes = await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests },
        });
        updateRes.data.replies?.forEach((reply) => {
          if (reply.addSheet) {
            sheetMap[reply.addSheet.properties.title] = reply.addSheet.properties.sheetId;
          }
        });
      }

      sheetMetadataCache = sheetMap;
      spreadsheetInitialized = true;
    });
  } catch (err) {
    lastApiError = err.message;
    lastApiErrorTime = Date.now();
    console.warn('Google Sheets API unavailable/unshared, using fast local fallback:', err.message);
  }
}


/**
 * Health check / status check for Google Sheets
 */
async function checkConnection() {
  if (!isConfigured()) {
    return {
      connected: false,
      mode: 'fallback',
      message: 'Google Sheets credentials are not configured in environment. Using local simulated storage.',
      details: {
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'Configured' : 'Missing',
        clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Configured' : 'Missing',
        privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 'Configured' : 'Missing',
      },
    };
  }

  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const res = await withRetry(async () =>
      sheets.spreadsheets.get({ spreadsheetId })
    );

    return {
      connected: true,
      mode: 'google_sheets',
      spreadsheetTitle: res.data.properties?.title || 'Connected',
      sheetsCount: res.data.sheets?.length || 0,
      message: 'Successfully connected to Google Sheets API.',
    };
  } catch (err) {
    return {
      connected: false,
      mode: 'error_fallback',
      error: err.message || 'Failed to authenticate or fetch Google Sheets.',
      message: 'Google Sheets error. Review your service account permissions.',
    };
  }
}

/**
 * Get internal numeric sheetId for a sheet title
 */
async function getSheetId(sheetTitle) {
  if (sheetMetadataCache && sheetMetadataCache[sheetTitle] !== undefined) {
    return sheetMetadataCache[sheetTitle];
  }
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
  const map = {};
  metaRes.data.sheets?.forEach((s) => {
    map[s.properties.title] = s.properties.sheetId;
  });
  sheetMetadataCache = map;
  return map[sheetTitle];
}

// -------------------------------------------------------------
// DONOR OPERATIONS
// -------------------------------------------------------------

function donorRowToObject(row) {
  return {
    donorId: row[0] || '',
    fullName: row[1] || '',
    prn: row[2] || '',
    department: row[3] || '',
    year: row[4] || '',
    division: row[5] || '',
    mobile: row[6] || '',
    age: row[7] || '',
    bloodGroup: row[8] || '',
    previousDonation: row[9] || 'No',
    contactConsent: row[10] || 'No',
    consentTimestamp: row[11] || '',
    registrationDate: row[12] || '',
    verificationStatus: row[13] || 'Pending',
    createdBy: row[14] || '',
    verifiedBy: row[15] || '',
    verifiedAt: row[16] || '',
    updatedAt: row[17] || '',
  };
}

function donorObjectToRow(donor) {
  return [
    donor.donorId || '',
    donor.fullName || '',
    donor.prn || '',
    donor.department || '',
    donor.year || '',
    donor.division || '',
    donor.mobile || '',
    donor.age || '',
    donor.bloodGroup || '',
    donor.previousDonation || 'No',
    donor.contactConsent || 'No',
    donor.consentTimestamp || '',
    donor.registrationDate || '',
    donor.verificationStatus || 'Pending',
    donor.createdBy || '',
    donor.verifiedBy || '',
    donor.verifiedAt || '',
    donor.updatedAt || '',
  ];
}

/**
 * Fetch all donors from Google Sheets (or fallback) with high-performance cache
 */
async function getAllDonors() {
  if (!isConfigured()) {
    return await fallbackStore.getFallbackDonors();
  }

  if (lastApiErrorTime && (Date.now() - lastApiErrorTime < API_ERROR_COOLDOWN_MS)) {
    return await fallbackStore.getFallbackDonors();
  }

  const now = Date.now();
  if (donorsCache && (now - donorsCacheTimestamp < CACHE_TTL_MS)) {
    return donorsCache;
  }

  await ensureSpreadsheetInitialized();
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  try {
    const donors = await withRetry(async () => {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_NAMES.DONORS}!A:R`,
      });
      let rows = res.data.values || [];
      if (rows.length > 0 && (rows[0][0] === 'Donor ID' || String(rows[0][0]).toLowerCase().includes('donor id'))) {
        rows = rows.slice(1);
      }
      return rows.map(donorRowToObject).filter((d) => Boolean(d.donorId));
    });
    donorsCache = donors;
    donorsCacheTimestamp = now;
    return donors;
  } catch (err) {
    lastApiError = err.message;
    lastApiErrorTime = Date.now();
    console.warn('Google Sheets read error, immediately serving fast fallback data:', err.message);
    if (donorsCache) return donorsCache;
    return await fallbackStore.getFallbackDonors();
  }
}

/**
 * Append new donor to Google Sheets (or fallback)
 */
async function appendDonor(donor) {
  invalidateDonorsCache();
  if (!isConfigured()) {
    return await fallbackStore.addFallbackDonor(donor);
  }

  await ensureSpreadsheetInitialized();
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const rowData = donorObjectToRow(donor);

  return await withRetry(async () => {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAMES.DONORS}!A:R`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [rowData],
      },
    });
    return donor;
  });
}

/**
 * Find row index of donor by Donor ID in Google Sheets
 */
async function findDonorRowIndex(donorId) {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAMES.DONORS}!A:A`,
  });

  const rows = res.data.values || [];
  // 1-based index in sheets
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i][0] === donorId) {
      return i + 1; // 1-based sheet row number
    }
  }
  return -1;
}

/**
 * Update an existing donor by stable Donor ID
 */
async function updateDonor(donorId, updates) {
  invalidateDonorsCache();
  if (!isConfigured()) {
    return await fallbackStore.updateFallbackDonor(donorId, updates);
  }

  await ensureSpreadsheetInitialized();
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  return await withRetry(async () => {
    const rowIndex = await findDonorRowIndex(donorId);
    if (rowIndex === -1) {
      throw new Error(`Donor with ID ${donorId} not found in database.`);
    }

    // Fetch existing row to merge
    const currentRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAMES.DONORS}!A${rowIndex}:R${rowIndex}`,
    });

    const currentRow = currentRes.data.values?.[0] || [];
    const currentObj = donorRowToObject(currentRow);
    const updatedObj = {
      ...currentObj,
      ...updates,
      donorId, // Stable ID cannot be changed
      updatedAt: new Date().toISOString(),
    };

    const newRow = donorObjectToRow(updatedObj);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAMES.DONORS}!A${rowIndex}:R${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    return updatedObj;
  });
}

/**
 * Delete a donor row by stable Donor ID
 */
async function deleteDonor(donorId) {
  invalidateDonorsCache();
  if (!isConfigured()) {
    return await fallbackStore.deleteFallbackDonor(donorId);
  }

  await ensureSpreadsheetInitialized();
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  return await withRetry(async () => {
    const rowIndex = await findDonorRowIndex(donorId);
    if (rowIndex === -1) {
      throw new Error(`Donor with ID ${donorId} not found in database.`);
    }

    const sheetId = await getSheetId(SHEET_NAMES.DONORS);

    // Delete row via batchUpdate deleteDimension (0-indexed)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex - 1,
                endIndex: rowIndex,
              },
            },
          },
        ],
      },
    });

    return true;
  });
}

// -------------------------------------------------------------
// ADMINS OPERATIONS
// -------------------------------------------------------------

function adminRowToObject(row) {
  return {
    adminId: row[0] || '',
    name: row[1] || '',
    email: row[2] || '',
    role: row[3] || 'admin',
    activeStatus: row[4] || 'active',
    createdAt: row[5] || '',
  };
}

function adminObjectToRow(admin) {
  return [
    admin.adminId || '',
    admin.name || '',
    admin.email || '',
    admin.role || 'admin',
    admin.activeStatus || 'active',
    admin.createdAt || '',
  ];
}

async function getAllAdmins() {
  if (!isConfigured()) {
    return await fallbackStore.getFallbackAdmins();
  }

  const now = Date.now();
  if (adminsCache && (now - adminsCacheTimestamp < CACHE_TTL_MS)) {
    return adminsCache;
  }

  await ensureSpreadsheetInitialized();
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  try {
    const admins = await withRetry(async () => {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_NAMES.ADMINS}!A:F`,
      });
      let rows = res.data.values || [];
      if (rows.length > 0 && (rows[0][0] === 'Admin ID' || String(rows[0][0]).toLowerCase().includes('admin id'))) {
        rows = rows.slice(1);
      }
      return rows.map(adminRowToObject).filter((a) => Boolean(a.adminId));
    });
    adminsCache = admins;
    adminsCacheTimestamp = now;
    return admins;
  } catch (err) {
    if (adminsCache) return adminsCache;
    return await fallbackStore.getFallbackAdmins();
  }
}

async function appendAdmin(admin) {
  invalidateAdminsCache();
  if (!isConfigured()) {
    return await fallbackStore.addFallbackAdmin(admin);
  }

  await ensureSpreadsheetInitialized();
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const rowData = adminObjectToRow(admin);

  return await withRetry(async () => {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAMES.ADMINS}!A:F`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });
    return admin;
  });
}

async function updateAdmin(adminId, updates) {
  invalidateAdminsCache();
  if (!isConfigured()) {
    return await fallbackStore.updateFallbackAdmin(adminId, updates);
  }

  await ensureSpreadsheetInitialized();
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  return await withRetry(async () => {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAMES.ADMINS}!A:A`,
    });
    const rows = res.data.values || [];
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i] && rows[i][0] === adminId) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error(`Admin with ID ${adminId} not found in database.`);
    }

    const currentRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAMES.ADMINS}!A${rowIndex}:F${rowIndex}`,
    });
    const currentObj = adminRowToObject(currentRes.data.values?.[0] || []);
    const updatedObj = { ...currentObj, ...updates, adminId };
    const newRow = adminObjectToRow(updatedObj);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAMES.ADMINS}!A${rowIndex}:F${rowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow],
      },
    });

    return updatedObj;
  });
}

// -------------------------------------------------------------
// AUDIT LOGS OPERATIONS
// -------------------------------------------------------------

async function appendAuditLog(logEntry) {
  if (!isConfigured()) {
    return await fallbackStore.addFallbackAuditLog(logEntry);
  }

  try {
    await ensureSpreadsheetInitialized();
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const row = [
      logEntry.timestamp || new Date().toISOString(),
      logEntry.adminId || '',
      logEntry.action || '',
      logEntry.donorId || '',
      logEntry.result || 'SUCCESS',
    ];

    await withRetry(async () => {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${SHEET_NAMES.AUDIT_LOGS}!A:E`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [row],
        },
      });
    });
  } catch (err) {
    console.error('Failed to append to audit log in Google Sheets:', err.message);
  }
}

async function getAllAuditLogs() {
  if (!isConfigured()) {
    return await fallbackStore.getFallbackAuditLogs();
  }

  await ensureSpreadsheetInitialized();
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  return await withRetry(async () => {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAMES.AUDIT_LOGS}!A:E`,
    });
    let rows = res.data.values || [];
    if (rows.length > 0 && (rows[0][0] === 'Timestamp' || String(rows[0][0]).toLowerCase().includes('timestamp'))) {
      rows = rows.slice(1);
    }
    return rows
      .map((r) => ({
        timestamp: r[0] || '',
        adminId: r[1] || '',
        action: r[2] || '',
        donorId: r[3] || '',
        result: r[4] || '',
      }))
      .reverse(); // Most recent first
  });
}

module.exports = {
  isConfigured,
  checkConnection,
  ensureSpreadsheetInitialized,
  getAllDonors,
  appendDonor,
  updateDonor,
  deleteDonor,
  getAllAdmins,
  appendAdmin,
  updateAdmin,
  appendAuditLog,
  getAllAuditLogs,
};
