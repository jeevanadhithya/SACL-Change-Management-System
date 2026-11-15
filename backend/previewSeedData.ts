import type {
  AuditLogItem,
  ChangeRequestRecord,
  CompanyRecord,
  CustomerRecord,
  DepartmentRecord,
  NotificationItem,
  PartMasterRecord,
  PTRCoreTeamApproval,
  UserAccount,
} from '../frontend/src/types/pcms.ts';
import {
  createDefaultCFT6Signatures,
  createDefaultChecklistItems,
  createDefaultFeasibilityRequirements,
  createDefaultRiskPoints,
  createDefaultTimingActivities,
  createEmptyWeeks,
  createInitialWorkflow,
  syncInterconnectedFields,
} from '../frontend/src/utils/workflow.ts';

export interface DatabaseSchema {
  companies: CompanyRecord[];
  users: UserAccount[];
  departments: DepartmentRecord[];
  customers: CustomerRecord[];
  parts: PartMasterRecord[];
  pcrfs: ChangeRequestRecord[];
  notifications: NotificationItem[];
  auditLogs: AuditLogItem[];
}

export function createDefaultCoreTeamApprovals(): PTRCoreTeamApproval[] {
  const depts: PTRCoreTeamApproval['department'][] = [
    'Production',
    'Quality',
    'Tooling & Fixtures',
    'Marketing',
    'Maintenance',
  ];
  return depts.map((department) => ({
    department,
    ptr1Status: 'Pending',
    ptr1Comment: '',
    ptr1Sign: '',
    ptr2Status: 'Pending',
    ptr2Comment: '',
    ptr2Sign: '',
    ptr3Status: 'Pending',
    ptr3Comment: '',
    ptr3Sign: '',
  }));
}

export function createBlankChangeRequest(params: {
  id: string;
  pcrfNo: string;
  companyId?: string;
  companyName?: string;
  title: string;
  priority: 'Critical' | 'High' | 'Normal';
  createdBy: string;
  createdByEmployeeId: string;
  department: string;
  customer: string;
  partName: string;
  partNo: string;
  changeType: 'Product' | 'Process';
  facilityScope: 'Foundry' | 'Machine Shop' | 'Foundry & Machine Shop';
  classifications: Array<'Man' | 'Machine' | 'Material' | 'Method'>;
  reasonForChange: string;
  particulars: string;
  currentStatus: string;
  changeRequired: string;
  dueDate: string;
}): ChangeRequestRecord {
  const today = new Date().toISOString().slice(0, 10);
  const base: ChangeRequestRecord = {
    id: params.id,
    pcrfNo: params.pcrfNo,
    companyId: params.companyId || 'comp-1',
    companyName: params.companyName || 'Sakthi Auto Component Limited — Machine Shop Division',
    title: params.title,
    priority: params.priority,
    createdBy: params.createdBy,
    createdByEmployeeId: params.createdByEmployeeId,
    createdAt: today,
    updatedAt: today,
    dueDate: params.dueDate,
    currentStage: 'PCRF',
    overallStatus: 'In Review',
    workflow: createInitialWorkflow(),
    form1: {
      pcrfNo: params.pcrfNo,
      requisitionBy: params.createdBy,
      requisitionerSign: params.createdBy,
      department: params.department,
      requisitionerHodSign: '',
      date: today,
      customer: params.customer,
      partName: params.partName,
      partNo: params.partNo,
      classifications: params.classifications,
      changeType: params.changeType,
      facilityScope: params.facilityScope,
      particularsRows: [
        {
          id: `part-${Date.now()}`,
          particulars: params.particulars,
          currentStatus: params.currentStatus,
          changeRequired: params.changeRequired,
          targetFacility:
            params.facilityScope === 'Foundry'
              ? 'F'
              : params.facilityScope === 'Machine Shop'
              ? 'M'
              : 'F&M',
        },
      ],
      reasonForChange: params.reasonForChange,
      reasonFacilityApplicable:
        params.facilityScope === 'Foundry'
          ? 'Foundry'
          : params.facilityScope === 'Machine Shop'
          ? 'Machine Shop'
          : 'Both',
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
      forwardedTo: 'Department HOD / CFT',
    },
    form2: {
      slNo: params.pcrfNo,
      date: today,
      from: params.department,
      to: 'CFT',
      partName: params.partName,
      partNo: params.partNo,
      customer: params.customer,
      categoryOfChange: `${params.changeType} (${params.classifications.join(', ')}) — ${params.facilityScope}`,
      requirements: createDefaultFeasibilityRequirements(),
      additionalResourceRequirement: '',
      conclusion: 'PENDING',
      cftSignatures: createDefaultCFT6Signatures(),
      comments: '',
      forwardedTo: 'CFT Leader',
      acknowledgementStatus: 'Pending',
      acknowledgementDate: '',
    },
    form3: {
      partName: params.partName,
      partNo: params.partNo,
      customer: params.customer,
      date: today,
      riskRows: createDefaultRiskPoints(),
      conclusion: 'Pending',
      overallRiskLevel: 'L',
      cftSignatures: createDefaultCFT6Signatures(),
    },
    form4: {
      projectName: `${params.customer} — ${params.partName}`,
      drawingPartNo: params.partNo,
      productName: params.partName,
      customer: params.customer,
      preparedDate: today,
      lastRevDate: today,
      revision: '01',
      productTypeFlags: params.changeType === 'Product' ? ['B'] : ['C'],
      monthLabels: ['Nov 26', 'Dec 26', 'Jan 27', 'Feb 27', 'Mar 27', 'Apr 27'],
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
      productCode: params.partNo,
      productDescription: params.partName,
      customerName: params.customer,
      customerPartNo: params.partNo,
      changeCategoryType: params.changeType === 'Product' ? 'Prod. Change' : 'Proc. Change',
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
        { sign: '', name: '', title: 'Production Lead' },
        { sign: '', name: '', title: 'QA Lead' },
        { sign: '', name: '', title: 'Planning Engineer' },
      ],
    },
    form6: {
      date: today,
      from: params.createdBy,
      department: params.department,
      to: 'CFT',
      customer: params.customer,
      partNameNumber: `${params.partName} / ${params.partNo}`,
      revNumber: 'Rev 01',
      reason: params.reasonForChange,
      requestDate: today,
      requestSignature: params.createdBy,
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
      coreTeamApprovals: createDefaultCoreTeamApprovals(),
      cftComments: '',
      breakPointDate: '',
      invoiceDetails: '',
      identificationOnPartBoxTrolley: '',
    },
    form7: {
      date: today,
      from: params.createdBy,
      department: params.department,
      to: 'CFT',
      customer: params.customer,
      partNameNumber: `${params.partName} / ${params.partNo}`,
      revNumber: 'Rev 01',
      reason: params.reasonForChange,
      requestDate: today,
      requestSignature: params.createdBy,
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
      coreTeamSignOffs: [
        { sign: '', name: '', date: '' },
        { sign: '', name: '', date: '' },
        { sign: '', name: '', date: '' },
      ],
    },
    documents: [
      {
        id: `doc-${Date.now()}`,
        name: `${params.pcrfNo}_Initial_Requisition.pdf`,
        category: 'Generated Form',
        formType: 'PCRF (QF/07/MRO-15)',
        uploadedBy: params.createdBy,
        uploadedDate: today,
        revision: 'Rev 01',
      },
    ],
    activityHistory: [
      {
        id: `hist-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorName: params.createdBy,
        actorRole: 'EMPLOYEE',
        action: `Raised Change Request ${params.pcrfNo}`,
        stage: 'Process Change Requisition',
        comments: params.reasonForChange,
      },
    ],
  };

  return syncInterconnectedFields(base);
}

export function buildSeedDatabase(): DatabaseSchema {
  const companies: CompanyRecord[] = [
    {
      id: 'comp-1',
      code: 'SACL-MSH',
      name: 'Sakthi Auto Component Limited',
      unitName: 'Machine Shop Division (Unit I)',
      facilityType: 'Machine Shop',
      location: 'Mukasi Pallagoundanpalayam, Pollachi, TN',
      gstOrRegNo: '33AAACS8812N1Z4',
      contactEmail: 'machineshop@sakthiauto.com',
      active: true,
    },
    {
      id: 'comp-2',
      code: 'SACL-FDY',
      name: 'Sakthi Auto Component Limited',
      unitName: 'Foundry Operations (Disamatic Lines)',
      facilityType: 'Foundry',
      location: 'Pollachi, Tamil Nadu',
      gstOrRegNo: '33AAACS8812N1Z4',
      contactEmail: 'foundry@sakthiauto.com',
      active: true,
    },
    {
      id: 'comp-3',
      code: 'SACL-COI',
      name: 'Sakthi Auto Precision Machining Pvt. Ltd.',
      unitName: 'CNC & Axle Sub-Assembly Plant',
      facilityType: 'Foundry & Machine Shop',
      location: 'Coimbatore Industrial Estate, TN',
      gstOrRegNo: '33AABCS9044K1Z9',
      contactEmail: 'precision@sakthiauto.com',
      active: true,
    },
  ];

  const users: UserAccount[] = [
    {
      id: 'u-admin',
      employeeId: 'ADM001',
      name: 'V. Balasubramanian',
      email: 'admin@sakthiauto.com',
      role: 'ADMIN',
      department: 'Corporate IT & Systems',
      title: 'System Administrator',
      facility: 'Corporate',
      active: true,
      password: 'password123',
    },
    {
      id: 'u-emp',
      employeeId: 'EMP101',
      name: 'R. Karthik',
      email: 'karthik.r@sakthiauto.com',
      role: 'EMPLOYEE',
      department: 'Machine Shop',
      title: 'Senior Process Engineer',
      facility: 'Machine Shop',
      active: true,
      password: 'password123',
    },
    {
      id: 'u-hod',
      employeeId: 'HOD201',
      name: 'S. Muruganandam',
      email: 'murugan.s@sakthiauto.com',
      role: 'HOD',
      department: 'Machine Shop',
      title: 'Head of Department — Machining',
      facility: 'Machine Shop',
      active: true,
      password: 'password123',
    },
    {
      id: 'u-hof',
      employeeId: 'HOF301',
      name: 'K. Natarajan',
      email: 'natarajan.k@sakthiauto.com',
      role: 'HOF',
      department: 'Foundry Operations',
      title: 'Head of Foundry (HOF)',
      facility: 'Foundry',
      active: true,
      password: 'password123',
    },
    {
      id: 'u-cof',
      employeeId: 'COF302',
      name: 'M. Senthil Kumar',
      email: 'senthil.m@sakthiauto.com',
      role: 'COF',
      department: 'Machining & Assembly',
      title: 'Chief of Operations / Facility (COF)',
      facility: 'Machine Shop',
      active: true,
      password: 'password123',
    },
    {
      id: 'u-cft',
      employeeId: 'CFT401',
      name: 'P. Anitha',
      email: 'anitha.p@sakthiauto.com',
      role: 'CFT',
      department: 'Quality Assurance',
      title: 'CFT Quality Engineer',
      facility: 'Quality',
      active: true,
      password: 'password123',
    },
    {
      id: 'u-cftl',
      employeeId: 'CFTL01',
      name: 'D. Prakash Raj',
      email: 'prakash.d@sakthiauto.com',
      role: 'CFT_LEADER',
      department: 'New Product Development',
      title: 'CFT Leader — APQP & Change Control',
      facility: 'Corporate',
      active: true,
      password: 'password123',
    },
    {
      id: 'u-ph',
      employeeId: 'PH001',
      name: 'N. Chandrasekhar',
      email: 'chandrasekhar.n@sakthiauto.com',
      role: 'PLANT_HEAD',
      department: 'Plant Management',
      title: 'Plant Head — Pollachi Operations',
      facility: 'Corporate',
      active: true,
      password: 'password123',
    },
  ];

  const departments: DepartmentRecord[] = [
    { id: 'd1', code: 'FDY', name: 'Foundry Operations', facility: 'Foundry', hodName: 'K. Natarajan', memberCount: 42 },
    { id: 'd2', code: 'MSH', name: 'Machine Shop', facility: 'Machine Shop', hodName: 'S. Muruganandam', memberCount: 58 },
    { id: 'd3', code: 'QA', name: 'Quality Assurance', facility: 'Quality', hodName: 'P. Anitha', memberCount: 24 },
    { id: 'd4', code: 'NPD', name: 'New Product Development', facility: 'Corporate', hodName: 'D. Prakash Raj', memberCount: 16 },
    { id: 'd5', code: 'MNT', name: 'Plant Maintenance', facility: 'Machine Shop', hodName: 'R. Vignesh', memberCount: 19 },
    { id: 'd6', code: 'TLG', name: 'Tooling & Fixtures', facility: 'Machine Shop', hodName: 'G. Aravind', memberCount: 14 },
  ];

  const customers: CustomerRecord[] = [
    { id: 'c1', code: 'TAT', name: 'Tata Motors Ltd.', location: 'Pune / Jamshedpur', contactPerson: 'A. Deshmukh' },
    { id: 'c2', code: 'MNM', name: 'Mahindra & Mahindra', location: 'Nashik / Chakan', contactPerson: 'R. Kulkarni' },
    { id: 'c3', code: 'AL', name: 'Ashok Leyland', location: 'Ennore / Hosur', contactPerson: 'S. Venkatraman' },
    { id: 'c4', code: 'BSH', name: 'Bosch Chassis Systems', location: 'Chakan, Pune', contactPerson: 'M. Patwardhan' },
    { id: 'c5', code: 'DAN', name: 'Dana India Pvt. Ltd.', location: 'Pune', contactPerson: 'K. Joshi' },
    { id: 'c6', code: 'HYU', name: 'Hyundai Motor India', location: 'Sriperumbudur', contactPerson: 'J. Park' },
  ];

  const parts: PartMasterRecord[] = [
    { id: 'pt1', partNumber: 'SA-SK-4410', partName: 'Steering Knuckle LH', customer: 'Tata Motors Ltd.', facility: 'Foundry & Machine Shop', currentRevision: 'Rev 03' },
    { id: 'pt2', partNumber: 'SA-DC-2180', partName: 'Differential Case SG500', customer: 'Dana India Pvt. Ltd.', facility: 'Foundry & Machine Shop', currentRevision: 'Rev 02' },
    { id: 'pt3', partNumber: 'SA-BC-1095', partName: 'Brake Caliper Housing', customer: 'Bosch Chassis Systems', facility: 'Machine Shop', currentRevision: 'Rev 04' },
    { id: 'pt4', partNumber: 'SA-FH-3320', partName: 'Flywheel Housing Heavy Duty', customer: 'Ashok Leyland', facility: 'Foundry', currentRevision: 'Rev 01' },
    { id: 'pt5', partNumber: 'SA-WH-5501', partName: 'Rear Wheel Hub Assembly', customer: 'Mahindra & Mahindra', facility: 'Foundry & Machine Shop', currentRevision: 'Rev 02' },
    { id: 'pt6', partNumber: 'SA-CR-6120', partName: 'Carrier Differential Axle', customer: 'Hyundai Motor India', facility: 'Machine Shop', currentRevision: 'Rev 03' },
  ];

  // PCRF 1: In Timing Plan & Plant Head Approval stage (Rich interconnected data!)
  const pcrf1 = createBlankChangeRequest({
    id: 'pcrf-001',
    pcrfNo: 'PCRF-2026-041',
    title: 'Steering Knuckle LH — CNC Bore Finishing Cycle Optimization',
    priority: 'Critical',
    createdBy: 'R. Karthik',
    createdByEmployeeId: 'EMP101',
    department: 'Machine Shop',
    customer: 'Tata Motors Ltd.',
    partName: 'Steering Knuckle LH',
    partNo: 'SA-SK-4410',
    changeType: 'Process',
    facilityScope: 'Machine Shop',
    classifications: ['Method', 'Machine'],
    reasonForChange: 'Eliminate taper variation in kingpin bore and reduce VMC cycle time from 142s to 118s',
    particulars: 'Machining Cycle Time Optimization',
    currentStatus: 'HSS Reamer finish bore, cycle time 142 sec, Cpk 1.31',
    changeRequired: 'PCD Cartridge finish boring bar on HMC-04, target 118 sec, Cpk >= 1.67',
    dueDate: '2026-12-20',
  });
  pcrf1.createdAt = '2026-10-18';
  pcrf1.updatedAt = '2026-11-14';
  pcrf1.currentStage = 'INTERNAL_APPROVAL';
  pcrf1.overallStatus = 'In Review';
  pcrf1.form1.requisitionerHodSign = 'S. Muruganandam (19-Oct-2026)';
  pcrf1.form1.cftCommentsFoundry = 'No impact on raw casting datum pads; foundry riser unchanged.';
  pcrf1.form1.cftFoundryFeasibility = 'Feasible';
  pcrf1.form1.cftLeaderFoundrySign = 'D. Prakash Raj';
  pcrf1.form1.cftLeaderFoundryDate = '2026-10-22';
  pcrf1.form1.cftCommentsMachineShop = 'HMC-04 fixture clamping checked; PCD boring bar trial confirmed 116s cycle.';
  pcrf1.form1.cftMachineShopFeasibility = 'Feasible';
  pcrf1.form1.cftLeaderMachineShopSign = 'D. Prakash Raj';
  pcrf1.form1.cftLeaderMachineShopDate = '2026-10-22';
  pcrf1.form1.customerCommunicationDetail = 'Intimated Tata Motors SQA (A. Deshmukh) via ECN notice ref TAT/ECN/2026/88';
  pcrf1.form1.changeReflectionInSOP = true;
  pcrf1.form1.sopDocumentRef = 'SOP-MSH-4410-R04';

  pcrf1.form2.requirements = pcrf1.form2.requirements.map((r) => ({ ...r, decision: 'Feasible' }));
  pcrf1.form2.additionalResourceRequirement = '1x PCD Cartridge Boring Bar (Sandvik R416) & Air Gauge calibration master';
  pcrf1.form2.conclusion = 'FEASIBLE';
  pcrf1.form2.comments = 'All 6 CFT functions confirmed tooling readiness and gauge repeatability.';
  pcrf1.form2.acknowledgementStatus = 'Acknowledged';
  pcrf1.form2.acknowledgementDate = '2026-10-24';
  pcrf1.form2.cftSignatures = pcrf1.form2.cftSignatures.map((s, i) => ({
    ...s,
    name: ['K. Natarajan', 'S. Muruganandam', 'P. Anitha', 'R. Karthik', 'R. Vignesh', 'M. Senthil Kumar'][i],
    signed: true,
    date: '2026-10-23',
  }));

  pcrf1.form3.riskRows = pcrf1.form3.riskRows.map((row, idx) => {
    if (idx === 0 || idx === 1) {
      return { ...row, riskLevel: 'MEDIUM', controlMethod: 'Operator OJT & Tool Setter SOP', effectOnQCD: 'Quality', actions: 'Conduct shift-wise skill check before PTR 1' };
    }
    if (idx === 4 || idx === 5) {
      return { ...row, riskLevel: 'HIGH', controlMethod: '100% Air Gauge Bore Inspection for first 50 pcs', effectOnQCD: 'Quality / Cost', actions: 'Verify Cpk >= 1.67 during PTR 1 & PTR 2' };
    }
    return { ...row, riskLevel: 'LOW', controlMethod: 'Standard Control Plan', effectOnQCD: 'None', actions: 'Monitor in routine audit' };
  });
  pcrf1.form3.overallRiskLevel = 'H';
  pcrf1.form3.conclusion = 'Acceptable';
  pcrf1.form3.cftSignatures = pcrf1.form2.cftSignatures;

  // Populate Timing Plan Gantt weeks
  pcrf1.form4.customerTimelineWeeks = pcrf1.form4.customerTimelineWeeks.map((_, i) => i >= 0 && i <= 15);
  pcrf1.form4.internalTimelineWeeks = pcrf1.form4.internalTimelineWeeks.map((_, i) => i >= 1 && i <= 13);
  pcrf1.form4.tier2TimelineWeeks = pcrf1.form4.tier2TimelineWeeks.map((_, i) => i >= 2 && i <= 7);
  pcrf1.form4.activities = pcrf1.form4.activities.map((act, idx) => {
    const start = idx;
    const end = Math.min(23, idx + 3);
    return {
      ...act,
      plannedWeeks: act.plannedWeeks.map((_, w) => w >= start && w <= end),
      actualWeeks: act.actualWeeks.map((_, w) => (idx < 6 ? w >= start && w <= Math.min(end, start + 2) : false)),
      remarks: idx < 6 ? 'Completed on schedule' : 'Scheduled',
    };
  });
  pcrf1.form4.cftMembers = ['K. Natarajan', 'S. Muruganandam', 'P. Anitha', 'R. Karthik', 'R. Vignesh', 'D. Prakash Raj'];
  pcrf1.form4.goForNextPhase = 'Yes';
  pcrf1.form4.cftLeaderSign = 'D. Prakash Raj (2026-11-05)';

  pcrf1.workflow = pcrf1.workflow.map((w, i) => {
    if (i < 4) return { ...w, status: 'COMPLETED', updatedAt: '2026-11-05', updatedBy: 'D. Prakash Raj' };
    if (i === 4) return { ...w, status: 'IN_PROGRESS', updatedAt: '2026-11-06', updatedBy: 'Pending Plant Head' };
    return w;
  });

  // PCRF 2: In PTR Stage (PTR 1 OK, PTR 2 active!)
  const pcrf2 = createBlankChangeRequest({
    id: 'pcrf-002',
    pcrfNo: 'PCRF-2026-038',
    title: 'Differential Case SG500 — Disamatic Moulding Sand Moisture Control',
    priority: 'High',
    createdBy: 'K. Natarajan',
    createdByEmployeeId: 'HOF301',
    department: 'Foundry Operations',
    customer: 'Dana India Pvt. Ltd.',
    partName: 'Differential Case SG500',
    partNo: 'SA-DC-2180',
    changeType: 'Process',
    facilityScope: 'Foundry',
    classifications: ['Material', 'Method'],
    reasonForChange: 'Reduce blowhole rejection from 1.8% to <0.4% on Disamatic Line 2',
    particulars: 'Process Parameter Modification',
    currentStatus: 'Compactability 42-46%, Moisture 3.8%',
    changeRequired: 'Automated moisture sensor loop: Compactability 38-41%, Moisture 3.4%',
    dueDate: '2026-12-05',
  });
  pcrf2.createdAt = '2026-10-02';
  pcrf2.updatedAt = '2026-11-12';
  pcrf2.currentStage = 'PTR';
  pcrf2.overallStatus = 'In Implementation';
  pcrf2.form1.internalApprovalStatus = 'Approved';
  pcrf2.form1.plantHeadApproval = 'Approved';
  pcrf2.form1.plantHeadSign = 'N. Chandrasekhar (2026-10-20)';
  pcrf2.form5.items = pcrf2.form5.items.map((item, idx) => ({
    ...item,
    isAffected: idx < 10 ? 'Yes' : 'No',
    responsibility: idx < 10 ? 'Foundry QA' : 'N/A',
    reqdDate: idx < 10 ? '2026-11-10' : '',
    actualDate: idx < 8 ? '2026-11-09' : '',
    docNo: idx < 10 ? `DOC-FDY-${100 + idx}` : '',
    curRev: idx < 10 ? 'Rev 03' : '',
  }));
  pcrf2.form6.ptr1 = {
    required: 'Yes',
    productionRunDate: '2026-11-08',
    quantityProduced: '5 Nos',
    meetsDrawingReq: 'Yes',
    sampleSubmissionReq: 'Yes',
    sampleSubmittedDate: '2026-11-09',
    sampleStatus: 'OK',
    actionPlanComments: 'All 5 castings passed X-ray porosity check (0% blowholes).',
  };
  pcrf2.form6.coreTeamApprovals = pcrf2.form6.coreTeamApprovals.map((c) => ({
    ...c,
    ptr1Status: 'OK',
    ptr1Comment: 'Verified OK',
    ptr1Sign: 'Signed',
  }));
  pcrf2.workflow = pcrf2.workflow.map((w, i) => {
    if (i < 6) return { ...w, status: 'COMPLETED', updatedAt: '2026-11-07', updatedBy: 'N. Chandrasekhar' };
    if (i === 6) return { ...w, status: 'IN_PROGRESS', updatedAt: '2026-11-12', updatedBy: 'P. Anitha' };
    return w;
  });

  // PCRF 3: Newly Raised — Waiting at PCRF/Feasibility
  const pcrf3 = createBlankChangeRequest({
    id: 'pcrf-003',
    pcrfNo: 'PCRF-2026-044',
    title: 'Brake Caliper Housing — Customer Drawing Rev 05 Chamfer Update',
    priority: 'Critical',
    createdBy: 'R. Karthik',
    createdByEmployeeId: 'EMP101',
    department: 'Machine Shop',
    customer: 'Bosch Chassis Systems',
    partName: 'Brake Caliper Housing',
    partNo: 'SA-BC-1095',
    changeType: 'Product',
    facilityScope: 'Foundry & Machine Shop',
    classifications: ['Method', 'Machine'],
    reasonForChange: 'Customer ECN-BSH-2026-19 requires 1.5x45 deg chamfer on mounting boss',
    particulars: 'Engineering Drawing Revision',
    currentStatus: 'Rev 04: 0.8x45 deg chamfer on mounting ear',
    changeRequired: 'Update to Rev 05: 1.5x45 deg chamfer; modify CNC program & casting trim die',
    dueDate: '2026-12-30',
  });
  pcrf3.createdAt = '2026-11-12';
  pcrf3.updatedAt = '2026-11-14';
  pcrf3.currentStage = 'FEASIBILITY';
  pcrf3.overallStatus = 'In Review';
  pcrf3.workflow = pcrf3.workflow.map((w, i) => {
    if (i === 0) return { ...w, status: 'COMPLETED', updatedAt: '2026-11-13', updatedBy: 'S. Muruganandam' };
    if (i === 1) return { ...w, status: 'IN_PROGRESS' };
    return w;
  });

  // PCRF 4: At Risk Analysis Stage
  const pcrf4 = createBlankChangeRequest({
    id: 'pcrf-004',
    pcrfNo: 'PCRF-2026-042',
    title: 'Flywheel Housing Heavy Duty — Alternate Inoculant Alloy Trial',
    priority: 'Normal',
    createdBy: 'K. Natarajan',
    createdByEmployeeId: 'HOF301',
    department: 'Foundry Operations',
    customer: 'Ashok Leyland',
    partName: 'Flywheel Housing Heavy Duty',
    partNo: 'SA-FH-3320',
    changeType: 'Process',
    facilityScope: 'Foundry',
    classifications: ['Material'],
    reasonForChange: 'Qualify secondary FeSi-Ba inoculant supplier to mitigate single-source risk',
    particulars: 'Raw Material / Alloy Specification Change',
    currentStatus: 'Single approved supplier (Elkem Foundrisil)',
    changeRequired: 'Add secondary approved source (ASK Chemicals) after microstructure & tensile validation',
    dueDate: '2027-01-15',
  });
  pcrf4.createdAt = '2026-11-01';
  pcrf4.updatedAt = '2026-11-13';
  pcrf4.currentStage = 'RISK_ANALYSIS';
  pcrf4.overallStatus = 'In Review';
  pcrf4.workflow = pcrf4.workflow.map((w, i) => {
    if (i < 2) return { ...w, status: 'COMPLETED', updatedAt: '2026-11-10', updatedBy: 'D. Prakash Raj' };
    if (i === 2) return { ...w, status: 'IN_PROGRESS' };
    return w;
  });

  // PCRF 5: Completed & Closed
  const pcrf5 = createBlankChangeRequest({
    id: 'pcrf-005',
    pcrfNo: 'PCRF-2026-031',
    title: 'Rear Wheel Hub Assembly — Automated Barcode Laser Marking',
    priority: 'Normal',
    createdBy: 'M. Senthil Kumar',
    createdByEmployeeId: 'COF302',
    department: 'Machine Shop',
    customer: 'Mahindra & Mahindra',
    partName: 'Rear Wheel Hub Assembly',
    partNo: 'SA-WH-5501',
    changeType: 'Process',
    facilityScope: 'Machine Shop',
    classifications: ['Machine', 'Method'],
    reasonForChange: 'Replace manual dot-peen stamping with automated 2D DataMatrix laser marking',
    particulars: 'Packaging & Trolley Identification Update',
    currentStatus: 'Manual dot-peen marking with 0.6% unreadable rate',
    changeRequired: 'Inline fiber laser station with camera verification',
    dueDate: '2026-10-30',
  });
  pcrf5.createdAt = '2026-09-10';
  pcrf5.updatedAt = '2026-10-28';
  pcrf5.currentStage = 'CLOSURE';
  pcrf5.overallStatus = 'Closed';
  pcrf5.form1.internalApprovalStatus = 'Approved';
  pcrf5.form1.plantHeadApproval = 'Approved';
  pcrf5.form1.plantHeadSign = 'N. Chandrasekhar';
  pcrf5.form7.firstProductionRunDate = '2026-10-22';
  pcrf5.form7.quantityProduced = '320 Nos';
  pcrf5.form7.cycleTimeProductionRate = '42 sec / pc';
  pcrf5.form7.pfdNumber = 'PFD-MSH-5501';
  pcrf5.form7.pfdRevNo = 'Rev 03';
  pcrf5.form7.controlPlanNumber = 'CP-MSH-5501';
  pcrf5.form7.controlPlanRevNo = 'Rev 03';
  pcrf5.form7.pswInternalApprovalDate = '2026-10-26';
  pcrf5.form7.submissionRequired = 'Yes';
  pcrf5.form7.submissionStatus = 'Yes';
  pcrf5.form7.productDispatchAuthBy = 'N. Chandrasekhar (Plant Head)';
  pcrf5.workflow = pcrf5.workflow.map((w) => ({
    ...w,
    status: 'COMPLETED',
    updatedAt: '2026-10-28',
    updatedBy: 'N. Chandrasekhar',
  }));

  const notifications: NotificationItem[] = [
    {
      id: 'n1',
      type: 'Approval Required',
      title: 'Plant Head Sign-Off Required — PCRF-2026-041',
      message: 'Steering Knuckle LH Timing Plan & Risk Analysis completed by CFT Leader. Ready for Internal Approval.',
      pcrfId: 'pcrf-001',
      pcrfNo: 'PCRF-2026-041',
      targetRoles: ['PLANT_HEAD', 'ADMIN', 'HOF', 'COF'],
      createdAt: '2026-11-14T09:15:00Z',
      read: false,
    },
    {
      id: 'n2',
      type: 'PTR Approval',
      title: 'PTR 2 Trial Run Scheduled — PCRF-2026-038',
      message: 'PTR 1 (5 Nos) passed X-ray validation. PTR 2 (25 Nos) unlocked for Differential Case SG500.',
      pcrfId: 'pcrf-002',
      pcrfNo: 'PCRF-2026-038',
      targetRoles: ['CFT', 'CFT_LEADER', 'HOF', 'ADMIN'],
      createdAt: '2026-11-13T14:30:00Z',
      read: false,
    },
    {
      id: 'n3',
      type: 'New Change Request',
      title: 'Feasibility Review Assigned — PCRF-2026-044',
      message: 'Bosch Chassis Systems Brake Caliper Housing Rev 05 drawing change forwarded to CFT.',
      pcrfId: 'pcrf-003',
      pcrfNo: 'PCRF-2026-044',
      targetRoles: ['CFT', 'CFT_LEADER', 'HOD', 'COF', 'EMPLOYEE', 'ADMIN'],
      createdAt: '2026-11-13T11:00:00Z',
      read: false,
    },
    {
      id: 'n4',
      type: 'Timing Plan Milestone',
      title: 'APQP Phase I Milestone Approaching — PCRF-2026-042',
      message: 'Risk Analysis Check Sheet for Flywheel Housing inoculant trial is due for CFT review.',
      pcrfId: 'pcrf-004',
      pcrfNo: 'PCRF-2026-042',
      targetRoles: ['CFT', 'CFT_LEADER', 'HOF', 'ADMIN'],
      createdAt: '2026-11-12T16:20:00Z',
      read: true,
    },
  ];

  const auditLogs: AuditLogItem[] = [
    {
      id: 'al-1',
      timestamp: '2026-11-14T09:15:00Z',
      actorId: 'CFTL01',
      actorName: 'D. Prakash Raj',
      actorRole: 'CFT_LEADER',
      entityType: 'TimingPlan',
      entityId: 'PCRF-2026-041',
      action: 'SUBMITTED_FOR_PLANT_HEAD',
      details: 'Submitted Timing Plan (QF/07/MKT-08) with Go for Next Phase = Yes.',
    },
    {
      id: 'al-2',
      timestamp: '2026-11-13T14:30:00Z',
      actorId: 'CFT401',
      actorName: 'P. Anitha',
      actorRole: 'CFT',
      entityType: 'PTR',
      entityId: 'PCRF-2026-038',
      action: 'PTR1_PASSED',
      details: 'Marked PTR 1 (5 Nos) Sample Status = OK, unlocking PTR 2 (25 Nos).',
    },
    {
      id: 'al-3',
      timestamp: '2026-11-13T10:12:00Z',
      actorId: 'HOD201',
      actorName: 'S. Muruganandam',
      actorRole: 'HOD',
      entityType: 'PCRF',
      entityId: 'PCRF-2026-044',
      action: 'APPROVED_PCRF_STAGE',
      details: 'HOD signed off Process Change Requisition and forwarded to CFT for Feasibility.',
    },
  ];

  return {
    companies,
    users,
    departments,
    customers,
    parts,
    pcrfs: [pcrf1, pcrf2, pcrf3, pcrf4, pcrf5],
    notifications,
    auditLogs,
  };
}
