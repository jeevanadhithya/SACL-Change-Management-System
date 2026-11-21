const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

function mapCompanyFacility(facilityType) {
  if (facilityType === 'Foundry') return 'Foundry';
  if (facilityType === 'Corporate') return 'Corporate';
  return 'Machine Shop';
}

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
    const {
      code,
      name,
      unitName,
      facilityType,
      location,
      gstOrRegNo,
      contactEmail,
      initialAccount,
    } = req.body || {};

    if (!code || !name || !location) {
      return res.status(400).json({
        error: 'Company Code, Company Name, and Location are required.',
      });
    }

    const id = `comp-${Date.now()}`;
    const normalizedCode = code.trim().toUpperCase();
    const resolvedUnit = (unitName || 'Machine Shop & Foundry').trim();
    const resolvedFacility = facilityType || 'Machine Shop';

    await query(
      `INSERT INTO dbo.Companies (id, code, name, unitName, facilityType, location, gstOrRegNo, contactEmail, active)
       VALUES (@id, @code, @name, @unitName, @facilityType, @location, @gstOrRegNo, @contactEmail, 1)`,
      {
        id,
        code: normalizedCode,
        name: name.trim(),
        unitName: resolvedUnit,
        facilityType: resolvedFacility,
        location: location.trim(),
        gstOrRegNo: gstOrRegNo || '',
        contactEmail: contactEmail || '',
      },
    );

    let createdAccount = null;
    if (initialAccount && initialAccount.username && initialAccount.name && initialAccount.password) {
      const accId = `u-${Date.now()}`;
      const empId = initialAccount.username.trim().toUpperCase();
      const passwordHash = await bcrypt.hash(initialAccount.password.trim(), 10);
      await query(
        `INSERT INTO dbo.Users (id, employeeId, name, email, role, department, title, facility, companyId, passwordHash, active)
         VALUES (@id, @employeeId, @name, @email, @role, @department, @title, @facility, @companyId, @passwordHash, 1)`,
        {
          id: accId,
          employeeId: empId,
          name: initialAccount.name.trim(),
          email: initialAccount.email?.trim() || `${empId.toLowerCase()}@sakthiauto.com`,
          role: initialAccount.role || 'COMPANY_USER',
          department: initialAccount.department?.trim() || resolvedUnit,
          title: `${normalizedCode} ${initialAccount.role || 'COMPANY_USER'}`,
          facility: mapCompanyFacility(resolvedFacility),
          companyId: id,
          passwordHash,
        },
      );
      createdAccount = {
        id: accId,
        employeeId: empId,
        username: initialAccount.username.trim(),
        name: initialAccount.name.trim(),
        email: initialAccount.email?.trim() || `${empId.toLowerCase()}@sakthiauto.com`,
        role: initialAccount.role || 'COMPANY_USER',
        department: initialAccount.department?.trim() || resolvedUnit,
        title: `${normalizedCode} ${initialAccount.role || 'COMPANY_USER'}`,
        facility: mapCompanyFacility(resolvedFacility),
        companyId: id,
        companyCode: normalizedCode,
        companyName: `${name.trim()} (${resolvedUnit})`,
        active: true,
      };
    }

    return res.status(201).json({
      company: {
        id,
        code: normalizedCode,
        name: name.trim(),
        unitName: resolvedUnit,
        facilityType: resolvedFacility,
        location: location.trim(),
        gstOrRegNo: gstOrRegNo || '',
        contactEmail: contactEmail || '',
        active: true,
      },
      account: createdAccount,
    });
  } catch (err) {
    console.error('companyController.createCompany error:', err);
    return res.status(500).json({ error: 'Failed to create company.' });
  }
};

exports.createCompanyAccount = async (req, res) => {
  try {
    const companyId = req.params.id;
    const compRes = await query(`SELECT TOP 1 * FROM dbo.Companies WHERE id = @id`, { id: companyId });
    const company = compRes.recordset[0];
    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const { username, employeeId, name, email, password, role, department, title } = req.body || {};
    const rawLogin = (username || employeeId || '').trim();
    if (!rawLogin || !name?.trim() || !password?.trim() || password.trim().length < 4) {
      return res.status(400).json({
        error: 'Username, Full Name, and Password (min 4 chars) are required.',
      });
    }

    const id = `u-${Date.now()}`;
    const normalizedId = rawLogin.toUpperCase();
    const passwordHash = await bcrypt.hash(password.trim(), 10);

    await query(
      `INSERT INTO dbo.Users (id, employeeId, name, email, role, department, title, facility, companyId, passwordHash, active)
       VALUES (@id, @employeeId, @name, @email, @role, @department, @title, @facility, @companyId, @passwordHash, 1)`,
      {
        id,
        employeeId: normalizedId,
        name: name.trim(),
        email: email?.trim() || `${normalizedId.toLowerCase()}@sakthiauto.com`,
        role: role || 'COMPANY_USER',
        department: department?.trim() || company.unitName,
        title: title?.trim() || `${company.code} ${role || 'COMPANY_USER'}`,
        facility: mapCompanyFacility(company.facilityType),
        companyId: company.id,
        passwordHash,
      },
    );

    return res.status(201).json({
      user: {
        id,
        employeeId: normalizedId,
        username: rawLogin,
        name: name.trim(),
        email: email?.trim() || `${normalizedId.toLowerCase()}@sakthiauto.com`,
        role: role || 'COMPANY_USER',
        department: department?.trim() || company.unitName,
        title: title?.trim() || `${company.code} ${role || 'COMPANY_USER'}`,
        facility: mapCompanyFacility(company.facilityType),
        companyId: company.id,
        companyCode: company.code,
        companyName: `${company.name} (${company.unitName})`,
        active: true,
      },
    });
  } catch (err) {
    console.error('companyController.createCompanyAccount error:', err);
    return res.status(500).json({ error: 'Failed to create individual company account.' });
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
