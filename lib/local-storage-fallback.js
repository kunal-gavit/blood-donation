const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'mock_sheets_store.json');

// Initial defaults
const DEFAULT_STORE = {
  donors: [
    {
      donorId: 'BD-0001',
      fullName: 'Aarav Sharma',
      prn: 'PRN2024001',
      department: 'Computer Engineering',
      year: 'Third Year',
      division: 'A',
      mobile: '9876543210',
      age: '21',
      bloodGroup: 'O+',
      previousDonation: 'No',
      contactConsent: 'Yes',
      consentTimestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      registrationDate: new Date(Date.now() - 86400000 * 3).toISOString(),
      verificationStatus: 'Verified',
      createdBy: 'ADM-001 (Owner)',
      verifiedBy: 'ADM-001 (Owner)',
      verifiedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      donorId: 'BD-0002',
      fullName: 'Priya Patel',
      prn: 'PRN2024045',
      department: 'Information Technology',
      year: 'Final Year',
      division: 'B',
      mobile: '9823456781',
      age: '22',
      bloodGroup: 'A+',
      previousDonation: 'Yes',
      contactConsent: 'Yes',
      consentTimestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      registrationDate: new Date(Date.now() - 86400000 * 2).toISOString(),
      verificationStatus: 'Verified',
      createdBy: 'ADM-001 (Owner)',
      verifiedBy: 'ADM-001 (Owner)',
      verifiedAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      donorId: 'BD-0003',
      fullName: 'Rohan Deshmukh',
      prn: 'PRN2024099',
      department: 'Mechanical Engineering',
      year: 'Second Year',
      division: 'A',
      mobile: '9890123456',
      age: '19',
      bloodGroup: 'B+',
      previousDonation: 'No',
      contactConsent: 'No',
      consentTimestamp: new Date(Date.now() - 86400000).toISOString(),
      registrationDate: new Date(Date.now() - 86400000).toISOString(),
      verificationStatus: 'Pending',
      createdBy: 'ADM-002 (Friend)',
      verifiedBy: '',
      verifiedAt: '',
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  admins: [
    {
      adminId: 'ADM-001',
      name: 'Owner (Me)',
      email: 'owner@blooddonation.org',
      role: 'owner',
      activeStatus: 'active',
      createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    },
    {
      adminId: 'ADM-002',
      name: 'Second Admin (Friend)',
      email: 'friend@blooddonation.org',
      role: 'admin',
      activeStatus: 'active',
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
  ],
  auditLogs: [
    {
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      adminId: 'ADM-001',
      action: 'DONOR_REGISTRATION',
      donorId: 'BD-0001',
      result: 'SUCCESS',
    },
    {
      timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
      adminId: 'ADM-001',
      action: 'DONOR_REGISTRATION',
      donorId: 'BD-0002',
      result: 'SUCCESS',
    },
    {
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      adminId: 'ADM-002',
      action: 'DONOR_REGISTRATION',
      donorId: 'BD-0003',
      result: 'SUCCESS',
    },
  ],
};

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_STORE, null, 2), 'utf-8');
    }
  } catch (err) {
    // In serverless readonly environment, we will fallback to in-memory store
  }
}

let inMemoryStore = JSON.parse(JSON.stringify(DEFAULT_STORE));

function loadStore() {
  try {
    ensureDataFile();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    // fallback
  }
  return inMemoryStore;
}

function saveStore(data) {
  inMemoryStore = data;
  try {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // in-memory fallback
  }
}

// Donor operations
async function getFallbackDonors() {
  const store = loadStore();
  return store.donors || [];
}

async function addFallbackDonor(donor) {
  const store = loadStore();
  store.donors.push(donor);
  saveStore(store);
  return donor;
}

async function updateFallbackDonor(donorId, updates) {
  const store = loadStore();
  const idx = store.donors.findIndex((d) => d.donorId === donorId);
  if (idx === -1) {
    throw new Error(`Donor ${donorId} not found`);
  }
  store.donors[idx] = {
    ...store.donors[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveStore(store);
  return store.donors[idx];
}

async function deleteFallbackDonor(donorId) {
  const store = loadStore();
  const initialLen = store.donors.length;
  store.donors = store.donors.filter((d) => d.donorId !== donorId);
  if (store.donors.length === initialLen) {
    throw new Error(`Donor ${donorId} not found`);
  }
  saveStore(store);
  return true;
}

// Admins operations
async function getFallbackAdmins() {
  const store = loadStore();
  return store.admins || [];
}

async function updateFallbackAdmin(adminId, updates) {
  const store = loadStore();
  const idx = store.admins.findIndex((a) => a.adminId === adminId);
  if (idx === -1) {
    throw new Error(`Admin ${adminId} not found`);
  }
  store.admins[idx] = {
    ...store.admins[idx],
    ...updates,
  };
  saveStore(store);
  return store.admins[idx];
}

async function addFallbackAdmin(admin) {
  const store = loadStore();
  store.admins.push(admin);
  saveStore(store);
  return admin;
}

// Audit logs
async function getFallbackAuditLogs() {
  const store = loadStore();
  return store.auditLogs || [];
}

async function addFallbackAuditLog(logEntry) {
  const store = loadStore();
  store.auditLogs.unshift(logEntry);
  saveStore(store);
  return logEntry;
}

module.exports = {
  getFallbackDonors,
  addFallbackDonor,
  updateFallbackDonor,
  deleteFallbackDonor,
  getFallbackAdmins,
  updateFallbackAdmin,
  addFallbackAdmin,
  getFallbackAuditLogs,
  addFallbackAuditLog,
  loadStore,
  saveStore,
};
