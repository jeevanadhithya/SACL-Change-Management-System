const { query } = require('../config/db');
const { fetchFullPCRF } = require('./processChangeRequisitionFormController');

function validateSequentialPTR(data) {
  const ptr2Attempted =
    data.ptr2?.productionRunDate !== '' || data.ptr2?.sampleStatus !== 'Pending';
  if (ptr2Attempted && data.ptr1?.required !== 'No' && data.ptr1?.sampleStatus !== 'OK') {
    return 'PTR 1 must have Sample Status = OK (or Required = No) before unlocking PTR 2.';
  }

  const ptr3Attempted =
    data.ptr3?.productionRunDate !== '' || data.ptr3?.sampleStatus !== 'Pending';
  if (
    ptr3Attempted &&
    ((data.ptr1?.required !== 'No' && data.ptr1?.sampleStatus !== 'OK') ||
      (data.ptr2?.required !== 'No' && data.ptr2?.sampleStatus !== 'OK'))
  ) {
    return 'PTR 1 and PTR 2 must be OK (or marked Not Required) before unlocking PTR 3.';
  }
  return null;
}

exports.getPtrInitiationForm = async (req, res) => {
  try {
    const pcrf = await fetchFullPCRF(req.params.id);
    if (!pcrf) return res.status(404).json({ error: 'Change request not found.' });
    return res.json({ form6: pcrf.form6 });
  } catch (err) {
    console.error('ptrInitiationFormController.get error:', err);
    return res.status(500).json({ error: 'Unable to fetch PTR Initiation Form.' });
  }
};

exports.savePtrInitiationForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body || {};
    if (!data) {
      return res.status(400).json({ error: 'PTR Initiation Form payload is required.' });
    }

    const gateError = validateSequentialPTR(data);
    if (gateError) {
      return res.status(400).json({ error: gateError });
    }

    await query(
      `UPDATE dbo.Form6_PTR
       SET ptr1Status = @ptr1Status,
           ptr2Status = @ptr2Status,
           ptr3Status = @ptr3Status,
           formDataJson = @json,
           updatedAt = SYSUTCDATETIME()
       WHERE pcrfId = @id`,
      {
        id,
        ptr1Status: data.ptr1?.sampleStatus || 'Pending',
        ptr2Status: data.ptr2?.sampleStatus || 'Pending',
        ptr3Status: data.ptr3?.sampleStatus || 'Pending',
        json: JSON.stringify(data),
      },
    );

    const pcrf = await fetchFullPCRF(id);
    if (!pcrf) return res.status(404).json({ error: 'Change request not found.' });
    return res.json({ pcrf });
  } catch (err) {
    console.error('ptrInitiationFormController.save error:', err);
    return res.status(500).json({ error: 'Unable to save PTR Initiation Form (QF/07/MRO-16).' });
  }
};
