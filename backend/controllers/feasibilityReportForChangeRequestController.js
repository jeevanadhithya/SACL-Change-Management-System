const { query } = require('../config/db');
const { fetchFullPCRF } = require('./processChangeRequisitionFormController');

exports.getFeasibilityReportForChangeRequest = async (req, res) => {
  try {
    const pcrf = await fetchFullPCRF(req.params.id);
    if (!pcrf) return res.status(404).json({ error: 'Change request not found.' });
    return res.json({ form2: pcrf.form2 });
  } catch (err) {
    console.error('feasibilityReportForChangeRequestController.get error:', err);
    return res.status(500).json({ error: 'Unable to fetch Feasibility Report for Change Request.' });
  }
};

exports.saveFeasibilityReportForChangeRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body || {};
    if (!data) {
      return res.status(400).json({ error: 'Feasibility Report for Change Request payload is required.' });
    }

    await query(
      `UPDATE dbo.Form2_Feasibility
       SET conclusion = @conclusion,
           formDataJson = @json,
           updatedAt = SYSUTCDATETIME()
       WHERE pcrfId = @id`,
      {
        id,
        conclusion: data.conclusion || 'PENDING',
        json: JSON.stringify(data),
      },
    );

    const pcrf = await fetchFullPCRF(id);
    if (!pcrf) return res.status(404).json({ error: 'Change request not found.' });
    return res.json({ pcrf });
  } catch (err) {
    console.error('feasibilityReportForChangeRequestController.save error:', err);
    return res.status(500).json({ error: 'Unable to save Feasibility Report for Change Request (QF/07/MRO-02).' });
  }
};
