const { query } = require('../config/db');
const { fetchFullPCRF } = require('./processChangeRequisitionFormController');

exports.getRiskAnalysisCheckSheet = async (req, res) => {
  try {
    const pcrf = await fetchFullPCRF(req.params.id);
    if (!pcrf) return res.status(404).json({ error: 'Change request not found.' });
    return res.json({ form3: pcrf.form3 });
  } catch (err) {
    console.error('riskAnalysisCheckSheetController.get error:', err);
    return res.status(500).json({ error: 'Unable to fetch Risk Analysis Check Sheet.' });
  }
};

exports.saveRiskAnalysisCheckSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body || {};
    if (!data) {
      return res.status(400).json({ error: 'Risk Analysis Check Sheet payload is required.' });
    }

    await query(
      `UPDATE dbo.Form3_RiskAnalysis
       SET overallRiskLevel = @overallRiskLevel,
           conclusion = @conclusion,
           formDataJson = @json,
           updatedAt = SYSUTCDATETIME()
       WHERE pcrfId = @id`,
      {
        id,
        overallRiskLevel: data.overallRiskLevel || 'L',
        conclusion: data.conclusion || 'Pending',
        json: JSON.stringify(data),
      },
    );

    const pcrf = await fetchFullPCRF(id);
    if (!pcrf) return res.status(404).json({ error: 'Change request not found.' });
    return res.json({ pcrf });
  } catch (err) {
    console.error('riskAnalysisCheckSheetController.save error:', err);
    return res.status(500).json({ error: 'Unable to save Risk Analysis Check Sheet (QF/07/MKT-14).' });
  }
};
