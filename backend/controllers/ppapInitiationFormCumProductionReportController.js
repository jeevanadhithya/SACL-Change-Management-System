const { query } = require('../config/db');
const { fetchFullPCRF } = require('./processChangeRequisitionFormController');

exports.getPpapInitiationFormCumProductionReport = async (req, res) => {
  try {
    const pcrf = await fetchFullPCRF(req.params.id);
    if (!pcrf) return res.status(404).json({ error: 'Change request not found.' });
    return res.json({ form7: pcrf.form7 });
  } catch (err) {
    console.error('ppapInitiationFormCumProductionReportController.get error:', err);
    return res.status(500).json({ error: 'Unable to fetch PPAP Initiation Form cum Production Report.' });
  }
};

exports.savePpapInitiationFormCumProductionReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body || {};
    if (!data) {
      return res.status(400).json({ error: 'PPAP Initiation Form cum Production Report payload is required.' });
    }

    await query(
      `UPDATE dbo.Form7_PPAP
       SET submissionStatus = @submissionStatus,
           formDataJson = @json,
           updatedAt = SYSUTCDATETIME()
       WHERE pcrfId = @id`,
      {
        id,
        submissionStatus: data.submissionStatus || 'Pending',
        json: JSON.stringify(data),
      },
    );

    const pcrf = await fetchFullPCRF(id);
    if (!pcrf) return res.status(404).json({ error: 'Change request not found.' });
    return res.json({ pcrf });
  } catch (err) {
    console.error('ppapInitiationFormCumProductionReportController.save error:', err);
    return res.status(500).json({ error: 'Unable to save PPAP Initiation Form cum Production Report (QF/07/MRO-05).' });
  }
};
