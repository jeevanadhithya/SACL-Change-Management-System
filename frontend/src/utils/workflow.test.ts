import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyWorkflowDecision,
  canAdvancePTRStage,
  canUserApproveStage,
  computeChecklistProgress,
  computeOverallRisk,
  createDefaultChecklistItems,
  createDefaultFeasibilityRequirements,
  createDefaultRiskPoints,
  createDefaultTimingActivities,
  createEmptyWeeks,
  createInitialWorkflow,
  syncInterconnectedFields,
} from './workflow';
import type { ChangeRequestRecord, Form6PTR } from '../types/pcms';

function makeDummyRecord(): ChangeRequestRecord {
  return {
    id: 'cr-test',
    pcrfNo: 'PCRF-2026-999',
    title: 'Test Change',
    priority: 'High',
    createdBy: 'R. Karthik',
    createdByEmployeeId: 'EMP101',
    createdAt: '2026-11-01',
    updatedAt: '2026-11-01',
    dueDate: '2026-12-15',
    currentStage: 'PCRF',
    overallStatus: 'In Review',
    workflow: createInitialWorkflow(),
    form1: {
      pcrfNo: 'PCRF-2026-999',
      requisitionBy: 'R. Karthik',
      requisitionerSign: 'R. Karthik',
      department: 'Machine Shop',
      requisitionerHodSign: '',
      date: '2026-11-01',
      customer: 'Tata Motors',
      partName: 'Steering Knuckle LH',
      partNo: 'SA-SK-4410',
      classifications: ['Method', 'Machine'],
      changeType: 'Process',
      facilityScope: 'Machine Shop',
      particularsRows: [
        {
          id: 'p1',
          particulars: 'Machining Cycle Time Optimization',
          currentStatus: '142 sec',
          changeRequired: '118 sec with carbide insert',
          targetFacility: 'M',
        },
      ],
      reasonForChange: 'Reduce cycle time bottleneck on VMC Line 3',
      reasonFacilityApplicable: 'Machine Shop',
      cftCommentsFoundry: '',
      cftFoundryFeasibility: 'Pending',
      cftLeaderFoundrySign: '',
      cftLeaderFoundryDate: '',
      cftCommentsMachineShop: '',
      cftMachineShopFeasibility: 'Pending',
      cftLeaderMachineShopSign: '',
      cftLeaderMachineShopDate: '',
      internalApprovalStatus: 'Pending',
      internalApprovalOtherText: '',
      approvingAuthority: '',
      approvingAuthoritySign: '',
      plantHeadApproval: 'Pending',
      plantHeadSign: '',
      customerCommunicationDetail: '',
      changeReflectionInSOP: false,
      sopDocumentRef: '',
      forwardedTo: 'CFT',
    },
    form2: {
      slNo: '',
      date: '2026-11-01',
      from: '',
      to: 'CFT',
      partName: '',
      partNo: '',
      customer: '',
      categoryOfChange: '',
      requirements: createDefaultFeasibilityRequirements(),
      additionalResourceRequirement: '',
      conclusion: 'PENDING',
      cftSignatures: [],
      comments: '',
      forwardedTo: 'CFT Leader',
      acknowledgementStatus: 'Pending',
      acknowledgementDate: '',
    },
    form3: {
      partName: '',
      partNo: '',
      customer: '',
      date: '2026-11-01',
      riskRows: createDefaultRiskPoints(),
      conclusion: 'Pending',
      overallRiskLevel: 'L',
      cftSignatures: [],
    },
    form4: {
      projectName: '',
      drawingPartNo: '',
      productName: '',
      customer: '',
      preparedDate: '2026-11-01',
      lastRevDate: '2026-11-01',
      revision: '00',
      productTypeFlags: ['B'],
      monthLabels: ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
      customerTimelineWeeks: createEmptyWeeks(),
      customerTimelineRemarks: '',
      internalTimelineWeeks: createEmptyWeeks(),
      internalTimelineRemarks: '',
      tier2TimelineWeeks: createEmptyWeeks(),
      tier2TimelineRemarks: '',
      activities: createDefaultTimingActivities(),
      reviewMode: ['Initial Plan'],
      cftMembers: ['', '', '', '', '', ''],
      remarks: '',
      goForNextPhase: 'Pending',
      cftLeaderSign: '',
      plantHeadSign: '',
    },
    form5: {
      productCode: '',
      productDescription: '',
      customerName: '',
      customerPartNo: '',
      changeCategoryType: 'Proc. Change',
      items: createDefaultChecklistItems(),
      actualImplementationDate: '',
      actionsOnStockProduced: '',
      actionsOnToolings: '',
      otherRemarks: '',
      informedTo: {
        customer: false,
        marketing: false,
        planning: false,
        production: false,
        qa: false,
        qc: false,
      },
      cftCoreTeamNote: '',
      preparedOnDate: '',
      signOffs: [
        { sign: '', name: '', title: '' },
        { sign: '', name: '', title: '' },
        { sign: '', name: '', title: '' },
      ],
    },
    form6: {
      date: '2026-11-01',
      from: '',
      department: '',
      to: 'CFT',
      customer: '',
      partNameNumber: '',
      revNumber: 'Rev 03',
      reason: '',
      requestDate: '2026-11-01',
      requestSignature: '',
      ptr1: {
        required: 'Yes',
        productionRunDate: '',
        quantityProduced: '5 Nos',
        meetsDrawingReq: 'Pending',
        sampleSubmissionReq: 'Yes',
        sampleSubmittedDate: '',
        sampleStatus: 'Pending',
        actionPlanComments: '',
      },
      ptr2: {
        required: 'Yes',
        productionRunDate: '',
        quantityProduced: '25 Nos',
        meetsDrawingReq: 'Pending',
        sampleSubmissionReq: 'Yes',
        sampleSubmittedDate: '',
        sampleStatus: 'Pending',
        actionPlanComments: '',
      },
      ptr3: {
        required: 'Yes',
        productionRunDate: '',
        quantityProduced: '50 Nos',
        meetsDrawingReq: 'Pending',
        sampleSubmissionReq: 'Yes',
        sampleSubmittedDate: '',
        sampleStatus: 'Pending',
        actionPlanComments: '',
      },
      coreTeamApprovals: [],
      cftComments: '',
      breakPointDate: '',
      invoiceDetails: '',
      identificationOnPartBoxTrolley: '',
    },
    form7: {
      date: '2026-11-01',
      from: '',
      department: '',
      to: 'CFT',
      customer: '',
      partNameNumber: '',
      revNumber: 'Rev 03',
      reason: '',
      requestDate: '2026-11-01',
      requestSignature: '',
      firstProductionRunDate: '',
      quantityProduced: '300 Nos',
      cycleTimeProductionRate: '',
      pfdNumber: '',
      pfdRevNo: '',
      pfdDate: '',
      controlPlanNumber: '',
      controlPlanRevNo: '',
      controlPlanDate: '',
      deviationsToProcessFlow: 'No',
      processFlowDeviationNature: '',
      deviationsToControlPlan: 'No',
      controlPlanDeviationNature: '',
      pswInternalApprovalDate: '',
      submissionRequired: 'Yes',
      submissionStatus: 'Pending',
      productDispatchAuthBy: '',
      coreTeamSignOffs: [],
    },
    documents: [],
    activityHistory: [],
  };
}

test('syncInterconnectedFields propagates PCRF metadata across Forms 2-7', () => {
  const synced = syncInterconnectedFields(makeDummyRecord());
  assert.equal(synced.form2.slNo, 'PCRF-2026-999');
  assert.equal(synced.form2.partName, 'Steering Knuckle LH');
  assert.equal(synced.form3.partNo, 'SA-SK-4410');
  assert.equal(synced.form4.customer, 'Tata Motors');
  assert.equal(synced.form5.productCode, 'SA-SK-4410');
  assert.equal(synced.form6.partNameNumber, 'Steering Knuckle LH / SA-SK-4410');
  assert.equal(synced.form7.reason, 'Reduce cycle time bottleneck on VMC Line 3');
});

test('computeOverallRisk escalates overall risk level to H when any risk point is HIGH', () => {
  const rows = createDefaultRiskPoints();
  assert.equal(rows.length, 18);
  rows[0].riskLevel = 'LOW';
  assert.equal(computeOverallRisk(rows).overallRiskLevel, 'L');
  rows[3].riskLevel = 'MEDIUM';
  assert.equal(computeOverallRisk(rows).overallRiskLevel, 'M');
  rows[5].riskLevel = 'HIGH';
  const res = computeOverallRisk(rows);
  assert.equal(res.overallRiskLevel, 'H');
  assert.equal(res.highCount, 1);
});

test('computeChecklistProgress handles 33 items across 4 pages and No -> Terminate rule', () => {
  const items = createDefaultChecklistItems();
  assert.equal(items.length, 33);
  const allNo = items.map((item) => ({ ...item, isAffected: 'No' as const }));
  const progress = computeChecklistProgress(allNo);
  assert.equal(progress.percentComplete, 100);
  assert.equal(progress.shouldTerminateChecklist, true);
});

test('canAdvancePTRStage enforces PTR 1 -> PTR 2 -> PTR 3 progression', () => {
  const ptr: Form6PTR = makeDummyRecord().form6;
  assert.equal(canAdvancePTRStage(ptr, 'ptr2').allowed, false);
  ptr.ptr1.sampleStatus = 'OK';
  assert.equal(canAdvancePTRStage(ptr, 'ptr2').allowed, true);
  assert.equal(canAdvancePTRStage(ptr, 'ptr3').allowed, false);
  ptr.ptr2.sampleStatus = 'OK';
  assert.equal(canAdvancePTRStage(ptr, 'ptr3').allowed, true);
});

test('RBAC and workflow progression work as expected', () => {
  assert.equal(canUserApproveStage('EMPLOYEE', 'PCRF'), false);
  assert.equal(canUserApproveStage('HOD', 'PCRF'), true);
  assert.equal(canUserApproveStage('PLANT_HEAD', 'INTERNAL_APPROVAL'), true);
  assert.equal(canUserApproveStage('HOF', 'FEASIBILITY'), false);
  assert.equal(canUserApproveStage('COF', 'FEASIBILITY'), true);

  const rec = makeDummyRecord();
  const approved = applyWorkflowDecision(rec, 'APPROVE', 'S. Murugan', 'HOD', 'Verified and approved');
  assert.equal(approved.currentStage, 'FEASIBILITY');
  assert.equal(approved.workflow[0].status, 'COMPLETED');
  assert.equal(approved.workflow[1].status, 'IN_PROGRESS');
});
