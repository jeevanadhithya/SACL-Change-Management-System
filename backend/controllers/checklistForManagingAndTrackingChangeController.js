const { query } = require('../config/db');
const { fetchFullPCRF } = require('./processChangeRequisitionFormController');

exports.getChecklistForManagingAndTrackingChange = async (req, res) => {
  try {
    const pcrf = await fetchFullPCRF(req.params.id);
    if (!pcrf) return res.status(404).json({ error: 'Change request not found.' });
    return res.json({ form5: pcrf.form5 });
  } catch (err) {
    console.error('checklistForManagingAndTrackingChangeController.get error:', err);
    return res.status(500).json({ error: 'Unable to fetch Checklist for Managing and Tracking Change.' });
  }
};

exports.saveChecklistForManagingAndTrackingChange = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body || {};
    if (!data) {
      return res.status(400).json({ error: 'Checklist for Managing and Tracking Change payload is required.' });
    }

    await query(
      `UPDATE dbo.Form5_ChangeChecklist
       SET formDataJson = @json,
           updatedAt = SYSUTCDATETIME()
       WHERE pcrfId = @id`,
      {
        id,
        json: JSON.stringify(data),
      },
    );

    const pcrf = await fetchFullPCRF(id);
    if (!pcrf) return res.status(404).json({ error: 'Change request not found.' });
    return res.json({ pcrf });
  } catch (err) {
    console.error('checklistForManagingAndTrackingChangeController.save error:', err);
    return res.status(500).json({ error: 'Unable to save Checklist for Managing and Tracking Change (QF/07/MRO-03).' });
  }
};
