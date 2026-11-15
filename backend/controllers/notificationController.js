const { query } = require('../config/db');

exports.getNotifications = async (_req, res) => {
  try {
    const result = await query(`SELECT * FROM dbo.Notifications ORDER BY createdAt DESC`);
    const notifications = result.recordset.map((n) => ({
      ...n,
      read: Boolean(n.isRead),
      targetRoles: typeof n.targetRolesJson === 'string' ? JSON.parse(n.targetRolesJson) : [],
    }));
    return res.json({ notifications });
  } catch (err) {
    console.error('notificationController.getNotifications error:', err);
    return res.status(500).json({ error: 'Unable to load notifications.' });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await query(`UPDATE dbo.Notifications SET isRead = 1 WHERE id = @id`, { id });
    return res.json({ ok: true });
  } catch (err) {
    console.error('notificationController.markNotificationRead error:', err);
    return res.status(500).json({ error: 'Unable to mark notification as read.' });
  }
};

exports.markAllNotificationsRead = async (_req, res) => {
  try {
    await query(`UPDATE dbo.Notifications SET isRead = 1`);
    return res.json({ ok: true });
  } catch (err) {
    console.error('notificationController.markAllNotificationsRead error:', err);
    return res.status(500).json({ error: 'Unable to mark all notifications as read.' });
  }
};
