const { query } = require('../config/db');

exports.getCustomers = async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM dbo.Customers ORDER BY name ASC`);
    return res.json({ customers: result.recordset });
  } catch (err) {
    console.error('customerPartController.getCustomers error:', err);
    return res.status(500).json({ error: 'Unable to load customers.' });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { code, name, location, contactPerson } = req.body || {};
    if (!code || !name) {
      return res.status(400).json({ error: 'Customer Code and Name are required.' });
    }

    const id = `cust-${Date.now()}`;
    await query(
      `INSERT INTO dbo.Customers (id, code, name, location, contactPerson)
       VALUES (@id, @code, @name, @location, @contactPerson)`,
      {
        id,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        location: location || '',
        contactPerson: contactPerson || '',
      },
    );

    return res.status(201).json({
      customer: { id, code: code.trim().toUpperCase(), name: name.trim(), location: location || '', contactPerson: contactPerson || '' },
    });
  } catch (err) {
    console.error('customerPartController.createCustomer error:', err);
    return res.status(500).json({ error: 'Unable to create customer.' });
  }
};

exports.getParts = async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM dbo.Parts ORDER BY partNumber ASC`);
    return res.json({ parts: result.recordset });
  } catch (err) {
    console.error('customerPartController.getParts error:', err);
    return res.status(500).json({ error: 'Unable to load parts master.' });
  }
};

exports.createPart = async (req, res) => {
  try {
    const { partNumber, partName, customer, facility, currentRevision } = req.body || {};
    if (!partNumber || !partName) {
      return res.status(400).json({ error: 'Part Number and Part Name are required.' });
    }

    const id = `part-${Date.now()}`;
    await query(
      `INSERT INTO dbo.Parts (id, partNumber, partName, customer, facility, currentRevision)
       VALUES (@id, @partNumber, @partName, @customer, @facility, @currentRevision)`,
      {
        id,
        partNumber: partNumber.trim().toUpperCase(),
        partName: partName.trim(),
        customer: customer || '',
        facility: facility || 'Machine Shop',
        currentRevision: currentRevision || 'Rev 01',
      },
    );

    return res.status(201).json({
      part: {
        id,
        partNumber: partNumber.trim().toUpperCase(),
        partName: partName.trim(),
        customer: customer || '',
        facility: facility || 'Machine Shop',
        currentRevision: currentRevision || 'Rev 01',
      },
    });
  } catch (err) {
    console.error('customerPartController.createPart error:', err);
    return res.status(500).json({ error: 'Unable to create part record.' });
  }
};
