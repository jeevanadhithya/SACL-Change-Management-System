const { query } = require('../config/db');
const { fetchFullPCRF } = require('./processChangeRequisitionFormController');

exports.getTimingPlan = async (req, res) => {
  try {
    const pcrf = await fetchFullPCRF(req.params.id);
    if (!pcrf) return res.status(404).json({ error: 'Change request not found.' });
    return res.json({ form4: pcrf.form4 });
  } catch (err) {
    console.error('timingPlanController.getTimingPlan error:', err);
    return res.status(500).json({ error: 'Unable to fetch Timing Plan.' });
  }
};

exports.saveTimingPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body || {};
    if (!data) {
      return res.status(400).json({ error: 'Timing Plan payload is required.' });
    }

    await query(
      `UPDATE dbo.Form4_TimingPlan
       SET goForNextPhase = @goForNextPhase,
           formDataJson = @json,
           updatedAt = SYSUTCDATETIME()
       WHERE pcrfId = @id`,
      {
        id,
        goForNextPhase: data.goForNextPhase || 'Pending',
        json: JSON.stringify(data),
      },
    );

    const pcrf = await fetchFullPCRF(id);
    if (!pcrf) return res.status(404).json({ error: 'Change request not found.' });
    return res.json({ pcrf });
  } catch (err) {
    console.error('timingPlanController.saveTimingPlan error:', err);
    return res.status(500).json({ error: 'Unable to save Timing Plan (QF/07/MKT-08).' });
  }
};
