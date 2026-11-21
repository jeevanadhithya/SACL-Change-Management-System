const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { signToken } = require('../middleware/authMiddleware');

const USER_SELECT_FIELDS = `
  u.id, u.employeeId, u.username, u.name, u.email, u.phone, u.role, u.department, u.title,
  u.facility, u.plantLocation, u.bio, u.avatarInitials,
  u.emailNotifications, u.inAppNotifications, u.companyId, u.active, u.updatedAt,
  c.code AS companyCode,
  CASE WHEN c.id IS NOT NULL THEN CONCAT(c.name, ' (', c.unitName, ')') ELSE NULL END AS companyName
`;

const VALID_FACILITIES = ['Foundry', 'Machine Shop', 'Quality', 'Corporate'];

function verifyStoredPassword(plain, stored) {
  if (!plain || !stored) return false;
  if (stored.startsWith('scrypt$')) {
    const parts = stored.split('$');
    if (parts.length !== 3) return false;
    const [, salt, hex] = parts;
    const expected = Buffer.from(hex, 'hex');
    const actual = crypto.scryptSync(plain, salt, expected.length);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  }
  return plain === stored;
}

function normalizeUserRow(row) {
  if (!row) return null;
  return {
    ...row,
    username: row.username || row.employeeId,
    phone: row.phone || '',
    plantLocation: row.plantLocation || '',
    bio: row.bio || '',
    avatarInitials: row.avatarInitials || '',
    emailNotifications: row.emailNotifications !== undefined ? Boolean(row.emailNotifications) : true,
    inAppNotifications: row.inAppNotifications !== undefined ? Boolean(row.inAppNotifications) : true,
    active: Boolean(row.active),
  };
}

exports.getPortalAccounts = async (_req, res) => {
  try {
    const result = await query(
      `SELECT
         u.id,
         u.employeeId,
         COALESCE(u.username, u.employeeId) AS username,
         u.name,
         u.role,
         c.code AS companyCode
       FROM dbo.Users u
       LEFT JOIN dbo.Companies c ON u.companyId = c.id
       WHERE u.active = 1
       ORDER BY
         CASE u.role
           WHEN N'EMPLOYEE'     THEN 1
           WHEN N'HOD'          THEN 2
           WHEN N'HOF'          THEN 3
           WHEN N'COF'          THEN 4
           WHEN N'CFT'          THEN 5
           WHEN N'CFT_LEADER'   THEN 6
           WHEN N'PLANT_HEAD'   THEN 7
           WHEN N'ADMIN'        THEN 8
           WHEN N'COMPANY_USER' THEN 9
           ELSE 10
         END,
         COALESCE(u.username, u.employeeId) ASC`,
    );
    return res.json({ accounts: result.recordset });
  } catch (err) {
    console.error('authController.getPortalAccounts error:', err);
    return res.status(500).json({ error: 'Unable to load portal accounts from database.' });
  }
};

exports.login = async (req, res) => {
  try {
    const { employeeId, username, password } = req.body || {};
    const identifier = (employeeId || username || '').trim();
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username / Employee ID and Password are required.' });
    }

    const result = await query(
      `SELECT TOP 1
         ${USER_SELECT_FIELDS},
         u.passwordHash
       FROM dbo.Users u
       LEFT JOIN dbo.Companies c ON u.companyId = c.id
       WHERE (UPPER(u.employeeId) = UPPER(@identifier) OR UPPER(ISNULL(u.username, '')) = UPPER(@identifier))
         AND u.active = 1`,
      { identifier },
    );

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid Username / Employee ID or inactive account.' });
    }

    const isBcrypt = user.passwordHash && user.passwordHash.startsWith('$2');
    const valid = isBcrypt
      ? await bcrypt.compare(password, user.passwordHash)
      : verifyStoredPassword(password, user.passwordHash);

    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const { passwordHash: _removed, ...rest } = user;
    const safeUser = normalizeUserRow(rest);
    const token = signToken(safeUser);
    return res.json({ user: safeUser, token });
  } catch (err) {
    console.error('authController.login error:', err);
    return res.status(500).json({ error: 'Authentication service error.' });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await query(
      `SELECT TOP 1 ${USER_SELECT_FIELDS}
       FROM dbo.Users u
       LEFT JOIN dbo.Companies c ON u.companyId = c.id
       WHERE u.id = @id AND u.active = 1`,
      { id: req.user.id },
    );
    const user = normalizeUserRow(result.recordset[0]);
    if (!user) {
      return res.status(401).json({ error: 'Session user not found or inactive.' });
    }
    return res.json({ user, claims: req.user });
  } catch (err) {
    console.error('authController.me error:', err);
    return res.status(500).json({ error: 'Unable to validate session.' });
  }
};

exports.updateOwnProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      department,
      title,
      facility,
      plantLocation,
      bio,
      avatarInitials,
      emailNotifications,
      inAppNotifications,
    } = req.body || {};

    if (name !== undefined && String(name).trim().length < 2) {
      return res.status(400).json({ error: 'Full Name must be at least 2 characters long.' });
    }
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (facility !== undefined && !VALID_FACILITIES.includes(facility)) {
      return res.status(400).json({ error: 'Invalid facility selection.' });
    }

    const cleanedInitials =
      avatarInitials !== undefined
        ? String(avatarInitials)
            .replace(/[^a-zA-Z0-9]/g, '')
            .toUpperCase()
            .slice(0, 3)
        : null;

    await query(
      `UPDATE dbo.Users
       SET name = COALESCE(@name, name),
           email = COALESCE(@email, email),
           phone = CASE WHEN @hasPhone = 1 THEN @phone ELSE phone END,
           department = COALESCE(@department, department),
           title = COALESCE(@title, title),
           facility = COALESCE(@facility, facility),
           plantLocation = CASE WHEN @hasPlantLocation = 1 THEN @plantLocation ELSE plantLocation END,
           bio = CASE WHEN @hasBio = 1 THEN @bio ELSE bio END,
           avatarInitials = CASE WHEN @hasInitials = 1 THEN @avatarInitials ELSE avatarInitials END,
           emailNotifications = COALESCE(@emailNotifications, emailNotifications),
           inAppNotifications = COALESCE(@inAppNotifications, inAppNotifications),
           updatedAt = SYSUTCDATETIME()
       WHERE id = @id AND active = 1`,
      {
        id: req.user.id,
        name: name !== undefined ? String(name).trim() : null,
        email: email !== undefined ? String(email).trim() : null,
        hasPhone: phone !== undefined ? 1 : 0,
        phone: phone !== undefined ? String(phone).trim().slice(0, 32) : null,
        department: department !== undefined && String(department).trim() ? String(department).trim() : null,
        title: title !== undefined && String(title).trim() ? String(title).trim() : null,
        facility: facility || null,
        hasPlantLocation: plantLocation !== undefined ? 1 : 0,
        plantLocation: plantLocation !== undefined ? String(plantLocation).trim().slice(0, 150) : null,
        hasBio: bio !== undefined ? 1 : 0,
        bio: bio !== undefined ? String(bio).trim().slice(0, 500) : null,
        hasInitials: avatarInitials !== undefined ? 1 : 0,
        avatarInitials: cleanedInitials,
        emailNotifications: typeof emailNotifications === 'boolean' ? (emailNotifications ? 1 : 0) : null,
        inAppNotifications: typeof inAppNotifications === 'boolean' ? (inAppNotifications ? 1 : 0) : null,
      },
    );

    const updatedRes = await query(
      `SELECT TOP 1 ${USER_SELECT_FIELDS}
       FROM dbo.Users u
       LEFT JOIN dbo.Companies c ON u.companyId = c.id
       WHERE u.id = @id`,
      { id: req.user.id },
    );

    const updatedUser = normalizeUserRow(updatedRes.recordset[0]);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const freshToken = signToken(updatedUser);
    return res.json({ user: updatedUser, token: freshToken });
  } catch (err) {
    console.error('authController.updateOwnProfile error:', err);
    return res.status(500).json({ error: 'Unable to update your profile.' });
  }
};

exports.changeOwnPassword = async (req, res) => {
  try {
    const currentPassword = String(req.body?.currentPassword || '').trim();
    const newPassword = String(req.body?.newPassword || '').trim();

    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required.' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'New password must be different from your current password.' });
    }

    const userRes = await query(
      `SELECT TOP 1 id, passwordHash FROM dbo.Users WHERE id = @id AND active = 1`,
      { id: req.user.id },
    );
    const row = userRes.recordset[0];
    if (!row) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const isBcrypt = row.passwordHash && row.passwordHash.startsWith('$2');
    const valid = isBcrypt
      ? await bcrypt.compare(currentPassword, row.passwordHash)
      : verifyStoredPassword(currentPassword, row.passwordHash);

    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query(
      `UPDATE dbo.Users SET passwordHash = @passwordHash, updatedAt = SYSUTCDATETIME() WHERE id = @id`,
      { id: req.user.id, passwordHash },
    );

    const refreshed = await query(
      `SELECT TOP 1 ${USER_SELECT_FIELDS}
       FROM dbo.Users u
       LEFT JOIN dbo.Companies c ON u.companyId = c.id
       WHERE u.id = @id`,
      { id: req.user.id },
    );

    return res.json({ ok: true, user: normalizeUserRow(refreshed.recordset[0]) });
  } catch (err) {
    console.error('authController.changeOwnPassword error:', err);
    return res.status(500).json({ error: 'Unable to change your password.' });
  }
};

exports.getUsers = async (_req, res) => {
  try {
    const result = await query(
      `SELECT ${USER_SELECT_FIELDS}
       FROM dbo.Users u
       LEFT JOIN dbo.Companies c ON u.companyId = c.id
       ORDER BY u.createdAt ASC`,
    );
    return res.json({ users: result.recordset.map(normalizeUserRow) });
  } catch (err) {
    console.error('authController.getUsers error:', err);
    return res.status(500).json({ error: 'Unable to load users.' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      employeeId,
      username,
      name,
      email,
      phone,
      role,
      department,
      title,
      facility,
      plantLocation,
      bio,
      companyId,
      password,
    } = req.body || {};

    const rawLogin = (username || employeeId || '').trim();
    if (!rawLogin || !name?.trim()) {
      return res.status(400).json({ error: 'Username / Employee ID and Name are required.' });
    }
    const rawPassword = (password || '').trim();
    if (rawPassword.length < 4) {
      return res.status(400).json({ error: 'Password is required and must be at least 4 characters long.' });
    }

    const id = `u-${Date.now()}`;
    const normalizedId = rawLogin.toUpperCase();
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    await query(
      `INSERT INTO dbo.Users
        (id, employeeId, username, name, email, phone, role, department, title, facility, plantLocation, bio, companyId, passwordHash, active)
       VALUES
        (@id, @employeeId, @username, @name, @email, @phone, @role, @department, @title, @facility, @plantLocation, @bio, @companyId, @passwordHash, 1)`,
      {
        id,
        employeeId: normalizedId,
        username: rawLogin,
        name: name.trim(),
        email: email?.trim() || `${normalizedId.toLowerCase()}@sakthiauto.com`,
        phone: phone?.trim() || null,
        role: role || 'EMPLOYEE',
        department: department?.trim() || 'Machine Shop',
        title: title?.trim() || 'Engineer',
        facility: facility || 'Machine Shop',
        plantLocation: plantLocation?.trim() || null,
        bio: bio?.trim() || null,
        companyId: companyId || null,
        passwordHash,
      },
    );

    const createdRes = await query(
      `SELECT TOP 1 ${USER_SELECT_FIELDS}
       FROM dbo.Users u
       LEFT JOIN dbo.Companies c ON u.companyId = c.id
       WHERE u.id = @id`,
      { id },
    );

    return res.status(201).json({ user: normalizeUserRow(createdRes.recordset[0]) });
  } catch (err) {
    console.error('authController.createUser error:', err);
    return res.status(500).json({ error: 'Unable to create user.' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, department, title, facility, plantLocation, bio, companyId, active } = req.body || {};

    if (id === req.user?.id) {
      if (active === false) {
        return res.status(400).json({ error: 'You cannot deactivate your own active Administrator account.' });
      }
      if (role && role !== 'ADMIN') {
        return res.status(400).json({ error: 'You cannot remove Administrator role from your own account.' });
      }
    }

    await query(
      `UPDATE dbo.Users
       SET name = COALESCE(@name, name),
           email = COALESCE(@email, email),
           phone = COALESCE(@phone, phone),
           role = COALESCE(@role, role),
           department = COALESCE(@department, department),
           title = COALESCE(@title, title),
           facility = COALESCE(@facility, facility),
           plantLocation = COALESCE(@plantLocation, plantLocation),
           bio = COALESCE(@bio, bio),
           companyId = CASE WHEN @hasCompanyId = 1 THEN @companyId ELSE companyId END,
           active = COALESCE(@active, active),
           updatedAt = SYSUTCDATETIME()
       WHERE id = @id`,
      {
        id,
        name: name?.trim() || null,
        email: email !== undefined ? email.trim() : null,
        phone: phone !== undefined ? phone.trim() : null,
        role: role || null,
        department: department?.trim() || null,
        title: title?.trim() || null,
        facility: facility || null,
        plantLocation: plantLocation !== undefined ? plantLocation.trim() : null,
        bio: bio !== undefined ? bio.trim() : null,
        hasCompanyId: companyId !== undefined ? 1 : 0,
        companyId: companyId || null,
        active: typeof active === 'boolean' ? (active ? 1 : 0) : null,
      },
    );

    const updatedRes = await query(
      `SELECT TOP 1 ${USER_SELECT_FIELDS}
       FROM dbo.Users u
       LEFT JOIN dbo.Companies c ON u.companyId = c.id
       WHERE u.id = @id`,
      { id },
    );

    if (!updatedRes.recordset[0]) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    return res.json({ user: normalizeUserRow(updatedRes.recordset[0]) });
  } catch (err) {
    console.error('authController.updateUser error:', err);
    return res.status(500).json({ error: 'Unable to update user account.' });
  }
};

exports.changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const rawPassword = (req.body?.password || '').trim();
    if (rawPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
    }

    const passwordHash = await bcrypt.hash(rawPassword, 10);
    await query(
      `UPDATE dbo.Users SET passwordHash = @passwordHash, updatedAt = SYSUTCDATETIME() WHERE id = @id`,
      { id, passwordHash },
    );

    const userRes = await query(
      `SELECT TOP 1 ${USER_SELECT_FIELDS}
       FROM dbo.Users u
       LEFT JOIN dbo.Companies c ON u.companyId = c.id
       WHERE u.id = @id`,
      { id },
    );

    if (!userRes.recordset[0]) {
      return res.status(404).json({ error: 'User account not found.' });
    }
    return res.json({ ok: true, user: normalizeUserRow(userRes.recordset[0]) });
  } catch (err) {
    console.error('authController.changeUserPassword error:', err);
    return res.status(500).json({ error: 'Unable to change user password.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'You cannot delete your own currently signed-in account.' });
    }

    const existing = await query(`SELECT TOP 1 id FROM dbo.Users WHERE id = @id`, { id });
    if (!existing.recordset[0]) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    await query(`DELETE FROM dbo.Users WHERE id = @id`, { id });
    return res.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error('authController.deleteUser error:', err);
    return res.status(500).json({ error: 'Unable to delete user account.' });
  }
};
