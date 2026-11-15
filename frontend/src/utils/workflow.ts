import type {
  ChangeChecklistItem,
  ChangeRequestRecord,
  CFTMemberSignature,
  FeasibilityRequirementItem,
  Form6PTR,
  RiskPointRow,
  TimingPlanActivityRow,
  UserRole,
  WorkflowStageKey,
  WorkflowStageState,
} from '../types/pcms.ts';

export const WORKFLOW_STAGE_ORDER: Array<{
  key: WorkflowStageKey;
  label: string;
  formCode?: string;
}> = [
  { key: 'PCRF', label: 'Process Change Requisition', formCode: 'QF/07/MRO-15' },
  { key: 'FEASIBILITY', label: 'Feasibility Report', formCode: 'QF/07/MRO-02' },
  { key: 'RISK_ANALYSIS', label: 'Risk Analysis', formCode: 'QF/07/MKT-14' },
  { key: 'TIMING_PLAN', label: 'Timing Plan', formCode: 'QF/07/MKT-08' },
  { key: 'INTERNAL_APPROVAL', label: 'Plant Head / Internal Approval' },
  { key: 'CHANGE_CHECKLIST', label: 'Change Management Checklist', formCode: 'QF/07/MRO-03' },
  { key: 'PTR', label: 'PTR Initiation', formCode: 'QF/07/MRO-16' },
  { key: 'PPAP', label: 'PPAP Initiation', formCode: 'QF/07/MRO-05' },
  { key: 'CLOSURE', label: 'Final Closure' },
];

export const PARTICULARS_DROPDOWN_OPTIONS = [
  'Process Parameter Modification',
  'Tooling / Fixture / Pattern Modification',
  'Machining Cycle Time Optimization',
  'Raw Material / Alloy Specification Change',
  'Engineering Drawing Revision',
  'Inspection Gauge / Check Method Update',
  'Supplier / Sub-Contractor Process Transfer',
  'Packaging & Trolley Identification Update',
  'Any Other',
];

export function createEmptyWeeks(): boolean[] {
  return Array.from({ length: 24 }, () => false);
}

export function createDefaultCFT6Signatures(): CFTMemberSignature[] {
  const depts = ['Foundry', 'Machine Shop', 'Quality Assurance', 'Engineering', 'Maintenance', 'Planning'];
  return depts.map((dept, idx) => ({
    slot: idx + 1,
    name: '',
    department: dept,
    signed: false,
    date: '',
  }));
}

export function createDefaultFeasibilityRequirements(): FeasibilityRequirementItem[] {
  return [
    {
      id: 'req-mfg-1',
      section: 'Manufacturing Process / Product Requirement',
      description: 'Foundry moulding / pouring / core process capability verification',
      decision: 'Pending',
    },
    {
      id: 'req-mfg-2',
      section: 'Manufacturing Process / Product Requirement',
      description: 'CNC machining fixture, clamping & tool life capability',
      decision: 'Pending',
    },
    {
      id: 'req-sys-1',
      section: 'System Requirement',
      description: 'PFMEA, Control Plan, Work Instruction & SOP revision readiness',
      decision: 'Pending',
    },
    {
      id: 'req-ins-1',
      section: 'Inspection Requirement',
      description: 'CMM program, attribute gauges & MSA calibration availability',
      decision: 'Pending',
    },
    {
      id: 'req-oth-1',
      section: 'Any Other Requirement',
      description: 'Customer approval / packaging & traceability tag alignment',
      decision: 'Pending',
    },
  ];
}

export function createDefaultRiskPoints(): RiskPointRow[] {
  const rows: Array<Omit<RiskPointRow, 'id'>> = [
    { category: 'Man', riskPoint: 'Insufficient Skill', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Man', riskPoint: 'Operator Awareness', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Man', riskPoint: 'Specific Training', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Method', riskPoint: 'Process Change', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Method', riskPoint: 'Jigs, tool Change', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Method', riskPoint: 'Cycle time', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Method', riskPoint: 'Process Capability', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Method', riskPoint: 'Parameter Change', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Method', riskPoint: 'Document Change', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Method', riskPoint: 'Check method', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Machine', riskPoint: 'Capacity', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Machine', riskPoint: 'Spares', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Machine', riskPoint: 'Machine Capability', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Material', riskPoint: 'Availability of material', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Material', riskPoint: 'Availability of Stock', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Cost', riskPoint: 'Increase in cost', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Quality', riskPoint: 'Cp, Cpk Change', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
    { category: 'Delivery', riskPoint: 'Delivery of Modified Parts', applicability: 'AP', controlMethod: '', riskLevel: 'NA', effectOnQCD: '', actions: '' },
  ];
  return rows.map((row, idx) => ({ ...row, id: `risk-${idx + 1}` }));
}

export function createDefaultTimingActivities(): TimingPlanActivityRow[] {
  const specs: Array<[string, string, boolean]> = [
    ['Customer Enquiry', 'AA, A', false],
    ['Receipt of 2D Drawing & 3D Model', 'AA, A, B, C', true],
    ['Preliminary Assessment', 'AA, A', false],
    ['Product Feasibility', 'AA, A, B, C', true],
    ['Clarification required from customer (if any)', 'AA, A, B, C', false],
    ['Cost Estimation', 'AA, A, B, C', false],
    ['Quote submission', 'AA, A, B, C', false],
    ['LOI / Purchase order', 'AA, A, B, C', true],
    ['Team Feasibility Commitment', 'AA, A', false],
    ['Contract review & Order acceptance', 'AA, A, B, C', false],
  ];
  return specs.map(([activity, applicability, isCritical], idx) => ({
    id: `tp-act-${idx + 1}`,
    apqpPhase: 'I Phase',
    activity,
    applicability,
    isCritical,
    plannedWeeks: createEmptyWeeks(),
    actualWeeks: createEmptyWeeks(),
    remarks: '',
  }));
}

export function createDefaultChecklistItems(): ChangeChecklistItem[] {
  const page1 = [
    'Assembly Drawing Change',
    'Component Drawing Change',
    'Engineering Specification',
    'Material Specification',
    'Process Flow Diagram',
    'Control Plan',
    'Product Audit Check Sheet',
    'Work Instruction',
    'Visual Aids',
  ].map((impactArea, idx) => ({
    id: `chk-1-${idx + 1}`,
    page: 1 as const,
    impactArea,
    isAffected: 'Pending' as const,
    actionComments: '',
    responsibility: '',
    reqdDate: '',
    actualDate: '',
    docNo: '',
    curRev: '',
    remarks: '',
  }));

  const page2 = [
    'Process FMEA',
    'Jigs / Tool / Gauge / Pattern / Drawings / Layout',
    'Jigs / Tool / Gauge / Pattern modification (Physical Modification)',
    'Calibration Cards (for part specific Gauges)',
    'MSA',
    'Product Cost',
    'Approved list of Sub - Contractors',
    'Action on parts already produced and available on Stock',
    'Actions on Sub - Contractor',
    'Sub - Contractor Part Approval',
  ].map((impactArea, idx) => ({
    id: `chk-2-${idx + 1}`,
    page: 2 as const,
    impactArea,
    isAffected: 'Pending' as const,
    actionComments: '',
    responsibility: '',
    reqdDate: '',
    actualDate: '',
    docNo: '',
    curRev: '',
    remarks: '',
  }));

  const page3 = [
    'Any Special Characteristics',
    'SPC affected ?',
    'Checking Aids / Gauges',
    'Production Trial Run',
    'PAP',
    'Master List of — a) Drawings',
    'Master List of — b) Engineering / Material Specification',
    'Master List of — c) Process Flow Diagram',
    'Master List of — d) Control Plan',
    'Master List of — e) Work Instruction',
    'Master List of — h) Process FMEA',
  ].map((impactArea, idx) => ({
    id: `chk-3-${idx + 1}`,
    page: 3 as const,
    impactArea,
    isAffected: 'Pending' as const,
    actionComments: '',
    responsibility: '',
    reqdDate: '',
    actualDate: '',
    docNo: '',
    curRev: '',
    remarks: '',
  }));

  const page4 = [
    'Master List of — i) Active Parts list',
    'Master List of — j) PAP',
    'Master List of — k) IMTE / MMD',
  ].map((impactArea, idx) => ({
    id: `chk-4-${idx + 1}`,
    page: 4 as const,
    impactArea,
    isAffected: 'Pending' as const,
    actionComments: '',
    responsibility: '',
    reqdDate: '',
    actualDate: '',
    docNo: '',
    curRev: '',
    remarks: '',
  }));

  return [...page1, ...page2, ...page3, ...page4];
}

export function createInitialWorkflow(): WorkflowStageState[] {
  return WORKFLOW_STAGE_ORDER.map((stage, idx) => ({
    key: stage.key,
    label: stage.label,
    formCode: stage.formCode,
    status: idx === 0 ? 'IN_PROGRESS' : 'PENDING',
  }));
}

/**
 * Interconnects PCRF Form 1 metadata automatically across Forms 2 through 7
 * so engineers never re-enter Part Name, Part No, Customer, Department, or Reason.
 */
export function syncInterconnectedFields(record: ChangeRequestRecord): ChangeRequestRecord {
  const f1 = record.form1;
  const partDisplay = f1.partName && f1.partNo ? `${f1.partName} / ${f1.partNo}` : f1.partName || f1.partNo;
  const classificationText = f1.classifications.length > 0
    ? `${f1.changeType} (${f1.classifications.join(', ')}) — ${f1.facilityScope}`
    : `${f1.changeType} — ${f1.facilityScope}`;

  return {
    ...record,
    form2: {
      ...record.form2,
      slNo: f1.pcrfNo,
      from: f1.department || record.form2.from,
      partName: f1.partName,
      partNo: f1.partNo,
      customer: f1.customer,
      categoryOfChange: record.form2.categoryOfChange || classificationText,
    },
    form3: {
      ...record.form3,
      partName: f1.partName,
      partNo: f1.partNo,
      customer: f1.customer,
    },
    form4: {
      ...record.form4,
      drawingPartNo: f1.partNo,
      productName: f1.partName,
      customer: f1.customer,
      projectName: record.form4.projectName || `${f1.customer} - ${f1.partName}`,
    },
    form5: {
      ...record.form5,
      productCode: f1.partNo,
      productDescription: f1.partName,
      customerName: f1.customer,
      customerPartNo: f1.partNo,
      changeCategoryType:
        f1.changeType === 'Product'
          ? 'Prod. Change'
          : record.form5.changeCategoryType || 'Proc. Change',
    },
    form6: {
      ...record.form6,
      from: f1.requisitionBy || record.form6.from,
      department: f1.department || record.form6.department,
      customer: f1.customer,
      partNameNumber: partDisplay,
      reason: f1.reasonForChange || record.form6.reason,
    },
    form7: {
      ...record.form7,
      from: f1.requisitionBy || record.form7.from,
      department: f1.department || record.form7.department,
      customer: f1.customer,
      partNameNumber: partDisplay,
      reason: f1.reasonForChange || record.form7.reason,
    },
  };
}

export function computeOverallRisk(riskRows: RiskPointRow[]): {
  highCount: number;
  mediumCount: number;
  lowCount: number;
  naCount: number;
  applicableCount: number;
  evaluatedCount: number;
  overallRiskLevel: 'H' | 'M' | 'L';
} {
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let naCount = 0;
  let applicableCount = 0;
  let evaluatedCount = 0;

  for (const row of riskRows) {
    if (row.applicability === 'AP') {
      applicableCount += 1;
    }
    if (row.riskLevel === 'HIGH') {
      highCount += 1;
      evaluatedCount += 1;
    } else if (row.riskLevel === 'MEDIUM') {
      mediumCount += 1;
      evaluatedCount += 1;
    } else if (row.riskLevel === 'LOW') {
      lowCount += 1;
      evaluatedCount += 1;
    } else {
      naCount += 1;
    }
  }

  const overallRiskLevel: 'H' | 'M' | 'L' =
    highCount > 0 ? 'H' : mediumCount > 0 ? 'M' : 'L';

  return {
    highCount,
    mediumCount,
    lowCount,
    naCount,
    applicableCount,
    evaluatedCount,
    overallRiskLevel,
  };
}

export function computeChecklistProgress(items: ChangeChecklistItem[]): {
  total: number;
  affectedYes: number;
  affectedNo: number;
  pending: number;
  completedActions: number;
  percentComplete: number;
  shouldTerminateChecklist: boolean;
} {
  const total = items.length;
  const affectedYes = items.filter((i) => i.isAffected === 'Yes').length;
  const affectedNo = items.filter((i) => i.isAffected === 'No').length;
  const pending = items.filter((i) => i.isAffected === 'Pending').length;

  const completedActions = items.filter(
    (i) => i.isAffected === 'No' || (i.isAffected === 'Yes' && i.actualDate.trim() !== ''),
  ).length;

  const percentComplete = total === 0 ? 0 : Math.round((completedActions / total) * 100);
  // Per handwritten pen note: Yes -> Next, No -> Terminate
  const shouldTerminateChecklist = total > 0 && pending === 0 && affectedYes === 0;

  return {
    total,
    affectedYes,
    affectedNo,
    pending,
    completedActions,
    percentComplete,
    shouldTerminateChecklist,
  };
}

export function canAdvancePTRStage(ptr: Form6PTR, targetStage: 'ptr1' | 'ptr2' | 'ptr3'): {
  allowed: boolean;
  reason?: string;
} {
  if (targetStage === 'ptr1') {
    return { allowed: true };
  }
  if (targetStage === 'ptr2') {
    if (ptr.ptr1.required === 'No' || ptr.ptr1.sampleStatus === 'OK') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'PTR 1 must have Sample Status = OK (or Required = No) before unlocking PTR 2.',
    };
  }
  if (targetStage === 'ptr3') {
    const ptr1Ok = ptr.ptr1.required === 'No' || ptr.ptr1.sampleStatus === 'OK';
    const ptr2Ok = ptr.ptr2.required === 'No' || ptr.ptr2.sampleStatus === 'OK';
    if (ptr1Ok && ptr2Ok) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'PTR 1 and PTR 2 must be OK (or marked Not Required) before unlocking PTR 3.',
    };
  }
  return { allowed: false };
}

export function canUserApproveStage(role: UserRole, stageKey: WorkflowStageKey): boolean {
  if (role === 'ADMIN') return true;
  switch (stageKey) {
    case 'PCRF':
      return role === 'HOD' || role === 'HOF' || role === 'COF';
    case 'FEASIBILITY':
      return role === 'CFT' || role === 'CFT_LEADER' || role === 'COF';
    case 'RISK_ANALYSIS':
      return role === 'CFT' || role === 'CFT_LEADER';
    case 'TIMING_PLAN':
      return role === 'CFT_LEADER' || role === 'PLANT_HEAD';
    case 'INTERNAL_APPROVAL':
      return role === 'PLANT_HEAD' || role === 'HOF' || role === 'COF';
    case 'CHANGE_CHECKLIST':
      return role === 'CFT' || role === 'CFT_LEADER' || role === 'HOD';
    case 'PTR':
      return role === 'CFT' || role === 'CFT_LEADER' || role === 'HOD';
    case 'PPAP':
      return role === 'CFT_LEADER' || role === 'PLANT_HEAD' || role === 'HOF';
    case 'CLOSURE':
      return role === 'PLANT_HEAD' || role === 'CFT_LEADER';
    default:
      return false;
  }
}

export function applyWorkflowDecision(
  record: ChangeRequestRecord,
  decision: 'APPROVE' | 'REJECT' | 'RETURN',
  actorName: string,
  actorRole: UserRole,
  comments: string,
): ChangeRequestRecord {
  const now = new Date().toISOString().slice(0, 10);
  const currentIdx = WORKFLOW_STAGE_ORDER.findIndex((s) => s.key === record.currentStage);
  if (currentIdx === -1) return record;

  const updatedWorkflow = record.workflow.map((st, idx) => {
    if (idx !== currentIdx) return st;
    if (decision === 'APPROVE') {
      return { ...st, status: 'COMPLETED' as const, updatedAt: now, updatedBy: actorName, comments };
    }
    if (decision === 'REJECT') {
      return { ...st, status: 'REJECTED' as const, updatedAt: now, updatedBy: actorName, comments };
    }
    return { ...st, status: 'RETURNED' as const, updatedAt: now, updatedBy: actorName, comments };
  });

  let nextStage = record.currentStage;
  let nextOverallStatus = record.overallStatus;

  if (decision === 'APPROVE') {
    if (currentIdx + 1 < WORKFLOW_STAGE_ORDER.length) {
      nextStage = WORKFLOW_STAGE_ORDER[currentIdx + 1].key;
      updatedWorkflow[currentIdx + 1] = {
        ...updatedWorkflow[currentIdx + 1],
        status: 'IN_PROGRESS',
      };
      nextOverallStatus = currentIdx >= 4 ? 'In Implementation' : 'In Review';
    } else {
      nextOverallStatus = 'Closed';
    }
  } else if (decision === 'REJECT') {
    nextOverallStatus = 'Rejected';
  } else {
    nextOverallStatus = 'Returned';
  }

  return {
    ...record,
    currentStage: nextStage,
    overallStatus: nextOverallStatus,
    updatedAt: now,
    workflow: updatedWorkflow,
    activityHistory: [
      {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorName,
        actorRole,
        action:
          decision === 'APPROVE'
            ? `Approved ${WORKFLOW_STAGE_ORDER[currentIdx].label}`
            : decision === 'REJECT'
            ? `Rejected ${WORKFLOW_STAGE_ORDER[currentIdx].label}`
            : `Returned ${WORKFLOW_STAGE_ORDER[currentIdx].label} for correction`,
        stage: WORKFLOW_STAGE_ORDER[currentIdx].label,
        comments,
      },
      ...record.activityHistory,
    ],
  };
}
