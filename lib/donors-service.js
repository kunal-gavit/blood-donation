const { globalLock } = require('./mutex');
const sheets = require('./google-sheets');
const { appendAuditLog } = require('./google-sheets');
const { VALID_BLOOD_GROUPS, VALID_YEARS } = require('./constants');


/**
 * Normalizes PRN by trimming, removing inner whitespace, and converting to uppercase.
 * Ensures consistent, bulletproof duplicate detection.
 */
function normalizePRN(prn) {
  if (!prn) return '';
  return String(prn).trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Generates the next sequential unique Donor ID (e.g., BD-0001, BD-0002)
 */
function generateNextDonorId(donors = []) {
  let maxId = 0;
  for (const donor of donors) {
    if (!donor.donorId) continue;
    const match = String(donor.donorId).match(/^BD-(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxId) {
        maxId = num;
      }
    }
  }

  const nextNum = maxId + 1;
  const padded = String(nextNum).padStart(4, '0');
  return `BD-${padded}`;
}

/**
 * Validate donor fields before writing to Google Sheets
 */
function validateDonorInput(data, isUpdate = false) {
  const errors = [];

  if (!isUpdate || data.fullName !== undefined) {
    if (!data.fullName || String(data.fullName).trim().length < 2) {
      errors.push('Full Name is required (minimum 2 characters).');
    }
  }

  if (!isUpdate || data.prn !== undefined) {
    if (!data.prn || String(data.prn).trim().length < 1) {
      errors.push('PRN is required and cannot be empty.');
    }
  }

  if (!isUpdate || data.department !== undefined) {
    if (!data.department || String(data.department).trim().length < 1) {
      errors.push('Department is required.');
    }
  }

  if (!isUpdate || data.year !== undefined) {
    if (!data.year) {
      errors.push('Academic Year is required.');
    }
  }

  if (!isUpdate || data.division !== undefined) {
    if (!data.division) {
      errors.push('Division is required.');
    }
  }

  if (!isUpdate || data.mobile !== undefined) {
    const cleanMobile = String(data.mobile || '').replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      errors.push('Mobile number must be at least 10 digits.');
    }
  }

  if (!isUpdate || data.age !== undefined) {
    const ageNum = parseInt(data.age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 65) {
      errors.push('Donor age must be between 18 and 65 years.');
    }
  }

  if (!isUpdate || data.bloodGroup !== undefined) {
    const bg = String(data.bloodGroup || '').toUpperCase().trim();
    if (!VALID_BLOOD_GROUPS.includes(bg)) {
      errors.push(`Invalid Blood Group: ${data.bloodGroup}. Must be one of: ${VALID_BLOOD_GROUPS.join(', ')}`);
    }
  }

  return errors;
}

/**
 * Calculate live summary statistics from actual donor records
 */
function calculateSummaryStats(donors = []) {
  let totalRegistrations = 0;
  let firstTimeDonors = 0;
  let repeatDonors = 0;
  let contactConsents = 0;

  for (const d of donors) {
    totalRegistrations += 1;

    const prev = String(d.previousDonation || '').trim().toLowerCase();
    if (prev === 'no') {
      firstTimeDonors += 1;
    } else if (prev === 'yes') {
      repeatDonors += 1;
    }

    const consent = String(d.contactConsent || '').trim().toLowerCase();
    if (consent === 'yes') {
      contactConsents += 1;
    }
  }

  return {
    totalRegistrations,
    firstTimeDonors,
    repeatDonors,
    contactConsents,
  };
}

/**
 * Register a new donor with atomic server-side concurrency locking and normalized PRN check
 */
async function registerDonor(donorData, admin) {
  const validationErrors = validateDonorInput(donorData, false);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(' '));
  }

  const normalizedInputPRN = normalizePRN(donorData.prn);

  // Critical section serialized by in-process async lock
  return await globalLock.runExclusive(async () => {
    // 1. Fetch fresh list of donors directly from storage
    const currentDonors = await sheets.getAllDonors();

    // 2. Check for duplicate normalized PRN
    const duplicate = currentDonors.find(
      (d) => normalizePRN(d.prn) === normalizedInputPRN
    );

    if (duplicate) {
      const err = new Error(
        `Duplicate PRN: Donor with PRN "${donorData.prn}" is already registered (Donor ID: ${duplicate.donorId}, Name: ${duplicate.fullName}).`
      );
      err.code = 'DUPLICATE_PRN';
      err.existingDonorId = duplicate.donorId;
      throw err;
    }

    // 3. Generate unique sequential Donor ID
    const newDonorId = generateNextDonorId(currentDonors);

    const nowIso = new Date().toISOString();
    const consentGiven = String(donorData.contactConsent || '').toLowerCase() === 'yes';

    const newDonorRecord = {
      donorId: newDonorId,
      fullName: String(donorData.fullName).trim(),
      prn: String(donorData.prn).trim(),
      department: String(donorData.department).trim(),
      year: String(donorData.year).trim(),
      division: String(donorData.division).trim(),
      mobile: String(donorData.mobile).trim(),
      age: String(donorData.age).trim(),
      bloodGroup: String(donorData.bloodGroup).trim().toUpperCase(),
      previousDonation: String(donorData.previousDonation || 'No').trim().toLowerCase() === 'yes' ? 'Yes' : 'No',
      contactConsent: consentGiven ? 'Yes' : 'No',
      consentTimestamp: consentGiven ? nowIso : '',
      registrationDate: nowIso,
      verificationStatus: donorData.verificationStatus || 'Pending',
      createdBy: `${admin?.adminId || 'ADM'} (${admin?.name || 'Admin'})`,
      verifiedBy: donorData.verificationStatus === 'Verified' ? `${admin?.adminId} (${admin?.name})` : '',
      verifiedAt: donorData.verificationStatus === 'Verified' ? nowIso : '',
      updatedAt: nowIso,
    };

    // 4. Append to Google Sheets
    await sheets.appendDonor(newDonorRecord);

    // 5. Append to Audit Log
    await appendAuditLog({
      timestamp: nowIso,
      adminId: admin?.adminId || 'UNKNOWN',
      action: 'DONOR_REGISTRATION',
      donorId: newDonorId,
      result: 'SUCCESS',
    });

    return newDonorRecord;
  });
}

/**
 * Update donor record with PRN duplicate check and audit logging
 */
async function updateDonorRecord(donorId, updates, admin) {
  const validationErrors = validateDonorInput(updates, true);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(' '));
  }

  return await globalLock.runExclusive(async () => {
    const currentDonors = await sheets.getAllDonors();
    const target = currentDonors.find((d) => d.donorId === donorId);
    if (!target) {
      throw new Error(`Donor with ID ${donorId} does not exist.`);
    }

    // If updating PRN, check duplicate
    if (updates.prn) {
      const normPRN = normalizePRN(updates.prn);
      const duplicate = currentDonors.find(
        (d) => d.donorId !== donorId && normalizePRN(d.prn) === normPRN
      );
      if (duplicate) {
        throw new Error(
          `Cannot update: PRN "${updates.prn}" is already registered for another donor (${duplicate.donorId}).`
        );
      }
    }

    const nowIso = new Date().toISOString();
    const cleanUpdates = { ...updates };

    // Format fields
    if (cleanUpdates.bloodGroup) {
      cleanUpdates.bloodGroup = String(cleanUpdates.bloodGroup).toUpperCase().trim();
    }
    if (cleanUpdates.previousDonation) {
      cleanUpdates.previousDonation = String(cleanUpdates.previousDonation).toLowerCase() === 'yes' ? 'Yes' : 'No';
    }
    if (cleanUpdates.contactConsent) {
      const isYes = String(cleanUpdates.contactConsent).toLowerCase() === 'yes';
      cleanUpdates.contactConsent = isYes ? 'Yes' : 'No';
      if (isYes && !target.consentTimestamp) {
        cleanUpdates.consentTimestamp = nowIso;
      }
    }

    // Handle status verification changes
    if (cleanUpdates.verificationStatus && cleanUpdates.verificationStatus !== target.verificationStatus) {
      if (cleanUpdates.verificationStatus === 'Verified') {
        cleanUpdates.verifiedBy = `${admin?.adminId} (${admin?.name})`;
        cleanUpdates.verifiedAt = nowIso;
      } else {
        cleanUpdates.verifiedBy = '';
        cleanUpdates.verifiedAt = '';
      }
    }

    cleanUpdates.updatedAt = nowIso;

    const updated = await sheets.updateDonor(donorId, cleanUpdates);

    // Audit log
    let actionType = 'DONOR_UPDATE';
    if (cleanUpdates.verificationStatus === 'Verified' && target.verificationStatus !== 'Verified') {
      actionType = 'DONOR_VERIFIED';
    } else if (cleanUpdates.verificationStatus === 'Rejected' && target.verificationStatus !== 'Rejected') {
      actionType = 'DONOR_REJECTED';
    }

    await appendAuditLog({
      timestamp: nowIso,
      adminId: admin?.adminId || 'UNKNOWN',
      action: actionType,
      donorId,
      result: 'SUCCESS',
    });

    return updated;
  });
}

/**
 * Delete a donor record with confirmation and audit logging
 */
async function deleteDonorRecord(donorId, admin) {
  return await globalLock.runExclusive(async () => {
    const currentDonors = await sheets.getAllDonors();
    const target = currentDonors.find((d) => d.donorId === donorId);
    if (!target) {
      throw new Error(`Donor with ID ${donorId} does not exist.`);
    }

    await sheets.deleteDonor(donorId);

    const nowIso = new Date().toISOString();
    await appendAuditLog({
      timestamp: nowIso,
      adminId: admin?.adminId || 'UNKNOWN',
      action: 'DONOR_DELETED',
      donorId,
      result: 'SUCCESS',
    });

    return { success: true, donorId };
  });
}

module.exports = {
  VALID_BLOOD_GROUPS,
  VALID_YEARS,
  normalizePRN,
  generateNextDonorId,
  validateDonorInput,
  calculateSummaryStats,
  registerDonor,
  updateDonorRecord,
  deleteDonorRecord,
};
