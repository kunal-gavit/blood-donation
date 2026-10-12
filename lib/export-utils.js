const XLSX = require('xlsx');

// Standard exact column definition for the donor table and exports
const EXPORT_COLUMNS = [
  { header: 'Donor ID', key: 'donorId' },
  { header: 'Full Name', key: 'fullName' },
  { header: 'Department', key: 'department' },
  { header: 'Year', key: 'year' },
  { header: 'Mobile', key: 'mobile' },
  { header: 'Age', key: 'age' },
  { header: 'Blood Group', key: 'bloodGroup' },
  { header: 'Previous Donation', key: 'previousDonation' },
  { header: 'Contact Consent', key: 'contactConsent' },
];

/**
 * Defend against formula injection attacks (CSV/Excel Formula Injection).
 * If a cell string starts with =, +, -, @, tab, or carriage return, prepend a single quote.
 */
function sanitizeForExport(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Generate genuine XLSX buffer
 */
function generateXlsxBuffer(donors, sheetTitle = 'Donors') {
  const headers = EXPORT_COLUMNS.map((col) => col.header);
  const rows = donors.map((donor) =>
    EXPORT_COLUMNS.map((col) => sanitizeForExport(donor[col.key] || ''))
  );

  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 12 }, // Donor ID
    { wch: 24 }, // Full Name
    { wch: 20 }, // Department
    { wch: 10 }, // Year
    { wch: 16 }, // Mobile
    { wch: 8 },  // Age
    { wch: 14 }, // Blood Group
    { wch: 18 }, // Previous Donation
    { wch: 18 }, // Contact Consent
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetTitle);

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

/**
 * Generate CSV string with UTF-8 BOM for full Excel compatibility
 */
function generateCsvString(donors) {
  const headers = EXPORT_COLUMNS.map((col) => `"${col.header.replace(/"/g, '""')}"`).join(',');
  const lines = donors.map((donor) =>
    EXPORT_COLUMNS.map((col) => {
      const sanitized = sanitizeForExport(donor[col.key] || '');
      return `"${sanitized.replace(/"/g, '""')}"`;
    }).join(',')
  );

  // Prepend UTF-8 Byte Order Mark (\uFEFF)
  return '\uFEFF' + [headers, ...lines].join('\r\n');
}

/**
 * Produce a safe filename with date
 */
function getSafeExportFilename(prefix = 'Blood_Donors_Export', extension = 'xlsx') {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${cleanPrefix}_${dateStr}.${extension}`;
}

module.exports = {
  EXPORT_COLUMNS,
  sanitizeForExport,
  generateXlsxBuffer,
  generateCsvString,
  getSafeExportFilename,
};
