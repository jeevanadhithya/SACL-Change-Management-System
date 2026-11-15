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
import type { ChangeRequestRecord, CompanyRecord, UserAccount } from '../types/pcms';
import { canUserApproveStage, WORKFLOW_STAGE_ORDER } from '../utils/workflow';
import { RoleDisplayLabel, StatusText } from './ui/StatusBadge';
import type { NavSectionKey } from './AppShell';

interface RoleDashboardProps {
  user: UserAccount;
  pcrfs: ChangeRequestRecord[];
  companies?: CompanyRecord[];
  onCreateCompany?: (payload: Partial<CompanyRecord>) => Promise<void>;
  onOpenPCRF: (id: string) => void;
  onCreateNew: () => void;
  onNavigate: (nav: NavSectionKey) => void;
}

export function RoleDashboard({
  user,
  pcrfs,
  companies = [],
  onCreateCompany,
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

  const head = roleHeadline[user.role] || roleHeadline.EMPLOYEE;

  async function handleAdminAddCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!onCreateCompany) return;
    if (!code.trim() || !name.trim() || !location.trim()) {
      setCompanyError('Company Code, Company Name, and Plant Location are required.');
      return;
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
      });
      setCompanySuccess(`Added ${name.trim()} (${code.trim().toUpperCase()})`);
      setCode('');
      setName('');
      setUnitName('');
      setLocation('');
      setGstOrRegNo('');
      setContactEmail('');
      setShowAddCompany(false);
    } catch (err) {
      setCompanyError(err instanceof Error ? err.message : 'Unable to add company');
    } finally {
      setCompanySubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Role Header + Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#E87500]">
            {RoleDisplayLabel(user.role)} · {user.department}
          </p>
          <h2 className="text-2xl font-extrabold text-[#151515] mt-0.5">{head.title}</h2>
          <p className="text-sm text-[#666666]">{head.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {user.role !== 'EMPLOYEE' && (
            <button
              type="button"
              onClick={() => onNavigate('approvals')}
              className="px-4 py-2.5 rounded-lg border border-[#151515] text-xs font-bold text-[#151515] hover:bg-[#151515] hover:text-white transition-colors cursor-pointer"
            >
              Approval Center ({pendingApproval})
            </button>
          )}
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-xs font-bold whitespace-nowrap cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Change Request</span>
          </button>
        </div>
      </div>

      {/* Role-Tailored KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#666666]">
            <span>{user.role === 'EMPLOYEE' ? 'My Total Requests' : 'Total Change Requests'}</span>
            <FileText className="w-4 h-4 text-[#151515]" />
          </div>
          <p className="text-3xl font-extrabold text-[#151515] mt-2 tabular-nums">
            {user.role === 'EMPLOYEE' ? myRequests.length : total}
          </p>
          <p className="text-xs text-[#666666] mt-1 tabular-nums">
            {openCount} open across plant
          </p>
        </div>

        <div className="bg-white border border-[#E6E6E6] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#666666]">
            <span>{user.role === 'EMPLOYEE' ? 'In Review / Trial' : 'Pending My Action'}</span>
            <Clock className="w-4 h-4 text-[#F28C00]" />
          </div>
          <p className="text-3xl font-extrabold text-[#E87500] mt-2 tabular-nums">
            {user.role === 'EMPLOYEE'
              ? myRequests.filter((r) => r.overallStatus !== 'Closed').length
              : pendingApproval}
          </p>
          <p className="text-xs text-[#666666] mt-1">
            Role-authorized queue
          </p>
        </div>

        <div className="bg-white border border-[#E6E6E6] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#666666]">
            <span>Critical / High Risk</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-3xl font-extrabold text-[#151515] mt-2 tabular-nums">
            {criticalCount}
          </p>
          <p className="text-xs text-[#666666] mt-1 tabular-nums">
            {processCount} Process · {productCount} Product
          </p>
        </div>

        <div className="bg-white border border-[#E6E6E6] rounded-xl p-5">
          <div className="flex items-center justify-between text-xs text-[#666666]">
            <span>Completed &amp; Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-700 mt-2 tabular-nums">
            {closedCount}
          </p>
          <p className="text-xs text-[#666666] mt-1">PPAP &amp; PSW dispatched</p>
        </div>
      </div>

      {/* Guided Quick-Action Workflow Strip */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={onCreateNew}
          className="text-left p-3.5 rounded-lg border border-[#E6E6E6] hover:border-[#F28C00] hover:bg-[#FFF4E5]/25 transition-colors cursor-pointer group"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#E87500]">
            Step 1 · Initiate
          </p>
          <p className="text-sm font-bold text-[#151515] mt-0.5 group-hover:text-[#E87500] transition-colors">
            Raise New Change Request →
          </p>
          <p className="text-xs text-[#666666] mt-0.5">
            Select plant unit, 4M classification &amp; part details (QF/07/MRO-15).
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('forms-hub')}
          className="text-left p-3.5 rounded-lg border border-[#E6E6E6] hover:border-[#F28C00] hover:bg-[#FFF4E5]/25 transition-colors cursor-pointer group"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#E87500]">
            Step 2 · Fill &amp; Sync
          </p>
          <p className="text-sm font-bold text-[#151515] mt-0.5 group-hover:text-[#E87500] transition-colors">
            Open 7 Interconnected Forms →
          </p>
          <p className="text-xs text-[#666666] mt-0.5">
            Feasibility, Risk Analysis, Timing Plan, Checklist, PTR &amp; PPAP.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate(user.role === 'EMPLOYEE' ? 'pcrfs' : 'approvals')}
          className="text-left p-3.5 rounded-lg border border-[#E6E6E6] hover:border-[#F28C00] hover:bg-[#FFF4E5]/25 transition-colors cursor-pointer group"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#E87500]">
            Step 3 · Review &amp; Print
          </p>
          <p className="text-sm font-bold text-[#151515] mt-0.5 group-hover:text-[#E87500] transition-colors">
            {user.role === 'EMPLOYEE' ? 'Track Status & Print PDFs →' : 'Review Approvals & Print →'}
          </p>
          <p className="text-xs text-[#666666] mt-0.5">
            Sign off pending stage gates and export exact consultancy PDFs.
          </p>
        </button>
      </div>

      {/* Admin-Only Company Management Section directly in Admin Dashboard */}
      {user.role === 'ADMIN' && (
        <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E6E6E6] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#F28C00]" />
              <div>
                <h3 className="text-sm font-bold text-[#151515]">
                  Companies &amp; Manufacturing Units (Admin Control)
                </h3>
                <p className="text-xs text-[#666666]">
                  Only System Administrators can register new group companies and plant units.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate('companies')}
                className="px-3 py-1.5 rounded-lg border border-[#E6E6E6] hover:border-[#151515] text-xs font-semibold text-[#151515] cursor-pointer"
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#151515] hover:bg-[#F28C00] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddCompany ? 'Close Form' : 'Add Company'}</span>
              </button>
            </div>
          </div>

          {companySuccess && (
            <div role="status" className="mx-5 mt-4 px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              {companySuccess}
            </div>
          )}

          {showAddCompany && (
            <form onSubmit={handleAdminAddCompany} className="p-5 bg-[#F7F7F7]/60 border-b border-[#E6E6E6] space-y-4">
              {companyError && (
                <div role="alert" className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  {companyError}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label htmlFor="dash-comp-code" className="block text-xs font-semibold text-[#666666] mb-1">
                    Company Code *
                  </label>
                  <input
                    id="dash-comp-code"
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="SACL-MS2"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E6E6E6] rounded-lg"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label htmlFor="dash-comp-name" className="block text-xs font-semibold text-[#666666] mb-1">
                    Company Name *
                  </label>
                  <input
                    id="dash-comp-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sakthi Auto Precision Components Ltd."
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E6E6] rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="dash-comp-facility" className="block text-xs font-semibold text-[#666666] mb-1">
                    Facility Scope
                  </label>
                  <select
                    id="dash-comp-facility"
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value as CompanyRecord['facilityType'])}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E6E6] rounded-lg"
                  >
                    <option value="Machine Shop">Machine Shop</option>
                    <option value="Foundry">Foundry</option>
                    <option value="Foundry & Machine Shop">Foundry &amp; Machine Shop</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="dash-comp-unit" className="block text-xs font-semibold text-[#666666] mb-1">
                    Unit / Division Name
                  </label>
                  <input
                    id="dash-comp-unit"
                    type="text"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    placeholder="CNC Machine Shop Unit II"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E6E6] rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="dash-comp-location" className="block text-xs font-semibold text-[#666666] mb-1">
                    Plant Location *
                  </label>
                  <input
                    id="dash-comp-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Pollachi / Coimbatore, TN"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E6E6] rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="dash-comp-gst" className="block text-xs font-semibold text-[#666666] mb-1">
                    GST / Reg No.
                  </label>
                  <input
                    id="dash-comp-gst"
                    type="text"
                    value={gstOrRegNo}
                    onChange={(e) => setGstOrRegNo(e.target.value)}
                    placeholder="33AAACS8812N1Z4"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-[#E6E6E6] rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="dash-comp-email" className="block text-xs font-semibold text-[#666666] mb-1">
                    Contact Email
                  </label>
                  <input
                    id="dash-comp-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="plant@sakthiauto.com"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E6E6] rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={companySubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{companySubmitting ? 'Saving...' : 'Save Company Unit'}</span>
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F7F7F7] border-b border-[#E6E6E6] text-[11px] font-bold text-[#666666] uppercase">
                  <th className="py-2.5 px-4">Code</th>
                  <th className="py-2.5 px-4">Company &amp; Unit</th>
                  <th className="py-2.5 px-4">Facility Scope</th>
                  <th className="py-2.5 px-4">Location</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E6E6]">
                {companies.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F7F7F7]/50">
                    <td className="py-2.5 px-4 font-mono text-xs font-bold text-[#E87500] whitespace-nowrap">
                      {c.code}
                    </td>
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-[#151515]">{c.name}</p>
                      <p className="text-xs text-[#666666]">{c.unitName}</p>
                    </td>
                    <td className="py-2.5 px-4 text-xs text-[#151515]">{c.facilityType}</td>
                    <td className="py-2.5 px-4 text-xs text-[#666666]">{c.location}</td>
                    <td className="py-2.5 px-4 text-xs font-semibold text-emerald-700">
                      {c.active ? 'Active' : 'Inactive'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visualizations Row (Real Derived Data, Clean Sakthi Black/Orange Palette) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Workflow Stage Distribution */}
        <div className="lg:col-span-2 bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#151515]">Active Requests by Workflow Stage</h3>
            <button
              type="button"
              onClick={() => onNavigate('pcrfs')}
              className="text-xs font-semibold text-[#E87500] hover:underline cursor-pointer"
            >
              View All Change Requests →
            </button>
          </div>
          <div className="space-y-2.5">
            {stageCounts.slice(0, 8).map((item) => {
              const pct = total === 0 ? 0 : Math.round((item.count / total) * 100);
              return (
                <div key={item.label} className="grid grid-cols-12 items-center gap-3 text-xs">
                  <span className="col-span-5 font-medium text-[#151515] truncate">{item.label}</span>
                  <div className="col-span-5 h-2.5 bg-[#F7F7F7] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F28C00] rounded-full"
                      style={{ width: `${Math.max(pct, item.count > 0 ? 12 : 0)}%` }}
                    />
                  </div>
                  <span className="col-span-2 text-right font-mono font-bold text-[#151515] tabular-nums">
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department & Change Split */}
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#151515]">Requests by Department</h3>
          <div className="space-y-3">
            {deptEntries.map(([dept, cnt]) => {
              const pct = total === 0 ? 0 : Math.round((cnt / total) * 100);
              return (
                <div key={dept} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-[#151515]">{dept}</span>
                    <span className="font-mono tabular-nums text-[#666666]">
                      {cnt} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 bg-[#F7F7F7] rounded-full overflow-hidden">
                    <div className="h-full bg-[#151515] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#E6E6E6] flex items-center justify-between text-xs">
            <span className="text-[#666666] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#F28C00]" /> Product vs Process
            </span>
            <span className="font-mono font-bold text-[#151515] tabular-nums">
              {productCount} Prod / {processCount} Proc
            </span>
          </div>
        </div>
      </div>

      {/* Role Action Queue Table */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E6E6E6] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#F28C00]" />
            <h3 className="text-sm font-bold text-[#151515]">
              {user.role === 'EMPLOYEE'
                ? 'My Submitted Change Requests'
                : 'Priority Action & Approval Queue'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('pcrfs')}
            className="text-xs font-semibold text-[#E87500] hover:underline cursor-pointer"
          >
            View All PCRFs
          </button>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F7F7F7] border-b border-[#E6E6E6] text-[11px] font-bold text-[#666666] uppercase">
                <th className="py-2.5 px-4">PCRF No.</th>
                <th className="py-2.5 px-4">Part &amp; Customer</th>
                <th className="py-2.5 px-4">Current Stage</th>
                <th className="py-2.5 px-4">Priority</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E6]">
              {(user.role === 'EMPLOYEE' ? myRequests : actionQueue).map((p) => {
                const stObj = WORKFLOW_STAGE_ORDER.find((s) => s.key === p.currentStage);
                return (
                  <tr
                    key={p.id}
                    onClick={() => onOpenPCRF(p.id)}
                    className="hover:bg-[#FFF4E5]/30 cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-xs font-bold text-[#151515]">
                      {p.pcrfNo}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[#151515]">{p.form1.partName}</p>
                      <p className="text-xs text-[#666666]">{p.form1.customer}</p>
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold text-[#151515]">
                      {stObj?.label || p.currentStage}
                    </td>
                    <td className="py-3 px-4">
                      <StatusText status={p.priority} />
                    </td>
                    <td className="py-3 px-4">
                      <StatusText status={p.overallStatus} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPCRF(p.id);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#151515] hover:bg-[#F28C00] text-white text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <span>Review</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
