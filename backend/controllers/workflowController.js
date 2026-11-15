const { query } = require('../config/db');
const { fetchFullPCRF } = require('./processChangeRequisitionFormController');

const STAGE_ORDER = [
  'PCRF',
  'FEASIBILITY',
  'RISK_ANALYSIS',
  'TIMING_PLAN',
  'INTERNAL_APPROVAL',
  'CHANGE_CHECKLIST',
  'PTR',
  'PPAP',
  'CLOSURE',
];

exports.getMasterData = async (_req, res) => {
  try {
    const [companies, departments, customers, parts] = await Promise.all([
      query(`SELECT * FROM dbo.Companies WHERE active = 1 ORDER BY name ASC`),
      query(`SELECT * FROM dbo.Departments ORDER BY name ASC`),
      query(`SELECT * FROM dbo.Customers ORDER BY name ASC`),
      query(`SELECT * FROM dbo.Parts ORDER BY partNumber ASC`),
    ]);

    return res.json({
      companies: companies.recordset,
      departments: departments.recordset,
      customers: customers.recordset,
      parts: parts.recordset,
    });
  } catch (err) {
    console.error('workflowController.getMasterData error:', err);
    return res.status(500).json({ error: 'Unable to load master data.' });
  }
};

exports.submitDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, actorName, actorRole, comments } = req.body || {};
    const existing = await fetchFullPCRF(id);
    if (!existing) {
      return res.status(404).json({ error: 'Change request not found.' });
    }

    const now = new Date().toISOString().slice(0, 10);
    const currentIdx = STAGE_ORDER.indexOf(existing.currentStage);
    let nextStage = existing.currentStage;
    let nextStatus = existing.overallStatus;

    const workflow = (existing.workflow || []).map((w, idx) => {
      if (idx !== currentIdx) return w;
      return {
        ...w,
        status: decision === 'APPROVE' ? 'COMPLETED' : decision === 'REJECT' ? 'REJECTED' : 'RETURNED',
        updatedAt: now,
        updatedBy: actorName,
        comments: comments || '',
      };
    });

    if (decision === 'APPROVE') {
      if (currentIdx + 1 < STAGE_ORDER.length) {
        nextStage = STAGE_ORDER[currentIdx + 1];
        if (workflow[currentIdx + 1]) {
          workflow[currentIdx + 1].status = 'IN_PROGRESS';
        }
        nextStatus = currentIdx >= 4 ? 'In Implementation' : 'In Review';
      } else {
        nextStatus = 'Closed';
      }
    } else if (decision === 'REJECT') {
      nextStatus = 'Rejected';
    } else {
      nextStatus = 'Returned';
    }

    const history = [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorName: actorName || 'Approver',
        actorRole: actorRole || 'HOD',
        action: `${decision} at ${existing.currentStage}`,
        stage: existing.currentStage,
        comments: comments || '',
      },
      ...(existing.activityHistory || []),
    ];

    await query(
      `UPDATE dbo.ChangeRequests
       SET currentStage = @nextStage,
           overallStatus = @nextStatus,
           workflowJson = @workflowJson,
           activityHistoryJson = @activityHistoryJson,
           updatedAt = SYSUTCDATETIME()
       WHERE id = @id`,
      {
        id,
        nextStage,
        nextStatus,
        workflowJson: JSON.stringify(workflow),
        activityHistoryJson: JSON.stringify(history),
      },
    );

    const updated = await fetchFullPCRF(id);
    return res.json({ pcrf: updated });
  } catch (err) {
    console.error('workflowController.submitDecision error:', err);
    return res.status(500).json({ error: 'Unable to apply workflow decision.' });
  }
};

exports.getAnalyticsSummary = async (_req, res) => {
  try {
    const [totalRes, stageRes, statusRes] = await Promise.all([
      query(`SELECT COUNT(*) AS total FROM dbo.ChangeRequests`),
      query(`SELECT currentStage, COUNT(*) AS count FROM dbo.ChangeRequests GROUP BY currentStage`),
      query(`SELECT overallStatus, COUNT(*) AS count FROM dbo.ChangeRequests GROUP BY overallStatus`),
    ]);

    return res.json({
      total: totalRes.recordset[0]?.total || 0,
      byStage: stageRes.recordset,
      byStatus: statusRes.recordset,
    });
  } catch (err) {
    console.error('workflowController.getAnalyticsSummary error:', err);
    return res.status(500).json({ error: 'Unable to load workflow analytics.' });
  }
};

exports.getNotifications = async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM dbo.Notifications ORDER BY createdAt DESC`);
    return res.json({ notifications: result.recordset });
  } catch (err) {
    console.error('workflowController.getNotifications error:', err);
    return res.status(500).json({ error: 'Unable to load notifications.' });
  }
};

exports.getAuditLogs = async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM dbo.AuditLogs ORDER BY timestamp DESC`);
    return res.json({ auditLogs: result.recordset });
  } catch (err) {
    console.error('workflowController.getAuditLogs error:', err);
    return res.status(500).json({ error: 'Unable to load audit logs.' });
  }
};
