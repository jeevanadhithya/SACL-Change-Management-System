import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Layers,
  Plus,
} from 'lucide-react';
import type { ChangeRequestRecord, CompanyRecord, UserAccount, UserRole } from '../types/pcms';
import type { CreateCompanyPayload } from '../api/client';
import { canUserApproveStage, WORKFLOW_STAGE_ORDER } from '../utils/workflow';
import { RoleDisplayLabel, StatusText } from './ui/StatusBadge';
import type { NavSectionKey } from './AppShell';

interface RoleDashboardProps {
  user: UserAccount;
  pcrfs: ChangeRequestRecord[];
  companies?: CompanyRecord[];
  canCreatePCRF?: boolean;
  onCreateCompany?: (payload: CreateCompanyPayload) => Promise<void>;
  onViewCompany?: (companyId: string) => void;
  onOpenPCRF: (id: string) => void;
  onCreateNew: () => void;
  onNavigate: (nav: NavSectionKey) => void;
}

export function RoleDashboard({
  user,
  pcrfs,
  companies = [],
  canCreatePCRF = true,
  onCreateCompany,
  onViewCompany,
  onOpenPCRF,
  onCreateNew,
  onNavigate,
}: RoleDashboardProps) {
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [facilityType, setFacilityType] = useState<CompanyRecord['facilityType']>('Machine Shop');
  const [location, setLocation] = useState('');
  const [gstOrRegNo, setGstOrRegNo] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [createInitialAccount, setCreateInitialAccount] = useState(true);
  const [accUsername, setAccUsername] = useState('');
  const [accFullName, setAccFullName] = useState('');
  const [accPassword, setAccPassword] = useState('');
  const [accRole, setAccRole] = useState<UserRole>('COMPANY_USER');
  const [companySubmitting, setCompanySubmitting] = useState(false);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [companySuccess, setCompanySuccess] = useState<string | null>(null);

  const total = pcrfs.length;
  const openCount = pcrfs.filter((p) => p.overallStatus !== 'Closed' && p.overallStatus !== 'Rejected').length;
  const pendingApproval = pcrfs.filter((p) => canUserApproveStage(user.role, p.currentStage) && p.overallStatus !== 'Closed').length;
  const closedCount = pcrfs.filter((p) => p.overallStatus === 'Closed').length;
  const criticalCount = pcrfs.filter((p) => p.priority === 'Critical' && p.overallStatus !== 'Closed').length;
  const processCount = pcrfs.filter((p) => p.form1.changeType === 'Process').length;
  const productCount = pcrfs.filter((p) => p.form1.changeType === 'Product').length;

  const myRequests = pcrfs.filter(
    (p) => p.createdByEmployeeId === user.employeeId || p.createdBy === user.name,
  );
  const actionQueue = pcrfs.filter(
    (p) =>
      p.overallStatus !== 'Closed' &&
      p.overallStatus !== 'Rejected' &&
      (canUserApproveStage(user.role, p.currentStage) || user.role === 'ADMIN'),
  );

  // Department breakdown from real PCRFs
  const deptCounts: Record<string, number> = {};
  for (const p of pcrfs) {
    const d = p.form1.department || 'Other';
    deptCounts[d] = (deptCounts[d] || 0) + 1;
  }
  const deptEntries = Object.entries(deptCounts);

  // Stage distribution
  const stageCounts = WORKFLOW_STAGE_ORDER.map((st) => ({
    label: st.label,
    count: pcrfs.filter((p) => p.currentStage === st.key && p.overallStatus !== 'Closed').length,
  }));

  const roleHeadline: Record<string, { title: string; subtitle: string }> = {
    ADMIN: {
      title: 'Administrator Control Tower',
      subtitle: 'Plant-wide change request volume, company units management, and governance metrics.',
    },
    HOF: {
      title: 'Head of Foundry (HOF) Workspace',
      subtitle: 'Foundry change approvals, sand/alloy process trials, and pending reviews.',
    },
    COF: {
      title: 'Chief of Facility (COF) Operations',
      subtitle: 'Cross-facility feasibility coordination, machine shop capacity, and CFT oversight.',
    },
    HOD: {
      title: 'Head of Department (HOD) Dashboard',
      subtitle: 'Departmental requisitions awaiting initial HOD sign-off and team task tracking.',
    },
    EMPLOYEE: {
      title: 'My Change Requests',
      subtitle: 'Raise new Process Change Requisitions and track real-time approval progress.',
    },
    COMPANY_USER: {
      title: user.companyName ? `${user.companyName} — Portal` : 'Company Representative Portal',
      subtitle: 'Raise and monitor Process Change Requisitions for your assigned company and manufactured parts.',
    },
    CFT: {
      title: 'CFT Engineering Workspace',
      subtitle: 'Feasibility evaluations, risk analysis matrices, checklists, PTR & PPAP execution.',
    },
    CFT_LEADER: {
      title: 'CFT Leader — APQP & Change Control',
      subtitle: 'Timing plan milestones, team sign-offs, and Plant Head readiness gates.',
    },
    PLANT_HEAD: {
      title: 'Plant Head Executive Dashboard',
      subtitle: 'Executive approvals, critical & high-risk changes, and plant performance summary.',
    },
  };

  const isRequisitionerOnly = user.role === 'EMPLOYEE' || user.role === 'COMPANY_USER';
  const head = roleHeadline[user.role] || roleHeadline.EMPLOYEE;

  async function handleAdminAddCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!onCreateCompany) return;
    if (!code.trim() || !name.trim() || !location.trim()) {
      setCompanyError('Company Code, Company Name, and Plant Location are required.');
      return;
    }
    if (createInitialAccount) {
      if (!accUsername.trim() || !accFullName.trim() || accPassword.trim().length < 4) {
        setCompanyError(
          'Individual company account requires Username, Full Name, and Password (min 4 characters).',
        );
        return;
      }
    }
    setCompanyError(null);
    setCompanySuccess(null);
    setCompanySubmitting(true);
    try {
      await onCreateCompany({
        code,
        name,
        unitName: unitName || 'Machine Shop Unit',
        facilityType,
        location,
        gstOrRegNo,
        contactEmail,
        ...(createInitialAccount
          ? {
              initialAccount: {
                username: accUsername.trim(),
                name: accFullName.trim(),
                password: accPassword,
                role: accRole,
                email: contactEmail.trim() || undefined,
              },
            }
          : {}),
      });
      setCompanySuccess(
        createInitialAccount
          ? `Added ${name.trim()} (${code.trim().toUpperCase()}) with login account "${accUsername.trim()}" (${accRole})`
          : `Added ${name.trim()} (${code.trim().toUpperCase()})`,
      );
      setCode('');
      setName('');
      setUnitName('');
      setLocation('');
      setGstOrRegNo('');
      setContactEmail('');
      setAccUsername('');
      setAccFullName('');
      setAccPassword('');
      setShowAddCompany(false);
    } catch (err) {
      setCompanyError(err instanceof Error ? err.message : 'Unable to add company');
    } finally {
      setCompanySubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Role Header + Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#D97700]">
            {RoleDisplayLabel(user.role)} · {user.department}
          </p>
          <h2 className="text-2xl leading-8 font-extrabold text-[#111318] tracking-tight">
            {head.title}
          </h2>
          <p className="text-sm text-[#5C6470]">{head.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          {!isRequisitionerOnly && (
            <button
              type="button"
              onClick={() => onNavigate('approvals')}
              className="btn-secondary"
            >
              Approval Center ({pendingApproval})
            </button>
          )}
          {canCreatePCRF && (
            <button
              type="button"
              onClick={onCreateNew}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Change Request</span>
            </button>
          )}
        </div>
      </div>

      {/* Role-Tailored KPI Strip (8pt Grid: gap-4, p-6 cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card p-6">
          <div className="flex items-center justify-between text-xs font-medium text-[#5C6470]">
            <span>
              {user.role === 'COMPANY_USER'
                ? 'Company Requests'
                : user.role === 'EMPLOYEE'
                ? 'My Total Requests'
                : 'Total Change Requests'}
            </span>
            <FileText className="w-4 h-4 text-[#111318] shrink-0" />
          </div>
          <p className="text-[32px] leading-10 font-extrabold text-[#111318] mt-4 tabular-nums tracking-tight">
            {user.role === 'EMPLOYEE' ? myRequests.length : total}
          </p>
          <p className="text-xs text-[#5C6470] mt-2 tabular-nums">
            {openCount} open across plant
          </p>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center justify-between text-xs font-medium text-[#5C6470]">
            <span>{isRequisitionerOnly ? 'In Review / Trial' : 'Pending My Action'}</span>
            <Clock className="w-4 h-4 text-[#F28C00] shrink-0" />
          </div>
          <p className="text-[32px] leading-10 font-extrabold text-[#D97700] mt-4 tabular-nums tracking-tight">
            {user.role === 'COMPANY_USER'
              ? pcrfs.filter((r) => r.overallStatus !== 'Closed').length
              : user.role === 'EMPLOYEE'
              ? myRequests.filter((r) => r.overallStatus !== 'Closed').length
              : pendingApproval}
          </p>
          <p className="text-xs text-[#5C6470] mt-2">
            Role-authorized queue
          </p>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center justify-between text-xs font-medium text-[#5C6470]">
            <span>Critical / High Risk</span>
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          </div>
          <p className="text-[32px] leading-10 font-extrabold text-[#111318] mt-4 tabular-nums tracking-tight">
            {criticalCount}
          </p>
          <p className="text-xs text-[#5C6470] mt-2 tabular-nums">
            {processCount} Process · {productCount} Product
          </p>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center justify-between text-xs font-medium text-[#5C6470]">
            <span>Completed &amp; Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>
          <p className="text-[32px] leading-10 font-extrabold text-emerald-700 mt-4 tabular-nums tracking-tight">
            {closedCount}
          </p>
          <p className="text-xs text-[#5C6470] mt-2">PPAP &amp; PSW dispatched</p>
        </div>
      </div>

      {/* Flattened 3-Step Guided Quick-Action Workflow Strip (Single Elevation) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {canCreatePCRF ? (
          <button
            type="button"
            onClick={onCreateNew}
            className="surface-card p-6 text-left hover:border-[#F28C00] hover:bg-[#FFF6EB]/40 transition-colors cursor-pointer group"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#D97700]">
              Step 1 · Initiate
            </p>
            <p className="text-sm font-bold text-[#111318] mt-2 group-hover:text-[#D97700] transition-colors">
              Raise New Change Request →
            </p>
            <p className="text-xs text-[#5C6470] mt-1 leading-5">
              Select plant unit, 4M classification &amp; part details (QF/07/MRO-15).
            </p>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('pcrfs')}
            className="surface-card p-6 text-left hover:border-[#F28C00] hover:bg-[#FFF6EB]/40 transition-colors cursor-pointer group"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#D97700]">
              Step 1 · Track
            </p>
            <p className="text-sm font-bold text-[#111318] mt-2 group-hover:text-[#D97700] transition-colors">
              Browse All Change Requests →
            </p>
            <p className="text-xs text-[#5C6470] mt-1 leading-5">
              Inspect active plant PCRFs, 4M changes, and department submissions.
            </p>
          </button>
        )}

        <button
          type="button"
          onClick={() => onNavigate('forms-hub')}
          className="surface-card p-6 text-left hover:border-[#F28C00] hover:bg-[#FFF6EB]/40 transition-colors cursor-pointer group"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#D97700]">
            Step 2 · Fill &amp; Sync
          </p>
          <p className="text-sm font-bold text-[#111318] mt-2 group-hover:text-[#D97700] transition-colors">
            Open 7 Interconnected Forms →
          </p>
          <p className="text-xs text-[#5C6470] mt-1 leading-5">
            Feasibility, Risk Analysis, Timing Plan, Checklist, PTR &amp; PPAP.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate(isRequisitionerOnly ? 'pcrfs' : 'approvals')}
          className="surface-card p-6 text-left hover:border-[#F28C00] hover:bg-[#FFF6EB]/40 transition-colors cursor-pointer group"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#D97700]">
            Step 3 · Review &amp; Print
          </p>
          <p className="text-sm font-bold text-[#111318] mt-2 group-hover:text-[#D97700] transition-colors">
            {isRequisitionerOnly ? 'Track Status & Print PDFs →' : 'Review Approvals & Print →'}
          </p>
          <p className="text-xs text-[#5C6470] mt-1 leading-5">
            Sign off pending stage gates and export exact consultancy PDFs.
          </p>
        </button>
      </div>

      {/* Admin-Only Company Management Section directly in Admin Dashboard */}
      {user.role === 'ADMIN' && (
        <section className="surface-card overflow-hidden">
          <div className="surface-header flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#FFF6EB] text-[#D97700] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#111318]">
                  Companies &amp; Manufacturing Units (Admin Control)
                </h3>
                <p className="text-xs text-[#5C6470] mt-1">
                  Only System Administrators can register new group companies and plant units.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('companies')}
                className="btn-compact border border-[#D5DAE1] bg-white hover:border-[#121417] text-[#111318]"
              >
                Full Companies Console
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCompany((v) => !v);
                  setCompanyError(null);
                  setCompanySuccess(null);
                }}
                className="btn-compact bg-[#121417] hover:bg-[#F28C00] text-white"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddCompany ? 'Close Form' : 'Add Company'}</span>
              </button>
            </div>
          </div>

          {companySuccess && (
            <div
              role="status"
              className="mx-6 mt-4 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold"
            >
              {companySuccess}
            </div>
          )}

          {showAddCompany && (
            <form
              onSubmit={handleAdminAddCompany}
              className="p-6 bg-[#F8F9FB] border-b border-[#E4E7EC] space-y-6"
            >
              {companyError && (
                <div
                  role="alert"
                  className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
                >
                  {companyError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="dash-comp-code" className="field-label">
                    Company Code *
                  </label>
                  <input
                    id="dash-comp-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="SACL-MS2"
                    className="field-input font-mono"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label htmlFor="dash-comp-name" className="field-label">
                    Company Name *
                  </label>
                  <input
                    id="dash-comp-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sakthi Auto Precision Components Ltd."
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="dash-comp-facility" className="field-label">
                    Facility Scope
                  </label>
                  <select
                    id="dash-comp-facility"
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value as CompanyRecord['facilityType'])}
                    className="field-input"
                  >
                    <option value="Machine Shop">Machine Shop</option>
                    <option value="Foundry">Foundry</option>
                    <option value="Foundry & Machine Shop">Foundry &amp; Machine Shop</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="dash-comp-unit" className="field-label">
                    Unit / Division Name
                  </label>
                  <input
                    id="dash-comp-unit"
                    type="text"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    placeholder="CNC Machine Shop Unit II"
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="dash-comp-location" className="field-label">
                    Plant Location *
                  </label>
                  <input
                    id="dash-comp-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Pollachi / Coimbatore, TN"
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="dash-comp-gst" className="field-label">
                    GST / Reg No.
                  </label>
                  <input
                    id="dash-comp-gst"
                    type="text"
                    value={gstOrRegNo}
                    onChange={(e) => setGstOrRegNo(e.target.value)}
                    placeholder="33AAACS8812N1Z4"
                    className="field-input font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="dash-comp-email" className="field-label">
                    Contact Email
                  </label>
                  <input
                    id="dash-comp-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="plant@sakthiauto.com"
                    className="field-input"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-[#E4E7EC] space-y-4">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-[#111318] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createInitialAccount}
                    onChange={(e) => setCreateInitialAccount(e.target.checked)}
                    className="w-4 h-4 rounded border-[#D5DAE1] accent-[#F28C00]"
                  />
                  <span>Create Individual Login Account (Username &amp; Password) for this Company</span>
                </label>

                {createInitialAccount && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label htmlFor="dash-acc-user" className="field-label">
                        Username *
                      </label>
                      <input
                        id="dash-acc-user"
                        type="text"
                        value={accUsername}
                        onChange={(e) => setAccUsername(e.target.value)}
                        placeholder="unit2_hod"
                        className="field-input font-mono"
                      />
                    </div>
                    <div>
                      <label htmlFor="dash-acc-name" className="field-label">
                        Account Holder Name *
                      </label>
                      <input
                        id="dash-acc-name"
                        type="text"
                        value={accFullName}
                        onChange={(e) => setAccFullName(e.target.value)}
                        placeholder="M. Kannan"
                        className="field-input"
                      />
                    </div>
                    <div>
                      <label htmlFor="dash-acc-pass" className="field-label">
                        Password (min 4 chars) *
                      </label>
                      <input
                        id="dash-acc-pass"
                        type="password"
                        value={accPassword}
                        onChange={(e) => setAccPassword(e.target.value)}
                        placeholder="Enter password"
                        className="field-input"
                      />
                    </div>
                    <div>
                      <label htmlFor="dash-acc-role" className="field-label">
                        JWT Access Role
                      </label>
                      <select
                        id="dash-acc-role"
                        value={accRole}
                        onChange={(e) => setAccRole(e.target.value as UserRole)}
                        className="field-input"
                      >
                        <option value="COMPANY_USER">Company Representative</option>
                        <option value="EMPLOYEE">Employee / Requisitioner</option>
                        <option value="HOD">Head of Department (HOD)</option>
                        <option value="HOF">Head of Foundry (HOF)</option>
                        <option value="COF">Chief of Facility (COF)</option>
                        <option value="CFT">CFT Member</option>
                        <option value="CFT_LEADER">CFT Leader</option>
                        <option value="PLANT_HEAD">Plant Head</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={companySubmitting}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span>{companySubmitting ? 'Saving...' : 'Save Company Unit'}</span>
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#5C6470] uppercase tracking-wider">
                  <th className="h-10 px-6">Code</th>
                  <th className="h-10 px-4">Company &amp; Unit</th>
                  <th className="h-10 px-4">Facility Scope</th>
                  <th className="h-10 px-4">Location</th>
                  <th className="h-10 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC]">
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 px-6 text-center text-xs text-[#5C6470]">
                      No companies registered in the database yet. Click &ldquo;Add Company&rdquo; above to add your first plant unit.
                    </td>
                  </tr>
                ) : (
                  companies.map((c) => (
                    <tr
                      key={c.id}
                      onDoubleClick={() => onViewCompany?.(c.id)}
                      className="hover:bg-[#FFF6EB]/50 transition-colors cursor-pointer"
                      title="Double-click to view company details, users & manufactured parts"
                    >
                      <td className="py-4 px-6 font-mono text-xs font-bold text-[#D97700] whitespace-nowrap">
                        {c.code}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-[#111318]">{c.name}</p>
                        <p className="text-xs text-[#5C6470] mt-1">{c.unitName}</p>
                      </td>
                      <td className="py-4 px-4 text-xs text-[#111318]">{c.facilityType}</td>
                      <td className="py-4 px-4 text-xs text-[#5C6470]">{c.location}</td>
                      <td className="py-4 px-6 text-xs font-semibold text-emerald-700">
                        {c.active ? 'Active' : 'Inactive'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Visualizations Row (Real Derived Data, 8pt Spacing) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Stage Distribution */}
        <div className="lg:col-span-2 surface-card p-6 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-[#111318]">Active Requests by Workflow Stage</h3>
            <button
              type="button"
              onClick={() => onNavigate('pcrfs')}
              className="text-xs font-semibold text-[#D97700] hover:underline cursor-pointer"
            >
              View All Change Requests →
            </button>
          </div>
          <div className="space-y-4">
            {stageCounts.slice(0, 8).map((item) => {
              const pct = total === 0 ? 0 : Math.round((item.count / total) * 100);
              return (
                <div key={item.label} className="grid grid-cols-12 items-center gap-4 text-xs">
                  <span className="col-span-5 font-medium text-[#111318] truncate">
                    {item.label}
                  </span>
                  <div className="col-span-5 h-2 bg-[#F4F5F7] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F28C00] rounded-full"
                      style={{ width: `${Math.max(pct, item.count > 0 ? 12 : 0)}%` }}
                    />
                  </div>
                  <span className="col-span-2 text-right font-mono font-bold text-[#111318] tabular-nums">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department & Change Split */}
        <div className="surface-card p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#111318]">Requests by Department</h3>
            <div className="space-y-4">
              {deptEntries.length === 0 ? (
                <p className="text-xs text-[#5C6470] py-8 text-center">
                  No department change requests recorded yet.
                </p>
              ) : (
                deptEntries.map(([dept, cnt]) => {
                  const pct = total === 0 ? 0 : Math.round((cnt / total) * 100);
                  return (
                    <div key={dept} className="space-y-2 text-xs">
                      <div className="flex justify-between font-semibold">
                        <span className="text-[#111318]">{dept}</span>
                        <span className="font-mono tabular-nums text-[#5C6470]">
                          {cnt} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-[#F4F5F7] rounded-full overflow-hidden">
                        <div className="h-full bg-[#121417] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E4E7EC] flex items-center justify-between text-xs">
            <span className="text-[#5C6470] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#F28C00]" /> Product vs Process
            </span>
            <span className="font-mono font-bold text-[#111318] tabular-nums">
              {productCount} Prod / {processCount} Proc
            </span>
          </div>
        </div>
      </div>

      {/* Role Action Queue Table */}
      <section className="surface-card overflow-hidden">
        <div className="surface-header flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#F28C00]" />
            <h3 className="text-sm font-bold text-[#111318]">
              {user.role === 'COMPANY_USER'
                ? 'Company Change Requests'
                : user.role === 'EMPLOYEE'
                ? 'My Submitted Change Requests'
                : 'Priority Action & Approval Queue'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('pcrfs')}
            className="text-xs font-semibold text-[#D97700] hover:underline cursor-pointer"
          >
            View All PCRFs
          </button>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#5C6470] uppercase tracking-wider">
                <th className="h-10 px-6">PCRF No.</th>
                <th className="h-10 px-4">Part &amp; Customer</th>
                <th className="h-10 px-4">Current Stage</th>
                <th className="h-10 px-4">Priority</th>
                <th className="h-10 px-4">Status</th>
                <th className="h-10 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {(user.role === 'COMPANY_USER'
                ? pcrfs
                : user.role === 'EMPLOYEE'
                ? myRequests
                : actionQueue
              ).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center text-xs text-[#5C6470]">
                    No active Change Requests in this queue yet.
                  </td>
                </tr>
              ) : (
                (user.role === 'COMPANY_USER'
                  ? pcrfs
                  : user.role === 'EMPLOYEE'
                  ? myRequests
                  : actionQueue
                ).map((p) => {
                  const stObj = WORKFLOW_STAGE_ORDER.find((s) => s.key === p.currentStage);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onOpenPCRF(p.id)}
                      className="hover:bg-[#FFF6EB]/50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-mono text-xs font-bold text-[#111318] whitespace-nowrap">
                        {p.pcrfNo}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-[#111318]">{p.form1.partName}</p>
                        <p className="text-xs text-[#5C6470] mt-1">{p.form1.customer}</p>
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-[#111318]">
                        {stObj?.label || p.currentStage}
                      </td>
                      <td className="py-4 px-4">
                        <StatusText status={p.priority} />
                      </td>
                      <td className="py-4 px-4">
                        <StatusText status={p.overallStatus} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPCRF(p.id);
                          }}
                          className="btn-compact bg-[#121417] hover:bg-[#F28C00] text-white"
                        >
                          <span>Review</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
