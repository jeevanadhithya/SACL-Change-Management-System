const { query } = require('../config/db');

exports.getCompanies = async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, code, name, unitName, facilityType, location, gstOrRegNo, contactEmail, active, createdAt
       FROM dbo.Companies
       ORDER BY createdAt DESC`,
    );
    return res.json({ companies: result.recordset });
  } catch (err) {
    console.error('companyController.getCompanies error:', err);
    return res.status(500).json({ error: 'Failed to load companies.' });
  }
};

exports.createCompany = async (req, res) => {
  try {
    const { code, name, unitName, facilityType, location, gstOrRegNo, contactEmail } =
      req.body || {};
    if (!code || !name || !location) {
      return res.status(400).json({
        error: 'Company Code, Company Name, and Location are required.',
      });
    }

    const id = `comp-${Date.now()}`;
    const normalizedCode = code.trim().toUpperCase();

    await query(
      `INSERT INTO dbo.Companies (id, code, name, unitName, facilityType, location, gstOrRegNo, contactEmail, active)
       VALUES (@id, @code, @name, @unitName, @facilityType, @location, @gstOrRegNo, @contactEmail, 1)`,
      {
        id,
        code: normalizedCode,
        name: name.trim(),
        unitName: (unitName || 'Machine Shop & Foundry').trim(),
        facilityType: facilityType || 'Machine Shop',
        location: location.trim(),
        gstOrRegNo: gstOrRegNo || '',
        contactEmail: contactEmail || '',
      },
    );

    return res.status(201).json({
      company: {
        id,
        code: normalizedCode,
        name: name.trim(),
        unitName: (unitName || 'Machine Shop & Foundry').trim(),
        facilityType: facilityType || 'Machine Shop',
        location: location.trim(),
        gstOrRegNo: gstOrRegNo || '',
        contactEmail: contactEmail || '',
        active: true,
      },
    });
  } catch (err) {
    console.error('companyController.createCompany error:', err);
    return res.status(500).json({ error: 'Failed to create company.' });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, unitName, facilityType, location, gstOrRegNo, contactEmail, active } =
      req.body || {};

    await query(
      `UPDATE dbo.Companies
       SET name = COALESCE(@name, name),
           unitName = COALESCE(@unitName, unitName),
           facilityType = COALESCE(@facilityType, facilityType),
           location = COALESCE(@location, location),
           gstOrRegNo = COALESCE(@gstOrRegNo, gstOrRegNo),
           contactEmail = COALESCE(@contactEmail, contactEmail),
           active = COALESCE(@active, active)
       WHERE id = @id`,
      {
        id,
        name: name || null,
        unitName: unitName || null,
        facilityType: facilityType || null,
        location: location || null,
        gstOrRegNo: gstOrRegNo ?? null,
        contactEmail: contactEmail ?? null,
        active: typeof active === 'boolean' ? (active ? 1 : 0) : null,
      },
    );

    const updated = await query(`SELECT * FROM dbo.Companies WHERE id = @id`, { id });
    if (!updated.recordset[0]) {
      return res.status(404).json({ error: 'Company not found.' });
    }
    return res.json({ company: updated.recordset[0] });
  } catch (err) {
    console.error('companyController.updateCompany error:', err);
    return res.status(500).json({ error: 'Failed to update company.' });
  }
};
