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
  currentRevision?: string;
  drawingNumber?: string;
  materialGrade?: string;
  processType?: string;
  specifications?: string;
  actorRole?: UserAccount['role'];
}): ChangeRequestRecord {
  const today = new Date().toISOString().slice(0, 10);
  const resolvedRev = params.currentRevision?.trim() || 'Rev 01';
  const shortRev = resolvedRev.replace(/^Rev\s*/i, '') || '01';
  const drawingAndPart = params.drawingNumber?.trim()
    ? `${params.partNo} / ${params.drawingNumber.trim()}`
    : params.partNo;
  const specSummaryParts = [
    params.materialGrade?.trim() ? `Material: ${params.materialGrade.trim()}` : '',
    params.processType?.trim() ? `Process: ${params.processType.trim()}` : '',
    params.drawingNumber?.trim() ? `Drg: ${params.drawingNumber.trim()} (${resolvedRev})` : `Rev: ${resolvedRev}`,
    params.specifications?.trim() ? `Specs: ${params.specifications.trim()}` : '',
  ].filter(Boolean);
  const resolvedCurrentStatus =
    params.currentStatus && params.currentStatus !== 'Current baseline' && params.currentStatus !== 'Baseline process state'
      ? params.currentStatus
      : specSummaryParts.length > 0
      ? specSummaryParts.join(' | ')
      : params.currentStatus;

  const base: ChangeRequestRecord = {
    id: params.id,
    pcrfNo: params.pcrfNo,
    companyId: params.companyId || undefined,
    companyName: params.companyName || undefined,
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
          currentStatus: resolvedCurrentStatus,
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
      drawingPartNo: drawingAndPart,
      productName: params.partName,
      customer: params.customer,
      preparedDate: today,
      lastRevDate: today,
      revision: shortRev,
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
      revNumber: resolvedRev,
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
      revNumber: resolvedRev,
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
        actorRole: params.actorRole || 'EMPLOYEE',
        action: `Raised Change Request ${params.pcrfNo}`,
        stage: 'Process Change Requisition',
        comments: params.reasonForChange,
      },
    ],
  };

  return syncInterconnectedFields(base);
}

export function buildSeedDatabase(): DatabaseSchema {
  const users: UserAccount[] = [
    {
      id: 'u-admin',
      employeeId: 'ADM001',
      username: 'ADM001',
      name: 'V. Balasubramanian',
      email: 'admin@sakthiauto.com',
      phone: '+91 4259 234100',
      role: 'ADMIN',
      department: 'Corporate IT & Systems',
      title: 'System Administrator',
      facility: 'Corporate',
      plantLocation: 'Pollachi Corporate HQ, Tamil Nadu',
      bio: 'System governance, JWT access control, and plant master administration.',
      avatarInitials: 'VB',
      emailNotifications: true,
      inAppNotifications: true,
      companyId: null,
      active: true,
      password: 'password123',
    },
    {
      id: 'u-emp',
      employeeId: 'EMP101',
      username: 'EMP101',
      name: 'R. Karthik',
      email: 'karthik.r@sakthiauto.com',
      phone: '+91 4259 234101',
      role: 'EMPLOYEE',
      department: 'Machine Shop',
      title: 'Senior Process Engineer',
      facility: 'Machine Shop',
      plantLocation: 'Pollachi Machine Shop Unit I, Tamil Nadu',
      bio: 'CNC turning, VMC fixture engineering, and 4M process change initiation.',
      avatarInitials: 'RK',
      emailNotifications: true,
      inAppNotifications: true,
      companyId: null,
      active: true,
      password: 'password123',
    },
    {
      id: 'u-hod',
      employeeId: 'HOD201',
      username: 'HOD201',
      name: 'S. Muruganandam',
      email: 'murugan.s@sakthiauto.com',
      phone: '+91 4259 234201',
      role: 'HOD',
      department: 'Machine Shop',
      title: 'Head of Department — Machining',
      facility: 'Machine Shop',
      plantLocation: 'Pollachi Machine Shop Unit I, Tamil Nadu',
      bio: 'Department-level technical review and PCRF approval authority for Machining.',
      avatarInitials: 'SM',
      emailNotifications: true,
      inAppNotifications: true,
      companyId: null,
      active: true,
      password: 'password123',
    },
    {
      id: 'u-hof',
      employeeId: 'HOF301',
      username: 'HOF301',
      name: 'K. Natarajan',
      email: 'natarajan.k@sakthiauto.com',
      phone: '+91 4259 234301',
      role: 'HOF',
      department: 'Foundry Operations',
      title: 'Head of Foundry (HOF)',
      facility: 'Foundry',
      plantLocation: 'Pollachi Foundry Division, Tamil Nadu',
      bio: 'Melting, SG Iron metallurgy, molding line governance, and foundry change sign-off.',
      avatarInitials: 'KN',
      emailNotifications: true,
      inAppNotifications: true,
      companyId: null,
      active: true,
      password: 'password123',
    },
    {
      id: 'u-cof',
      employeeId: 'COF302',
      username: 'COF302',
      name: 'M. Senthil Kumar',
      email: 'senthil.m@sakthiauto.com',
      phone: '+91 4259 234302',
      role: 'COF',
      department: 'Machining & Assembly',
      title: 'Chief of Operations / Facility (COF)',
      facility: 'Machine Shop',
      plantLocation: 'Pollachi Operations Complex, Tamil Nadu',
      bio: 'Cross-plant manufacturing operations, capacity planning, and facility sign-off.',
      avatarInitials: 'MS',
      emailNotifications: true,
      inAppNotifications: true,
      companyId: null,
      active: true,
      password: 'password123',
    },
    {
      id: 'u-cft',
      employeeId: 'CFT401',
      username: 'CFT401',
      name: 'P. Anitha',
      email: 'anitha.p@sakthiauto.com',
      phone: '+91 4259 234401',
      role: 'CFT',
      department: 'Quality Assurance',
      title: 'CFT Quality Engineer',
      facility: 'Quality',
      plantLocation: 'Pollachi Quality & Metrology Lab, Tamil Nadu',
      bio: 'Feasibility evaluation, 4M Risk Analysis, PTR inspection, and PPAP verification.',
      avatarInitials: 'PA',
      emailNotifications: true,
      inAppNotifications: true,
      companyId: null,
      active: true,
      password: 'password123',
    },
    {
      id: 'u-cftl',
      employeeId: 'CFTL01',
      username: 'CFTL01',
      name: 'D. Prakash Raj',
      email: 'prakash.d@sakthiauto.com',
      phone: '+91 4259 234501',
      role: 'CFT_LEADER',
      department: 'New Product Development',
      title: 'CFT Leader — APQP & Change Control',
      facility: 'Corporate',
      plantLocation: 'Pollachi APQP & NPD Center, Tamil Nadu',
      bio: 'Leads Cross-Functional Team milestones, APQP Timing Plans, and customer PPAP sign-offs.',
      avatarInitials: 'DP',
      emailNotifications: true,
      inAppNotifications: true,
      companyId: null,
      active: true,
      password: 'password123',
    },
    {
      id: 'u-ph',
      employeeId: 'PH001',
      username: 'PH001',
      name: 'N. Chandrasekhar',
      email: 'chandrasekhar.n@sakthiauto.com',
      phone: '+91 4259 234001',
      role: 'PLANT_HEAD',
      department: 'Plant Management',
      title: 'Plant Head — Pollachi Operations',
      facility: 'Corporate',
      plantLocation: 'Pollachi Plant HQ, Tamil Nadu',
      bio: 'Executive plant leadership and final internal approval authority for 4M changes.',
      avatarInitials: 'NC',
      emailNotifications: true,
      inAppNotifications: true,
      companyId: null,
      active: true,
      password: 'password123',
    },
  ];

  return {
    companies: [],
    users,
    departments: [],
    customers: [],
    parts: [],
    pcrfs: [],
    notifications: [],
    auditLogs: [],
  };
}
