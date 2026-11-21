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
    const {
      companyId,
      partNumber,
      partName,
      customer,
      facility,
      currentRevision,
      drawingNumber,
      materialGrade,
      processType,
      specifications,
    } = req.body || {};
    if (!partNumber || !partName) {
      return res.status(400).json({ error: 'Part Number and Part Name are required.' });
    }

    const id = `part-${Date.now()}`;
    const normNo = partNumber.trim().toUpperCase();
    await query(
      `INSERT INTO dbo.Parts (id, companyId, partNumber, partName, customer, facility, currentRevision, drawingNumber, materialGrade, processType, specifications)
       VALUES (@id, @companyId, @partNumber, @partName, @customer, @facility, @currentRevision, @drawingNumber, @materialGrade, @processType, @specifications)`,
      {
        id,
        companyId: companyId || null,
        partNumber: normNo,
        partName: partName.trim(),
        customer: customer || '',
        facility: facility || 'Machine Shop',
        currentRevision: currentRevision || 'Rev 01',
        drawingNumber: drawingNumber || '',
        materialGrade: materialGrade || '',
        processType: processType || '',
        specifications: specifications || '',
      },
    );

    return res.status(201).json({
      part: {
        id,
        companyId: companyId || null,
        partNumber: normNo,
        partName: partName.trim(),
        customer: customer || '',
        facility: facility || 'Machine Shop',
        currentRevision: currentRevision || 'Rev 01',
        drawingNumber: drawingNumber || '',
        materialGrade: materialGrade || '',
        processType: processType || '',
        specifications: specifications || '',
      },
    });
  } catch (err) {
    console.error('customerPartController.createPart error:', err);
    return res.status(500).json({ error: 'Unable to create part record.' });
  }
};

exports.updatePart = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      companyId,
      partNumber,
      partName,
      customer,
      facility,
      currentRevision,
      drawingNumber,
      materialGrade,
      processType,
      specifications,
    } = req.body || {};

    await query(
      `UPDATE dbo.Parts
       SET companyId = CASE WHEN @hasCompanyId = 1 THEN @companyId ELSE companyId END,
           partNumber = COALESCE(@partNumber, partNumber),
           partName = COALESCE(@partName, partName),
           customer = COALESCE(@customer, customer),
           facility = COALESCE(@facility, facility),
           currentRevision = COALESCE(@currentRevision, currentRevision),
           drawingNumber = COALESCE(@drawingNumber, drawingNumber),
           materialGrade = COALESCE(@materialGrade, materialGrade),
           processType = COALESCE(@processType, processType),
           specifications = COALESCE(@specifications, specifications)
       WHERE id = @id`,
      {
        id,
        hasCompanyId: companyId !== undefined ? 1 : 0,
        companyId: companyId || null,
        partNumber: partNumber?.trim() ? partNumber.trim().toUpperCase() : null,
        partName: partName?.trim() || null,
        customer: customer !== undefined ? customer.trim() : null,
        facility: facility || null,
        currentRevision: currentRevision !== undefined ? currentRevision.trim() || 'Rev 01' : null,
        drawingNumber: drawingNumber !== undefined ? drawingNumber.trim() : null,
        materialGrade: materialGrade !== undefined ? materialGrade.trim() : null,
        processType: processType !== undefined ? processType.trim() : null,
        specifications: specifications !== undefined ? specifications.trim() : null,
      },
    );

    const updated = await query(`SELECT TOP 1 * FROM dbo.Parts WHERE id = @id`, { id });
    if (!updated.recordset[0]) {
      return res.status(404).json({ error: 'Part record not found.' });
    }
    return res.json({ part: updated.recordset[0] });
  } catch (err) {
    console.error('customerPartController.updatePart error:', err);
    return res.status(500).json({ error: 'Unable to update part record.' });
  }
};

exports.deletePart = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query(`SELECT TOP 1 id FROM dbo.Parts WHERE id = @id`, { id });
    if (!existing.recordset[0]) {
      return res.status(404).json({ error: 'Part record not found.' });
    }
    await query(`DELETE FROM dbo.Parts WHERE id = @id`, { id });
    return res.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error('customerPartController.deletePart error:', err);
    return res.status(500).json({ error: 'Unable to delete part record.' });
  }
};
