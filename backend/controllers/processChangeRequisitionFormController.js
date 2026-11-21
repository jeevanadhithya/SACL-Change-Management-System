const { query } = require('../config/db');
const { hydrateChangeRequest, syncDownstreamFromPCRF } = require('../utils/formSync');

async function fetchFullPCRF(pcrfId) {
  const baseRes = await query(
    `SELECT * FROM dbo.ChangeRequests WHERE id = @id OR pcrfNo = @id`,
    { id: pcrfId },
  );
  const row = baseRes.recordset[0];
  if (!row) return null;

  const [f1, f2, f3, f4, f5, f6, f7] = await Promise.all([
    query(`SELECT formDataJson FROM dbo.Form1_PCRF WHERE pcrfId = @id`, { id: row.id }),
    query(`SELECT formDataJson FROM dbo.Form2_Feasibility WHERE pcrfId = @id`, { id: row.id }),
    query(`SELECT formDataJson FROM dbo.Form3_RiskAnalysis WHERE pcrfId = @id`, { id: row.id }),
    query(`SELECT formDataJson FROM dbo.Form4_TimingPlan WHERE pcrfId = @id`, { id: row.id }),
    query(`SELECT formDataJson FROM dbo.Form5_ChangeChecklist WHERE pcrfId = @id`, { id: row.id }),
    query(`SELECT formDataJson FROM dbo.Form6_PTR WHERE pcrfId = @id`, { id: row.id }),
    query(`SELECT formDataJson FROM dbo.Form7_PPAP WHERE pcrfId = @id`, { id: row.id }),
  ]);

  const parse = (res) => (res.recordset[0] ? JSON.parse(res.recordset[0].formDataJson) : {});
  return hydrateChangeRequest(row, {
    form1: parse(f1),
    form2: parse(f2),
    form3: parse(f3),
    form4: parse(f4),
    form5: parse(f5),
    form6: parse(f6),
    form7: parse(f7),
  });
}

exports.listPCRFs = async (req, res) => {
  try {
    const isCompanyUser = req.user?.role === 'COMPANY_USER' && req.user?.companyId;
    const baseRows = isCompanyUser
      ? await query(
          `SELECT * FROM dbo.ChangeRequests
           WHERE companyId = @companyId OR createdByEmployeeId = @empId
           ORDER BY createdAt DESC`,
          { companyId: req.user.companyId, empId: req.user.employeeId },
        )
      : await query(`SELECT * FROM dbo.ChangeRequests ORDER BY createdAt DESC`);
    const pcrfs = await Promise.all(baseRows.recordset.map((r) => fetchFullPCRF(r.id)));
    return res.json({ pcrfs: pcrfs.filter(Boolean) });
  } catch (err) {
    console.error('processChangeRequisitionFormController.listPCRFs error:', err);
    return res.status(500).json({ error: 'Unable to fetch change requests.' });
  }
};

exports.getPCRFById = async (req, res) => {
  try {
    const pcrf = await fetchFullPCRF(req.params.id);
    if (!pcrf) {
      return res.status(404).json({ error: 'Change request not found.' });
    }
    return res.json({ pcrf });
  } catch (err) {
    console.error('processChangeRequisitionFormController.getPCRFById error:', err);
    return res.status(500).json({ error: 'Unable to fetch change request.' });
  }
};

exports.createPCRF = async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.customer || !body.partName || !body.partNo || !body.reasonForChange) {
      return res
        .status(400)
        .json({ error: 'Customer, Part Name, Part No, and Reason are required.' });
    }

    const countRes = await query(`SELECT COUNT(*) AS total FROM dbo.ChangeRequests`);
    const nextSeq = 1 + (countRes.recordset[0]?.total || 0);
    const year = new Date().getFullYear();
    const id = `pcrf-${Date.now()}`;
    const pcrfNo = `PCRF-${year}-${String(nextSeq).padStart(3, '0')}`;
    const today = new Date().toISOString().slice(0, 10);
    const actorName = req.user?.name || body.createdBy || '';
    const actorEmpId = req.user?.employeeId || body.createdByEmployeeId || '';
    const actorRole = req.user?.role || 'EMPLOYEE';

    const form1 = {
      pcrfNo,
      requisitionBy: actorName,
      requisitionerSign: actorName,
      department: body.department || req.user?.department || '',
      requisitionerHodSign: '',
      date: today,
      customer: body.customer,
      partName: body.partName,
      partNo: body.partNo,
      classifications: body.classifications?.length ? body.classifications : ['Method'],
      changeType: body.changeType || 'Process',
      facilityScope: body.facilityScope || 'Machine Shop',
      particularsRows: [
        {
          id: `part-${Date.now()}`,
          particulars: body.particulars || 'Process Parameter Modification',
          currentStatus: body.currentStatus || 'Baseline process state',
          changeRequired: body.changeRequired || body.reasonForChange,
          targetFacility:
            body.facilityScope === 'Foundry'
              ? 'F'
              : body.facilityScope === 'Machine Shop'
              ? 'M'
              : 'F&M',
        },
      ],
      reasonForChange: body.reasonForChange,
      reasonFacilityApplicable:
        body.facilityScope === 'Foundry'
          ? 'Foundry'
          : body.facilityScope === 'Machine Shop'
          ? 'Machine Shop'
          : 'Both',
      cftCommentsFoundry: '',
      cftFoundryFeasibility: 'Pending',
      cftLeaderFoundrySign: '',
      cftLeaderFoundryDate: '',
      cftCommentsMachineShop: '',
      cftMachineShopFeasibility: 'Pending',
      cftLeaderMachineShopSign: '',
      cftLeaderMachineShopDate: '',
      internalApprovalStatus: 'Pending',
      internalApprovalOtherText: '',
      approvingAuthority: '',
      approvingAuthoritySign: '',
      plantHeadApproval: 'Pending',
      plantHeadSign: '',
      customerCommunicationDetail: '',
      changeReflectionInSOP: false,
      sopDocumentRef: '',
      forwardedTo: 'Department HOD / CFT',
    };

    const resolvedRev = (body.currentRevision || 'Rev 01').trim();
    const shortRev = resolvedRev.replace(/^Rev\s*/i, '') || '01';
    const drawingAndPart = body.drawingNumber?.trim()
      ? `${body.partNo} / ${body.drawingNumber.trim()}`
      : body.partNo;

    const synced = syncDownstreamFromPCRF(form1, {
      form2: { slNo: pcrfNo, date: today, to: 'CFT', requirements: [], conclusion: 'PENDING', cftSignatures: [] },
      form3: { date: today, riskRows: [], conclusion: 'Pending', overallRiskLevel: 'L', cftSignatures: [] },
      form4: {
        projectName: `${body.customer} — ${body.partName}`,
        drawingPartNo: drawingAndPart,
        revision: shortRev,
        preparedDate: today,
        goForNextPhase: 'Pending',
        activities: [],
      },
      form5: { items: [], informedTo: {} },
      form6: { revNumber: resolvedRev, ptr1: { sampleStatus: 'Pending' }, ptr2: { sampleStatus: 'Pending' }, ptr3: { sampleStatus: 'Pending' } },
      form7: { revNumber: resolvedRev, submissionStatus: 'Pending' },
    });

    await query(
      `INSERT INTO dbo.ChangeRequests
        (id, pcrfNo, companyId, companyName, title, priority, createdBy, createdByEmployeeId, dueDate, currentStage, overallStatus, workflowJson, documentsJson, activityHistoryJson)
       VALUES
        (@id, @pcrfNo, @companyId, @companyName, @title, @priority, @createdBy, @createdByEmployeeId, @dueDate, 'PCRF', 'In Review', @workflowJson, @documentsJson, @activityHistoryJson)`,
      {
        id,
        pcrfNo,
        companyId: body.companyId || req.user?.companyId || null,
        companyName: body.companyName || req.user?.companyName || null,
        title: body.title || `${body.partName} — ${body.particulars || 'Process Change'}`,
        priority: body.priority || 'Normal',
        createdBy: actorName,
        createdByEmployeeId: actorEmpId,
        dueDate: body.dueDate || today,
        workflowJson: JSON.stringify([
          { key: 'PCRF', label: 'Process Change Requisition', status: 'IN_PROGRESS' },
          { key: 'FEASIBILITY', label: 'Feasibility Report', status: 'PENDING' },
          { key: 'RISK_ANALYSIS', label: 'Risk Analysis', status: 'PENDING' },
          { key: 'TIMING_PLAN', label: 'Timing Plan', status: 'PENDING' },
          { key: 'INTERNAL_APPROVAL', label: 'Plant Head / Internal Approval', status: 'PENDING' },
          { key: 'CHANGE_CHECKLIST', label: 'Change Management Checklist', status: 'PENDING' },
          { key: 'PTR', label: 'PTR Initiation', status: 'PENDING' },
          { key: 'PPAP', label: 'PPAP Initiation', status: 'PENDING' },
          { key: 'CLOSURE', label: 'Final Closure', status: 'PENDING' },
        ]),
        documentsJson: JSON.stringify([]),
        activityHistoryJson: JSON.stringify([
          {
            id: `hist-${Date.now()}`,
            timestamp: new Date().toISOString(),
            actorName,
            actorRole,
            action: `Raised Change Request ${pcrfNo}`,
            stage: 'Process Change Requisition',
            comments: body.reasonForChange,
          },
        ]),
      },
    );

    await Promise.all([
      query(`INSERT INTO dbo.Form1_PCRF (pcrfId, pcrfNo, formDataJson) VALUES (@id, @pcrfNo, @json)`, {
        id,
        pcrfNo,
        json: JSON.stringify(form1),
      }),
      query(`INSERT INTO dbo.Form2_Feasibility (pcrfId, conclusion, formDataJson) VALUES (@id, 'PENDING', @json)`, {
        id,
        json: JSON.stringify(synced.form2),
      }),
      query(`INSERT INTO dbo.Form3_RiskAnalysis (pcrfId, overallRiskLevel, conclusion, formDataJson) VALUES (@id, 'L', 'Pending', @json)`, {
        id,
        json: JSON.stringify(synced.form3),
      }),
      query(`INSERT INTO dbo.Form4_TimingPlan (pcrfId, goForNextPhase, formDataJson) VALUES (@id, 'Pending', @json)`, {
        id,
        json: JSON.stringify(synced.form4),
      }),
      query(`INSERT INTO dbo.Form5_ChangeChecklist (pcrfId, formDataJson) VALUES (@id, @json)`, {
        id,
        json: JSON.stringify(synced.form5),
      }),
      query(`INSERT INTO dbo.Form6_PTR (pcrfId, ptr1Status, ptr2Status, ptr3Status, formDataJson) VALUES (@id, 'Pending', 'Pending', 'Pending', @json)`, {
        id,
        json: JSON.stringify(synced.form6),
      }),
      query(`INSERT INTO dbo.Form7_PPAP (pcrfId, submissionStatus, formDataJson) VALUES (@id, 'Pending', @json)`, {
        id,
        json: JSON.stringify(synced.form7),
      }),
    ]);

    const created = await fetchFullPCRF(id);
    return res.status(201).json({ pcrf: created });
  } catch (err) {
    console.error('processChangeRequisitionFormController.createPCRF error:', err);
    return res.status(500).json({ error: 'Unable to create change request.' });
  }
};

exports.saveProcessChangeRequisitionForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body || {};
    const existing = await fetchFullPCRF(id);
    if (!existing) {
      return res.status(404).json({ error: 'Change request not found.' });
    }

    const synced = syncDownstreamFromPCRF(data, existing);

    await Promise.all([
      query(
        `UPDATE dbo.Form1_PCRF SET formDataJson = @json, updatedAt = SYSUTCDATETIME() WHERE pcrfId = @id`,
        { id, json: JSON.stringify(data) },
      ),
      query(`UPDATE dbo.Form2_Feasibility SET formDataJson = @json WHERE pcrfId = @id`, {
        id,
        json: JSON.stringify(synced.form2),
      }),
      query(`UPDATE dbo.Form3_RiskAnalysis SET formDataJson = @json WHERE pcrfId = @id`, {
        id,
        json: JSON.stringify(synced.form3),
      }),
      query(`UPDATE dbo.Form4_TimingPlan SET formDataJson = @json WHERE pcrfId = @id`, {
        id,
        json: JSON.stringify(synced.form4),
      }),
      query(`UPDATE dbo.Form5_ChangeChecklist SET formDataJson = @json WHERE pcrfId = @id`, {
        id,
        json: JSON.stringify(synced.form5),
      }),
      query(`UPDATE dbo.Form6_PTR SET formDataJson = @json WHERE pcrfId = @id`, {
        id,
        json: JSON.stringify(synced.form6),
      }),
      query(`UPDATE dbo.Form7_PPAP SET formDataJson = @json WHERE pcrfId = @id`, {
        id,
        json: JSON.stringify(synced.form7),
      }),
      query(`UPDATE dbo.ChangeRequests SET updatedAt = SYSUTCDATETIME() WHERE id = @id`, { id }),
    ]);

    const updated = await fetchFullPCRF(id);
    return res.json({ pcrf: updated });
  } catch (err) {
    console.error('processChangeRequisitionFormController.saveProcessChangeRequisitionForm error:', err);
    return res.status(500).json({ error: 'Unable to save Process Change Requisition Form (QF/07/MRO-15).' });
  }
};

exports.fetchFullPCRF = fetchFullPCRF;
