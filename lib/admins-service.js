const bcrypt = require('bcryptjs');
const sheets = require('./google-sheets');
const { appendAuditLog } = require('./google-sheets');

// Default initial credentials (overridable via environment variables)
const OWNER_CONFIG = {
  adminId: 'ADM-001',
  name: process.env.OWNER_NAME || 'Owner (Me)',
  email: (process.env.OWNER_EMAIL || 'kunalgavit263@gmail.com').toLowerCase().trim(),
  role: 'owner',
  defaultPassword: process.env.OWNER_PASSWORD || 'kunal@2026',
};

const SECOND_ADMIN_CONFIG = {
  adminId: 'ADM-002',
  name: process.env.SECOND_ADMIN_NAME || 'Second Admin (Friend)',
  email: (process.env.SECOND_ADMIN_EMAIL || 'pranav.m@gmail.com').toLowerCase().trim(),
  role: 'admin',
  defaultPassword: process.env.SECOND_ADMIN_PASSWORD || 'Pranav@2026',
};

// In-memory password store (hashes) if not using external auth provider
const passwordHashes = new Map();

async function initPasswordHashes() {
  if (!passwordHashes.has(OWNER_CONFIG.email)) {
    const ownerHash = process.env.OWNER_PASSWORD_HASH || (await bcrypt.hash(OWNER_CONFIG.defaultPassword, 10));
    passwordHashes.set(OWNER_CONFIG.email, ownerHash);
  }
  if (!passwordHashes.has(SECOND_ADMIN_CONFIG.email)) {
    const friendHash = process.env.SECOND_ADMIN_PASSWORD_HASH || (await bcrypt.hash(SECOND_ADMIN_CONFIG.defaultPassword, 10));
    passwordHashes.set(SECOND_ADMIN_CONFIG.email, friendHash);
  }
}

/**
 * Verify credentials and check active status in Google Sheets Admins sheet
 */
async function authenticateAdmin(email, plainPassword) {
  await initPasswordHashes();
  const normalizedEmail = String(email || '').toLowerCase().trim();

  // Find admin account
  const storedHash = passwordHashes.get(normalizedEmail);
  if (!storedHash) {
    return { success: false, error: 'Invalid email or credentials.' };
  }

  const isPasswordValid = await bcrypt.compare(plainPassword, storedHash);
  if (!isPasswordValid) {
    return { success: false, error: 'Invalid email or credentials.' };
  }

  // Check authorization and active status against Google Sheets Admins worksheet
  const admins = await sheets.getAllAdmins();
  let adminRecord = admins.find(
    (a) => a.email.toLowerCase().trim() === normalizedEmail
  );

  // If Admins sheet is empty or admin not yet recorded, initialize record
  if (!adminRecord) {
    if (normalizedEmail === OWNER_CONFIG.email) {
      adminRecord = {
        adminId: OWNER_CONFIG.adminId,
        name: OWNER_CONFIG.name,
        email: OWNER_CONFIG.email,
        role: 'owner',
        activeStatus: 'active',
        createdAt: new Date().toISOString(),
      };
      await sheets.appendAdmin(adminRecord);
    } else if (normalizedEmail === SECOND_ADMIN_CONFIG.email) {
      adminRecord = {
        adminId: SECOND_ADMIN_CONFIG.adminId,
        name: SECOND_ADMIN_CONFIG.name,
        email: SECOND_ADMIN_CONFIG.email,
        role: 'admin',
        activeStatus: 'active',
        createdAt: new Date().toISOString(),
      };
      await sheets.appendAdmin(adminRecord);
    } else {
      return { success: false, error: 'Unauthorized administrator account.' };
    }
  }

  // Strict check on active status
  if (adminRecord.activeStatus !== 'active') {
    return {
      success: false,
      error: 'Administrator access for this account has been revoked by the owner.',
    };
  }

  return {
    success: true,
    admin: {
      adminId: adminRecord.adminId,
      name: adminRecord.name,
      email: adminRecord.email,
      role: adminRecord.role,
      activeStatus: adminRecord.activeStatus,
    },
  };
}

/**
 * Get all administrators (Owner can view, verify roles)
 */
async function getAdminList() {
  const admins = await sheets.getAllAdmins();
  // Ensure owner and second admin are represented
  if (admins.length === 0) {
    return [
      {
        adminId: OWNER_CONFIG.adminId,
        name: OWNER_CONFIG.name,
        email: OWNER_CONFIG.email,
        role: 'owner',
        activeStatus: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        adminId: SECOND_ADMIN_CONFIG.adminId,
        name: SECOND_ADMIN_CONFIG.name,
        email: SECOND_ADMIN_CONFIG.email,
        role: 'admin',
        activeStatus: 'active',
        createdAt: new Date().toISOString(),
      },
    ];
  }
  return admins;
}

/**
 * Update or revoke second administrator (Owner only)
 */
async function updateSecondAdmin(updates, actingAdmin) {
  if (actingAdmin.role !== 'owner') {
    throw new Error('Forbidden: Only the Owner can manage administrator accounts.');
  }

  const admins = await sheets.getAllAdmins();
  const secondAdmin = admins.find((a) => a.adminId === SECOND_ADMIN_CONFIG.adminId || a.role === 'admin');

  if (!secondAdmin) {
    throw new Error('Second administrator account not found.');
  }

  const allowedUpdates = {};
  if (updates.name) allowedUpdates.name = String(updates.name).trim();
  if (updates.email) {
    const newEmail = String(updates.email).toLowerCase().trim();
    allowedUpdates.email = newEmail;
    // Update hash key mapping if email changed
    const oldHash = passwordHashes.get(secondAdmin.email.toLowerCase().trim());
    if (oldHash) {
      passwordHashes.delete(secondAdmin.email.toLowerCase().trim());
      passwordHashes.set(newEmail, oldHash);
    }
  }
  if (updates.activeStatus) {
    if (!['active', 'revoked'].includes(updates.activeStatus)) {
      throw new Error('Invalid activeStatus. Must be "active" or "revoked".');
    }
    allowedUpdates.activeStatus = updates.activeStatus;
  }
  if (updates.newPassword && String(updates.newPassword).length >= 6) {
    const newHash = await bcrypt.hash(String(updates.newPassword), 10);
    const targetEmail = allowedUpdates.email || secondAdmin.email.toLowerCase().trim();
    passwordHashes.set(targetEmail, newHash);
  }

  const updated = await sheets.updateAdmin(secondAdmin.adminId, allowedUpdates);

  await appendAuditLog({
    timestamp: new Date().toISOString(),
    adminId: actingAdmin.adminId,
    action: allowedUpdates.activeStatus === 'revoked' ? 'ADMIN_REVOKED' : 'ADMIN_UPDATED',
    donorId: '',
    result: `Updated ${secondAdmin.adminId} (${allowedUpdates.activeStatus || 'details'})`,
  });

  return updated;
}

module.exports = {
  OWNER_CONFIG,
  SECOND_ADMIN_CONFIG,
  authenticateAdmin,
  getAdminList,
  updateSecondAdmin,
  initPasswordHashes,
};
