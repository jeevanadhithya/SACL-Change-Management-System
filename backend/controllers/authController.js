const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { signToken } = require('../middleware/authMiddleware');

exports.login = async (req, res) => {
  try {
    const { employeeId, username, password } = req.body || {};
    const identifier = (employeeId || username || '').trim();
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Username / Employee ID and Password are required.' });
    }

    const result = await query(
      `SELECT TOP 1
         u.id, u.employeeId, u.name, u.email, u.role, u.department, u.title,
         u.facility, u.companyId, u.passwordHash, u.active,
         c.code AS companyCode,
         CASE WHEN c.id IS NOT NULL THEN CONCAT(c.name, ' (', c.unitName, ')') ELSE NULL END AS companyName
       FROM dbo.Users u
       LEFT JOIN dbo.Companies c ON u.companyId = c.id
       WHERE UPPER(u.employeeId) = UPPER(@identifier) AND u.active = 1`,
      { identifier },
    );

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid Username / Employee ID or inactive account.' });
    }

    const isBcrypt = user.passwordHash && user.passwordHash.startsWith('$2');
    const valid = isBcrypt
      ? await bcrypt.compare(password, user.passwordHash)
      : password === user.passwordHash;

    if (!valid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const { passwordHash: _removed, ...safeUser } = user;
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
      `SELECT TOP 1
         u.id, u.employeeId, u.name, u.email, u.role, u.department, u.title,
         u.facility, u.companyId, u.active,
         c.code AS companyCode,
         CASE WHEN c.id IS NOT NULL THEN CONCAT(c.name, ' (', c.unitName, ')') ELSE NULL END AS companyName
       FROM dbo.Users u
       LEFT JOIN dbo.Companies c ON u.companyId = c.id
       WHERE u.id = @id AND u.active = 1`,
      { id: req.user.id },
    );
    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ error: 'Session user not found or inactive.' });
    }
    return res.json({ user, claims: req.user });
  } catch (err) {
    console.error('authController.me error:', err);
    return res.status(500).json({ error: 'Unable to validate session.' });
  }
};

exports.getUsers = async (_req, res) => {
  try {
    const result = await query(
      `SELECT
         u.id, u.employeeId, u.name, u.email, u.role, u.department, u.title,
         u.facility, u.companyId, u.active,
         c.code AS companyCode,
         CASE WHEN c.id IS NOT NULL THEN CONCAT(c.name, ' (', c.unitName, ')') ELSE NULL END AS companyName
       FROM dbo.Users u
       LEFT JOIN dbo.Companies c ON u.companyId = c.id
       ORDER BY u.createdAt ASC`,
    );
    return res.json({ users: result.recordset });
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
      role,
      department,
      title,
      facility,
      companyId,
      password,
    } = req.body || {};

    const rawLogin = (username || employeeId || '').trim();
    if (!rawLogin || !name?.trim()) {
      return res.status(400).json({ error: 'Username / Employee ID and Name are required.' });
    }
    const rawPassword = (password || 'password123').trim();
    if (rawPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const id = `u-${Date.now()}`;
    const normalizedId = rawLogin.toUpperCase();
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    await query(
      `INSERT INTO dbo.Users (id, employeeId, name, email, role, department, title, facility, companyId, passwordHash, active)
       VALUES (@id, @employeeId, @name, @email, @role, @department, @title, @facility, @companyId, @passwordHash, 1)`,
      {
        id,
        employeeId: normalizedId,
        name: name.trim(),
        email: email?.trim() || `${normalizedId.toLowerCase()}@sakthiauto.com`,
        role: role || 'EMPLOYEE',
        department: department?.trim() || 'Machine Shop',
        title: title?.trim() || 'Engineer',
        facility: facility || 'Machine Shop',
        companyId: companyId || null,
        passwordHash,
      },
    );

    const createdRes = await query(
      `SELECT TOP 1
         u.id, u.employeeId, u.name, u.email, u.role, u.department, u.title,
         u.facility, u.companyId, u.active,
         c.code AS companyCode,
         CASE WHEN c.id IS NOT NULL THEN CONCAT(c.name, ' (', c.unitName, ')') ELSE NULL END AS companyName
       FROM dbo.Users u
       LEFT JOIN dbo.Companies c ON u.companyId = c.id
       WHERE u.id = @id`,
      { id },
    );

    return res.status(201).json({ user: createdRes.recordset[0] });
  } catch (err) {
    console.error('authController.createUser error:', err);
    return res.status(500).json({ error: 'Unable to create user.' });
  }
};
