const { query } = require('../config/db');

exports.getDepartments = async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM dbo.Departments ORDER BY name ASC`);
    return res.json({ departments: result.recordset });
  } catch (err) {
    console.error('departmentController.getDepartments error:', err);
    return res.status(500).json({ error: 'Unable to load departments.' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { code, name, facility, hodName, memberCount } = req.body || {};
    if (!code || !name) {
      return res.status(400).json({ error: 'Department Code and Name are required.' });
    }

    const id = `dept-${Date.now()}`;
    await query(
      `INSERT INTO dbo.Departments (id, code, name, facility, hodName, memberCount)
       VALUES (@id, @code, @name, @facility, @hodName, @memberCount)`,
      {
        id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        facility: facility || 'Machine Shop',
        hodName: hodName || '',
        memberCount: Number(memberCount) || 1,
      },
    );

    return res.status(201).json({
      department: {
        id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        facility: facility || 'Machine Shop',
        hodName: hodName || '',
        memberCount: Number(memberCount) || 1,
      },
    });
  } catch (err) {
    console.error('departmentController.createDepartment error:', err);
    return res.status(500).json({ error: 'Unable to create department.' });
  }
};
