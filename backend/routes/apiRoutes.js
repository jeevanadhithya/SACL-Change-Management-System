const express = require('express');
const authController = require('../controllers/authController');
const companyController = require('../controllers/companyController');
const departmentController = require('../controllers/departmentController');
const customerPartController = require('../controllers/customerPartController');
const notificationController = require('../controllers/notificationController');
const auditLogController = require('../controllers/auditLogController');
const processChangeRequisitionFormController = require('../controllers/processChangeRequisitionFormController');
const feasibilityReportForChangeRequestController = require('../controllers/feasibilityReportForChangeRequestController');
const riskAnalysisCheckSheetController = require('../controllers/riskAnalysisCheckSheetController');
const timingPlanController = require('../controllers/timingPlanController');
const checklistForManagingAndTrackingChangeController = require('../controllers/checklistForManagingAndTrackingChangeController');
const ptrInitiationFormController = require('../controllers/ptrInitiationFormController');
const ppapInitiationFormCumProductionReportController = require('../controllers/ppapInitiationFormCumProductionReportController');
const workflowController = require('../controllers/workflowController');
const { requireRole, verifyToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Healthcheck
router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'sakthi-auto-mssql-backend' });
});

// Authentication & Users
router.post('/auth/login', authController.login);
router.get('/users', verifyToken, authController.getUsers);
router.post('/users', verifyToken, authController.createUser);

// Companies (Multi-Plant / Unit CRUD — Admin Dashboard Only for mutations)
router.get('/companies', verifyToken, companyController.getCompanies);
router.post('/companies', verifyToken, requireRole('ADMIN'), companyController.createCompany);
router.put('/companies/:id', verifyToken, requireRole('ADMIN'), companyController.updateCompany);

// Departments, Customers & Parts Master Data
router.get('/master-data', verifyToken, workflowController.getMasterData);
router.get('/departments', verifyToken, departmentController.getDepartments);
router.post('/departments', verifyToken, departmentController.createDepartment);
router.get('/customers', verifyToken, customerPartController.getCustomers);
router.post('/customers', verifyToken, customerPartController.createCustomer);
router.get('/parts', verifyToken, customerPartController.getParts);
router.post('/parts', verifyToken, customerPartController.createPart);

// Change Requests & Exact PDF Full-Form Controllers (Forms 1 to 7)
router.get('/pcrfs', verifyToken, processChangeRequisitionFormController.listPCRFs);
router.get('/pcrfs/:id', verifyToken, processChangeRequisitionFormController.getPCRFById);
router.post('/pcrfs', verifyToken, processChangeRequisitionFormController.createPCRF);

// Form 1: QF/07/MRO-15 Process Change Requisition Form
router.get('/pcrfs/:id/process-change-requisition-form', verifyToken, processChangeRequisitionFormController.getPCRFById);
router.put('/pcrfs/:id/process-change-requisition-form', verifyToken, processChangeRequisitionFormController.saveProcessChangeRequisitionForm);
router.put('/pcrfs/:id/pcrf', verifyToken, processChangeRequisitionFormController.saveProcessChangeRequisitionForm);

// Form 2: QF/07/MRO-02 Feasibility Report for Change Request
router.get('/pcrfs/:id/feasibility-report-for-change-request', verifyToken, feasibilityReportForChangeRequestController.getFeasibilityReportForChangeRequest);
router.put('/pcrfs/:id/feasibility-report-for-change-request', verifyToken, feasibilityReportForChangeRequestController.saveFeasibilityReportForChangeRequest);
router.put('/pcrfs/:id/feasibility', verifyToken, feasibilityReportForChangeRequestController.saveFeasibilityReportForChangeRequest);

// Form 3: QF/07/MKT-14 Risk Analysis Check Sheet
router.get('/pcrfs/:id/risk-analysis-check-sheet', verifyToken, riskAnalysisCheckSheetController.getRiskAnalysisCheckSheet);
router.put('/pcrfs/:id/risk-analysis-check-sheet', verifyToken, riskAnalysisCheckSheetController.saveRiskAnalysisCheckSheet);
router.put('/pcrfs/:id/risk-analysis', verifyToken, riskAnalysisCheckSheetController.saveRiskAnalysisCheckSheet);

// Form 4: QF/07/MKT-08 Timing Plan
router.get('/pcrfs/:id/timing-plan', verifyToken, timingPlanController.getTimingPlan);
router.put('/pcrfs/:id/timing-plan', verifyToken, timingPlanController.saveTimingPlan);

// Form 5: QF/07/MRO-03 Checklist for Managing and Tracking Change
router.get('/pcrfs/:id/checklist-for-managing-and-tracking-change', verifyToken, checklistForManagingAndTrackingChangeController.getChecklistForManagingAndTrackingChange);
router.put('/pcrfs/:id/checklist-for-managing-and-tracking-change', verifyToken, checklistForManagingAndTrackingChangeController.saveChecklistForManagingAndTrackingChange);
router.put('/pcrfs/:id/change-checklist', verifyToken, checklistForManagingAndTrackingChangeController.saveChecklistForManagingAndTrackingChange);

// Form 6: QF/07/MRO-16 PTR Initiation Form
router.get('/pcrfs/:id/ptr-initiation-form', verifyToken, ptrInitiationFormController.getPtrInitiationForm);
router.put('/pcrfs/:id/ptr-initiation-form', verifyToken, ptrInitiationFormController.savePtrInitiationForm);
router.put('/pcrfs/:id/ptr', verifyToken, ptrInitiationFormController.savePtrInitiationForm);

// Form 7: QF/07/MRO-05 PPAP Initiation Form cum Production Report
router.get('/pcrfs/:id/ppap-initiation-form-cum-production-report', verifyToken, ppapInitiationFormCumProductionReportController.getPpapInitiationFormCumProductionReport);
router.put('/pcrfs/:id/ppap-initiation-form-cum-production-report', verifyToken, ppapInitiationFormCumProductionReportController.savePpapInitiationFormCumProductionReport);
router.put('/pcrfs/:id/ppap', verifyToken, ppapInitiationFormCumProductionReportController.savePpapInitiationFormCumProductionReport);

// Unified form route compatibility (/forms/form1..form7)
router.put('/pcrfs/:id/forms/:formKey', verifyToken, (req, res, next) => {
  const map = {
    form1: processChangeRequisitionFormController.saveProcessChangeRequisitionForm,
    form2: feasibilityReportForChangeRequestController.saveFeasibilityReportForChangeRequest,
    form3: riskAnalysisCheckSheetController.saveRiskAnalysisCheckSheet,
    form4: timingPlanController.saveTimingPlan,
    form5: checklistForManagingAndTrackingChangeController.saveChecklistForManagingAndTrackingChange,
    form6: ptrInitiationFormController.savePtrInitiationForm,
    form7: ppapInitiationFormCumProductionReportController.savePpapInitiationFormCumProductionReport,
  };
  const handler = map[req.params.formKey];
  if (!handler) {
    return res.status(400).json({ error: 'Invalid form identifier.' });
  }
  return handler(req, res, next);
});

// Workflow Decisions, Analytics, Notifications & Audit Logs
router.post('/pcrfs/:id/decision', verifyToken, workflowController.submitDecision);
router.get('/analytics', verifyToken, workflowController.getAnalyticsSummary);
router.get('/notifications', verifyToken, notificationController.getNotifications);
router.post('/notifications/:id/read', verifyToken, notificationController.markNotificationRead);
router.post('/notifications/read-all', verifyToken, notificationController.markAllNotificationsRead);
router.get('/audit-logs', verifyToken, auditLogController.getAuditLogs);

module.exports = router;
