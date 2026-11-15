function hydrateChangeRequest(row, forms = {}) {
  const safeParse = (raw, fallback) => {
    try {
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    id: row.id,
    pcrfNo: row.pcrfNo,
    companyId: row.companyId || '',
    companyName: row.companyName || 'Sakthi Auto Component Limited',
    title: row.title,
    priority: row.priority,
    createdBy: row.createdBy,
    createdByEmployeeId: row.createdByEmployeeId,
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString().slice(0, 10) : '',
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString().slice(0, 10) : '',
    dueDate: row.dueDate,
    currentStage: row.currentStage,
    overallStatus: row.overallStatus,
    workflow: safeParse(row.workflowJson, []),
    documents: safeParse(row.documentsJson, []),
    activityHistory: safeParse(row.activityHistoryJson, []),
    form1: forms.form1 || {},
    form2: forms.form2 || {},
    form3: forms.form3 || {},
    form4: forms.form4 || {},
    form5: forms.form5 || {},
    form6: forms.form6 || {},
    form7: forms.form7 || {},
  };
}

function syncDownstreamFromPCRF(form1, existingForms) {
  const partDisplay =
    form1.partName && form1.partNo
      ? `${form1.partName} / ${form1.partNo}`
      : form1.partName || form1.partNo || '';

  return {
    form2: {
      ...existingForms.form2,
      slNo: form1.pcrfNo,
      from: form1.department || existingForms.form2?.from || '',
      partName: form1.partName,
      partNo: form1.partNo,
      customer: form1.customer,
    },
    form3: {
      ...existingForms.form3,
      partName: form1.partName,
      partNo: form1.partNo,
      customer: form1.customer,
    },
    form4: {
      ...existingForms.form4,
      drawingPartNo: form1.partNo,
      productName: form1.partName,
      customer: form1.customer,
    },
    form5: {
      ...existingForms.form5,
      productCode: form1.partNo,
      productDescription: form1.partName,
      customerName: form1.customer,
      customerPartNo: form1.partNo,
    },
    form6: {
      ...existingForms.form6,
      from: form1.requisitionBy || existingForms.form6?.from || '',
      department: form1.department || existingForms.form6?.department || '',
      customer: form1.customer,
      partNameNumber: partDisplay,
      reason: form1.reasonForChange || existingForms.form6?.reason || '',
    },
    form7: {
      ...existingForms.form7,
      from: form1.requisitionBy || existingForms.form7?.from || '',
      department: form1.department || existingForms.form7?.department || '',
      customer: form1.customer,
      partNameNumber: partDisplay,
      reason: form1.reasonForChange || existingForms.form7?.reason || '',
    },
  };
}

module.exports = {
  hydrateChangeRequest,
  syncDownstreamFromPCRF,
};
