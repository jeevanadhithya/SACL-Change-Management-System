export type UserRole =
  | 'ADMIN'
  | 'HOF'
  | 'COF'
  | 'HOD'
  | 'EMPLOYEE'
  | 'CFT'
  | 'CFT_LEADER'
  | 'PLANT_HEAD';

export interface UserAccount {
  id: string;
  employeeId: string;
  username?: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  title: string;
  facility: 'Foundry' | 'Machine Shop' | 'Corporate' | 'Quality';
  companyId?: string | null;
  companyCode?: string | null;
  companyName?: string | null;
  active: boolean;
  password?: string;
}

export interface CompanyRecord {
  id: string;
  code: string;
  name: string;
  unitName: string;
  facilityType: 'Machine Shop' | 'Foundry' | 'Foundry & Machine Shop' | 'Corporate';
  location: string;
  gstOrRegNo: string;
  contactEmail: string;
  active: boolean;
}

export interface DepartmentRecord {
  id: string;
  code: string;
  name: string;
  facility: 'Foundry' | 'Machine Shop' | 'Quality' | 'Corporate';
  hodName: string;
  memberCount: number;
}

export interface CustomerRecord {
  id: string;
  code: string;
  name: string;
  location: string;
  contactPerson: string;
}

export interface PartMasterRecord {
  id: string;
  partNumber: string;
  partName: string;
  customer: string;
  facility: 'Foundry' | 'Machine Shop' | 'Foundry & Machine Shop';
  currentRevision: string;
}

export type WorkflowStageKey =
  | 'PCRF'
  | 'FEASIBILITY'
  | 'RISK_ANALYSIS'
  | 'TIMING_PLAN'
  | 'INTERNAL_APPROVAL'
  | 'CHANGE_CHECKLIST'
  | 'PTR'
  | 'PPAP'
  | 'CLOSURE';

export type StageStatus =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'PENDING'
  | 'REJECTED'
  | 'RETURNED';

export interface WorkflowStageState {
  key: WorkflowStageKey;
  label: string;
  formCode?: string;
  status: StageStatus;
  updatedAt?: string;
  updatedBy?: string;
  comments?: string;
}

export type FacilityScope = 'Foundry' | 'Machine Shop' | 'Foundry & Machine Shop';
export type ChangeCategoryType = 'Product' | 'Process';
export type Classification4M = 'Man' | 'Machine' | 'Material' | 'Method';

export interface PCRFParticularRow {
  id: string;
  particulars: string;
  customParticular?: string;
  currentStatus: string;
  changeRequired: string;
  targetFacility: 'F' | 'M' | 'F&M';
}

export interface Form1PCRF {
  pcrfNo: string;
  requisitionBy: string;
  requisitionerSign: string;
  department: string;
  requisitionerHodSign: string;
  date: string;
  customer: string;
  partName: string;
  partNo: string;
  classifications: Classification4M[];
  changeType: ChangeCategoryType;
  facilityScope: FacilityScope;
  particularsRows: PCRFParticularRow[];
  reasonForChange: string;
  reasonFacilityApplicable: 'Foundry' | 'Machine Shop' | 'Both' | 'Other';
  cftCommentsFoundry: string;
  cftFoundryFeasibility: 'Feasible' | 'Not Feasible' | 'Pending';
  cftLeaderFoundrySign: string;
  cftLeaderFoundryDate: string;
  cftCommentsMachineShop: string;
  cftMachineShopFeasibility: 'Feasible' | 'Not Feasible' | 'Pending';
  cftLeaderMachineShopSign: string;
  cftLeaderMachineShopDate: string;
  internalApprovalStatus: 'Approved' | 'Rejected' | 'Others' | 'Pending';
  internalApprovalOtherText: string;
  approvingAuthority: string;
  approvingAuthoritySign: string;
  plantHeadApproval: 'Approved' | 'Rejected' | 'Pending';
  plantHeadSign: string;
  customerCommunicationDetail: string;
  changeReflectionInSOP: boolean;
  sopDocumentRef: string;
  forwardedTo: string;
}

export interface FeasibilityRequirementItem {
  id: string;
  section:
    | 'Manufacturing Process / Product Requirement'
    | 'System Requirement'
    | 'Inspection Requirement'
    | 'Any Other Requirement';
  description: string;
  decision: 'Feasible' | 'Not Feasible' | 'Pending';
}

export interface CFTMemberSignature {
  slot: number;
  name: string;
  department: string;
  signed: boolean;
  date: string;
}

export interface Form2Feasibility {
  slNo: string;
  date: string;
  from: string;
  to: string;
  partName: string;
  partNo: string;
  customer: string;
  categoryOfChange: string;
  requirements: FeasibilityRequirementItem[];
  additionalResourceRequirement: string;
  conclusion: 'FEASIBLE' | 'NOT FEASIBLE' | 'PENDING';
  cftSignatures: CFTMemberSignature[];
  comments: string;
  forwardedTo: string;
  acknowledgementStatus: 'Pending' | 'Acknowledged';
  acknowledgementDate: string;
}

export type RiskCategoryName =
  | 'Man'
  | 'Method'
  | 'Machine'
  | 'Material'
  | 'Cost'
  | 'Quality'
  | 'Delivery';

export interface RiskPointRow {
  id: string;
  category: RiskCategoryName;
  riskPoint: string;
  applicability: 'AP' | 'NAP';
  controlMethod: string;
  riskLevel: 'HIGH' | 'LOW' | 'MEDIUM' | 'NA';
  effectOnQCD: string;
  actions: string;
}

export interface Form3RiskAnalysis {
  partName: string;
  partNo: string;
  customer: string;
  date: string;
  riskRows: RiskPointRow[];
  conclusion: 'Acceptable' | 'Not Acceptable' | 'Pending';
  overallRiskLevel: 'H' | 'L' | 'M';
  cftSignatures: CFTMemberSignature[];
}

export interface TimingPlanActivityRow {
  id: string;
  apqpPhase: string;
  activity: string;
  applicability: string;
  isCritical: boolean;
  plannedWeeks: boolean[]; // 24 weeks (6 months x 4 weeks)
  actualWeeks: boolean[]; // 24 weeks
  remarks: string;
}

export interface Form4TimingPlan {
  projectName: string;
  drawingPartNo: string;
  productName: string;
  customer: string;
  preparedDate: string;
  lastRevDate: string;
  revision: string;
  productTypeFlags: Array<'AA' | 'A' | 'B' | 'C'>;
  monthLabels: string[]; // 6 month headers
  customerTimelineWeeks: boolean[]; // 24 weeks
  customerTimelineRemarks: string;
  internalTimelineWeeks: boolean[]; // 24 weeks
  internalTimelineRemarks: string;
  tier2TimelineWeeks: boolean[]; // 24 weeks
  tier2TimelineRemarks: string;
  activities: TimingPlanActivityRow[];
  reviewMode: Array<'Initial Plan' | 'Actual Status' | 'Plan for Remaining'>;
  cftMembers: string[]; // 6 members
  remarks: string;
  goForNextPhase: 'Yes' | 'No' | 'Pending';
  cftLeaderSign: string;
  plantHeadSign: string;
}

export interface ChangeChecklistItem {
  id: string;
  page: 1 | 2 | 3 | 4;
  impactArea: string;
  isAffected: 'Yes' | 'No' | 'Pending';
  actionComments: string;
  responsibility: string;
  reqdDate: string;
  actualDate: string;
  docNo: string;
  curRev: string;
  remarks: string;
}

export interface Form5ChangeChecklist {
  productCode: string;
  productDescription: string;
  customerName: string;
  customerPartNo: string;
  changeCategoryType: 'Prod. Change' | 'Desg. Change' | 'Proc. Change';
  items: ChangeChecklistItem[];
  actualImplementationDate: string;
  actionsOnStockProduced: string;
  actionsOnToolings: string;
  otherRemarks: string;
  informedTo: {
    customer: boolean;
    marketing: boolean;
    planning: boolean;
    production: boolean;
    qa: boolean;
    qc: boolean;
  };
  cftCoreTeamNote: string;
  preparedOnDate: string;
  signOffs: Array<{
    sign: string;
    name: string;
    title: string;
  }>;
}

export interface PTRStageDetail {
  required: 'Yes' | 'No';
  productionRunDate: string;
  quantityProduced: string;
  meetsDrawingReq: 'Yes' | 'No' | 'Pending';
  sampleSubmissionReq: 'Yes' | 'No';
  sampleSubmittedDate: string;
  sampleStatus: 'OK' | 'Not OK' | 'Pending';
  actionPlanComments: string;
}

export interface PTRCoreTeamApproval {
  department: 'Production' | 'Quality' | 'Tooling & Fixtures' | 'Marketing' | 'Maintenance';
  ptr1Status: 'OK' | 'Not OK' | 'Pending';
  ptr1Comment: string;
  ptr1Sign: string;
  ptr2Status: 'OK' | 'Not OK' | 'Pending';
  ptr2Comment: string;
  ptr2Sign: string;
  ptr3Status: 'OK' | 'Not OK' | 'Pending';
  ptr3Comment: string;
  ptr3Sign: string;
}

export interface Form6PTR {
  date: string;
  from: string;
  department: string;
  to: string;
  customer: string;
  partNameNumber: string;
  revNumber: string;
  reason: string;
  requestDate: string;
  requestSignature: string;
  ptr1: PTRStageDetail;
  ptr2: PTRStageDetail;
  ptr3: PTRStageDetail;
  coreTeamApprovals: PTRCoreTeamApproval[];
  cftComments: string;
  breakPointDate: string;
  invoiceDetails: string;
  identificationOnPartBoxTrolley: string;
}

export interface Form7PPAP {
  date: string;
  from: string;
  department: string;
  to: string;
  customer: string;
  partNameNumber: string;
  revNumber: string;
  reason: string;
  requestDate: string;
  requestSignature: string;
  firstProductionRunDate: string;
  quantityProduced: string;
  cycleTimeProductionRate: string;
  pfdNumber: string;
  pfdRevNo: string;
  pfdDate: string;
  controlPlanNumber: string;
  controlPlanRevNo: string;
  controlPlanDate: string;
  deviationsToProcessFlow: 'Yes' | 'No';
  processFlowDeviationNature: string;
  deviationsToControlPlan: 'Yes' | 'No';
  controlPlanDeviationNature: string;
  pswInternalApprovalDate: string;
  submissionRequired: 'Yes' | 'No';
  submissionStatus: 'Yes' | 'No' | 'Rejected' | 'Pending';
  productDispatchAuthBy: string;
  coreTeamSignOffs: Array<{
    sign: string;
    name: string;
    date: string;
  }>;
}

export interface ChangeRequestDocument {
  id: string;
  name: string;
  category:
    | 'Generated Form'
    | 'Customer Drawing'
    | 'Supporting Document'
    | 'Approval Document';
  formType?: string;
  uploadedBy: string;
  uploadedDate: string;
  revision: string;
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  stage: string;
  comments?: string;
}

export interface ChangeRequestRecord {
  id: string;
  pcrfNo: string;
  companyId?: string;
  companyName?: string;
  title: string;
  priority: 'Critical' | 'High' | 'Normal';
  createdBy: string;
  createdByEmployeeId: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  currentStage: WorkflowStageKey;
  overallStatus: 'Draft' | 'In Review' | 'Approved' | 'In Implementation' | 'Returned' | 'Rejected' | 'Closed';
  workflow: WorkflowStageState[];
  form1: Form1PCRF;
  form2: Form2Feasibility;
  form3: Form3RiskAnalysis;
  form4: Form4TimingPlan;
  form5: Form5ChangeChecklist;
  form6: Form6PTR;
  form7: Form7PPAP;
  documents: ChangeRequestDocument[];
  activityHistory: ActivityLogEntry[];
}

export interface NotificationItem {
  id: string;
  type:
    | 'New Change Request'
    | 'Approval Required'
    | 'Request Approved'
    | 'Request Rejected'
    | 'Returned for Correction'
    | 'New Task Assigned'
    | 'Timing Plan Milestone'
    | 'Overdue Checklist'
    | 'PTR Approval'
    | 'PPAP Submission'
    | 'Final Closure';
  title: string;
  message: string;
  pcrfId: string;
  pcrfNo: string;
  targetRoles: UserRole[];
  createdAt: string;
  read: boolean;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  entityType: string;
  entityId: string;
  action: string;
  details: string;
}

export type FormIdentifier =
  | 'form1'
  | 'form2'
  | 'form3'
  | 'form4'
  | 'form5'
  | 'form6'
  | 'form7';
