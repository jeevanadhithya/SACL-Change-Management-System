const { query } = require('../config/db');

exports.getAuditLogs = async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM dbo.AuditLogs ORDER BY timestamp DESC`);
    return res.json({ auditLogs: result.recordset });
  } catch (err) {
    console.error('auditLogController.getAuditLogs error:', err);
    return res.status(500).json({ error: 'Unable to load audit logs.' });
  }
};

exports.recordAuditLog = async ({ actorName, actorRole, action, entityId, details }) => {
  try {
    const id = `aud-${Date.now()}`;
    await query(
      `INSERT INTO dbo.AuditLogs (id, actorName, actorRole, action, entityId, details)
       VALUES (@id, @actorName, @actorRole, @action, @entityId, @details)`,
      {
        id,
        actorName: actorName || 'System',
        actorRole: actorRole || 'ADMIN',
        action: action || 'UPDATE',
        entityId: entityId || '',
        details: details || '',
      },
    );
  } catch (err) {
    console.warn('auditLogController.recordAuditLog non-fatal error:', err.message);
  }
};
