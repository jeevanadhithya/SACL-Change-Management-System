const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { signToken } = require('../middleware/authMiddleware');

exports.login = async (req, res) => {
  try {
    const { employeeId, password } = req.body || {};
    if (!employeeId || !password) {
      return res.status(400).json({ error: 'Employee ID and Password are required.' });
    }

    const result = await query(
      `SELECT TOP 1 id, employeeId, name, email, role, department, title, facility, companyId, passwordHash, active
       FROM dbo.Users
       WHERE UPPER(employeeId) = UPPER(@employeeId) AND active = 1`,
      { employeeId: employeeId.trim() },
    );

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid Employee ID or inactive account.' });
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

exports.getUsers = async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, employeeId, name, email, role, department, title, facility, companyId, active
       FROM dbo.Users
       ORDER BY createdAt ASC`,
    );
    return res.json({ users: result.recordset });
  } catch (err) {
    console.error('authController.getUsers error:', err);
    return res.status(500).json({ error: 'Unable to load users.' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { employeeId, name, email, role, department, title, facility, companyId, password } =
      req.body || {};
    if (!employeeId || !name) {
      return res.status(400).json({ error: 'Employee ID and Name are required.' });
    }

    const id = `u-${Date.now()}`;
    const normalizedId = employeeId.trim().toUpperCase();
    const passwordHash = await bcrypt.hash(password || 'password123', 10);

    await query(
      `INSERT INTO dbo.Users (id, employeeId, name, email, role, department, title, facility, companyId, passwordHash, active)
       VALUES (@id, @employeeId, @name, @email, @role, @department, @title, @facility, @companyId, @passwordHash, 1)`,
      {
        id,
        employeeId: normalizedId,
        name: name.trim(),
        email: email || `${normalizedId.toLowerCase()}@sakthiauto.com`,
        role: role || 'EMPLOYEE',
        department: department || 'Machine Shop',
        title: title || 'Engineer',
        facility: facility || 'Machine Shop',
        companyId: companyId || null,
        passwordHash,
      },
    );

    return res.status(201).json({
      user: {
        id,
        employeeId: normalizedId,
        name: name.trim(),
        email: email || `${normalizedId.toLowerCase()}@sakthiauto.com`,
        role: role || 'EMPLOYEE',
        department: department || 'Machine Shop',
        title: title || 'Engineer',
        facility: facility || 'Machine Shop',
        companyId: companyId || null,
        active: true,
      },
    });
  } catch (err) {
    console.error('authController.createUser error:', err);
    return res.status(500).json({ error: 'Unable to create user.' });
  }
};
