import React, { useState } from 'react';
import {
  Bell,
  Building2,
  Check,
  FileText,
  Plus,
  Printer,
  UserPlus,
} from 'lucide-react';
import type {
  AuditLogItem,
  ChangeRequestRecord,
  CompanyRecord,
  CustomerRecord,
  DepartmentRecord,
  FormIdentifier,
  NotificationItem,
  PartMasterRecord,
  UserAccount,
  UserRole,
} from '../types/pcms';
import type { DetailsTabKey } from './ChangeRequestDetails';
import { RoleDisplayLabel, StatusText } from './ui/StatusBadge';
import { WORKFLOW_STAGE_ORDER } from '../utils/workflow';

const FORM_CARDS: Array<{
  formKey: FormIdentifier;
  tabKey: DetailsTabKey;
  code: string;
  title: string;
  desc: string;
}> = [
  { formKey: 'form1', tabKey: 'form1', code: 'QF/07/MRO-15', title: '1. Process Change Requisition Form', desc: 'Master change requisition, 4M classification, Particulars dropdown, Foundry/Machine Shop comments & SOP reflection.' },
  { formKey: 'form2', tabKey: 'form2', code: 'QF/07/MRO-02', title: '2. Feasibility Report for Change Request', desc: 'Manufacturing, system, inspection & resource feasibility assessment with 6 CFT member sign-offs.' },
  { formKey: 'form3', tabKey: 'form3', code: 'QF/07/MKT-14', title: '3. Risk Analysis Check Sheet', desc: '18-point Man/Method/Machine/Material/QCD risk matrix with AP/NAP & H/M/L overall risk scoring.' },
  { formKey: 'form4', tabKey: 'form4', code: 'QF/07/MKT-08', title: '4. Timing Plan (APQP Phase I)', desc: 'APQP Phase I milestone schedule for Customer, Internal, and Tier-2 alignment with Go/No-Go gate.' },
  { formKey: 'form5', tabKey: 'form5', code: 'QF/07/MRO-03', title: '5. Checklist for Managing & Tracking Change', desc: 'Complete 4-page 33-item impact checklist with Yes/No termination rule, stock/tooling actions & core team sign-offs.' },
  { formKey: 'form6', tabKey: 'form6', code: 'QF/07/MRO-16', title: '6. PTR Initiation Form', desc: 'Production Trial Run progression across PTR 1 (5 Nos), PTR 2 (25 Nos), and PTR 3 (50 Nos) with 5-dept approval.' },
  { formKey: 'form7', tabKey: 'form7', code: 'QF/07/MRO-05', title: '7. PPAP Initiation cum Production Report', desc: 'First production run, PFD/Control Plan revision validation, deviations, PSW approval & dispatch authorization.' },
];

export function ConsultancyFormsHub({
  pcrfs,
  onOpenPCRFTab,
  onPrintForm,
}: {
  pcrfs: ChangeRequestRecord[];
  onOpenPCRFTab: (pcrfId: string, tab: DetailsTabKey) => void;
  onPrintForm: (pcrfId: string, formKey: FormIdentifier) => void;
}) {
  const [selectedId, setSelectedId] = useState(pcrfs[0]?.id || '');
  const activeRecord = pcrfs.find((p) => p.id === selectedId) || pcrfs[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#151515]">
            Interconnected Consultancy Forms Hub
          </h2>
          <p className="text-sm text-[#666666]">
            Select a Change Request to fill or print any of the 7 linked Sakthi Auto official forms.
          </p>
        </div>
        {pcrfs.length > 0 && (
          <select
            aria-label="Select active Change Request"
            value={activeRecord?.id || ''}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3.5 py-2 text-sm font-semibold border border-[#E6E6E6] rounded-lg bg-white focus:outline-none focus:border-[#F28C00]"
          >
            {pcrfs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.pcrfNo} — {p.form1.partName} ({p.form1.customer})
              </option>
            ))}
          </select>
        )}
      </div>

      {activeRecord && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FORM_CARDS.map((card) => (
            <div
              key={card.formKey}
              className="bg-white border border-[#E6E6E6] rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <p className="font-mono text-xs font-bold text-[#E87500]">{card.code}</p>
                <h3 className="text-base font-bold text-[#151515] mt-1">{card.title}</h3>
                <p className="text-xs text-[#666666] mt-1.5 leading-relaxed">{card.desc}</p>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-[#E6E6E6]">
                <button
                  type="button"
                  onClick={() => onOpenPCRFTab(activeRecord.id, card.tabKey)}
                  className="flex-1 py-2 px-3 rounded-lg bg-[#151515] hover:bg-[#F28C00] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Open &amp; Fill Form
                </button>
                <button
                  type="button"
                  onClick={() => onPrintForm(activeRecord.id, card.formKey)}
                  className="inline-flex items-center gap-1.5 py-2 px-3 rounded-lg border border-[#E6E6E6] hover:border-[#151515] text-xs font-bold text-[#151515] cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MyTasksPage({
  pcrfs,
  user,
  onOpenPCRF,
}: {
  pcrfs: ChangeRequestRecord[];
  user: UserAccount;
  onOpenPCRF: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const rows = pcrfs.flatMap((p) =>
    p.workflow
      .filter((w) =>
        filter === 'ALL'
          ? w.status !== 'PENDING'
          : filter === 'PENDING'
          ? w.status === 'IN_PROGRESS' || w.status === 'RETURNED'
          : w.status === 'COMPLETED',
      )
      .map((w) => ({
        pcrf: p,
        stage: w,
      })),
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#151515]">My Tasks &amp; Milestones</h2>
          <p className="text-sm text-[#666666]">
            Active workflow tasks and stage deliverables for {user.name}.
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white border border-[#E6E6E6] rounded-lg">
          {(['ALL', 'PENDING', 'COMPLETED'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer ${
                filter === f ? 'bg-[#151515] text-white' : 'text-[#666666]'
              }`}
            >
              {f === 'ALL' ? 'All Tasks' : f === 'PENDING' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#F7F7F7] border-b border-[#E6E6E6] text-[11px] font-bold text-[#666666] uppercase">
              <th className="py-3 px-4">PCRF No.</th>
              <th className="py-3 px-4">Task / Stage</th>
              <th className="py-3 px-4">Part</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E6E6]">
            {rows.map(({ pcrf, stage }, idx) => (
              <tr
                key={`${pcrf.id}-${stage.key}-${idx}`}
                onClick={() => onOpenPCRF(pcrf.id)}
                className="hover:bg-[#FFF4E5]/30 cursor-pointer"
              >
                <td className="py-3 px-4 font-mono text-xs font-bold text-[#E87500]">
                  {pcrf.pcrfNo}
                </td>
                <td className="py-3 px-4 font-semibold text-[#151515]">{stage.label}</td>
                <td className="py-3 px-4 text-xs text-[#666666]">{pcrf.form1.partName}</td>
                <td className="py-3 px-4 font-mono text-xs tabular-nums">{pcrf.dueDate}</td>
                <td className="py-3 px-4">
                  <StatusText status={stage.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function NotificationsPage({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onOpenPCRF,
}: {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onOpenPCRF: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#151515]">Notifications</h2>
          <p className="text-sm text-[#666666]">
            Real-time workflow alerts, approval requests, and milestone updates.
          </p>
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E6E6E6] bg-white hover:border-[#151515] text-xs font-bold cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" /> Mark All Read
        </button>
      </div>

      <div className="bg-white border border-[#E6E6E6] rounded-xl divide-y divide-[#E6E6E6]">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              n.read ? 'bg-white' : 'bg-[#FFF4E5]/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <Bell className={`w-4 h-4 mt-1 shrink-0 ${n.read ? 'text-neutral-400' : 'text-[#F28C00]'}`} />
              <div>
                <p className="text-sm font-bold text-[#151515]">{n.title}</p>
                <p className="text-xs text-[#666666] mt-0.5">{n.message}</p>
                <p className="text-[11px] font-mono text-neutral-400 mt-1">
                  {n.type} · {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!n.read && (
                <button
                  type="button"
                  onClick={() => onMarkRead(n.id)}
                  className="px-3 py-1.5 rounded border border-[#E6E6E6] text-xs font-semibold hover:bg-[#F7F7F7] cursor-pointer"
                >
                  Mark Read
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onMarkRead(n.id);
                  onOpenPCRF(n.pcrfId);
                }}
                className="px-3 py-1.5 rounded bg-[#151515] text-white text-xs font-semibold hover:bg-[#F28C00] cursor-pointer"
              >
                Open {n.pcrfNo}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DocumentCenterPage({
  pcrfs,
  onPrintForm,
}: {
  pcrfs: ChangeRequestRecord[];
  onPrintForm: (pcrfId: string, formKey: FormIdentifier) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#151515]">Document Center</h2>
        <p className="text-sm text-[#666666]">
          Print or export official Sakthi Auto PDF formats generated directly from saved PCRF records.
        </p>
      </div>

      <div className="space-y-4">
        {pcrfs.map((p) => (
          <div key={p.id} className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E6E6] pb-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#E87500]">{p.pcrfNo}</span>
                <h3 className="text-sm font-bold text-[#151515]">
                  {p.form1.partName} ({p.form1.partNo}) — {p.form1.customer}
                </h3>
              </div>
              <StatusText status={p.overallStatus} />
            </div>
            <div className="flex flex-wrap gap-2">
              {FORM_CARDS.map((fc) => (
                <button
                  key={fc.formKey}
                  type="button"
                  onClick={() => onPrintForm(p.id, fc.formKey)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6E6E6] hover:border-[#F28C00] hover:bg-[#FFF4E5]/40 text-xs font-semibold text-[#151515] cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#F28C00]" />
                  <span>{fc.code}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportsAnalyticsPage({ pcrfs }: { pcrfs: ChangeRequestRecord[] }) {
  const [deptFilter, setDeptFilter] = useState('ALL');
  const filtered = pcrfs.filter(
    (p) => deptFilter === 'ALL' || p.form1.department === deptFilter,
  );
  const departments = Array.from(new Set(pcrfs.map((p) => p.form1.department)));

  const ptrCompleted = filtered.filter((p) => p.form6.ptr1.sampleStatus === 'OK').length;
  const ppapCompleted = filtered.filter((p) => p.form7.submissionStatus === 'Yes').length;
  const closed = filtered.filter((p) => p.overallStatus === 'Closed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#151515]">Reports &amp; Analytics</h2>
          <p className="text-sm text-[#666666]">
            Live metrics computed from persisted Change Request records.
          </p>
        </div>
        <select
          aria-label="Filter analytics by department"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 text-xs font-semibold border border-[#E6E6E6] rounded-lg bg-white"
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-5">
          <p className="text-xs text-[#666666]">Filtered PCRFs</p>
          <p className="text-3xl font-extrabold text-[#151515] mt-1 tabular-nums">{filtered.length}</p>
        </div>
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-5">
          <p className="text-xs text-[#666666]">PTR 1+ Passed</p>
          <p className="text-3xl font-extrabold text-[#E87500] mt-1 tabular-nums">{ptrCompleted}</p>
        </div>
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-5">
          <p className="text-xs text-[#666666]">PPAP Submitted</p>
          <p className="text-3xl font-extrabold text-[#151515] mt-1 tabular-nums">{ppapCompleted}</p>
        </div>
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-5">
          <p className="text-xs text-[#666666]">Closure Rate</p>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1 tabular-nums">
            {filtered.length ? Math.round((closed / filtered.length) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-[#151515]">Stage Distribution Breakdown</h3>
        <div className="space-y-3">
          {WORKFLOW_STAGE_ORDER.map((st) => {
            const cnt = filtered.filter((p) => p.currentStage === st.key).length;
            const pct = filtered.length ? Math.round((cnt / filtered.length) * 100) : 0;
            return (
              <div key={st.key} className="grid grid-cols-12 items-center gap-3 text-xs">
                <span className="col-span-4 font-semibold text-[#151515]">{st.label}</span>
                <div className="col-span-6 h-3 bg-[#F7F7F7] rounded-full overflow-hidden">
                  <div className="h-full bg-[#F28C00]" style={{ width: `${pct}%` }} />
                </div>
                <span className="col-span-2 text-right font-mono font-bold tabular-nums">
                  {cnt} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function UsersRolesPage({
  users,
  onCreateUser,
}: {
  users: UserAccount[];
  onCreateUser: (payload: Partial<UserAccount>) => Promise<void>;
}) {
  const [empId, setEmpId] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [dept, setDept] = useState('Machine Shop');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!empId.trim() || !name.trim()) return;
    await onCreateUser({ employeeId: empId, name, role, department: dept });
    setEmpId('');
    setName('');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#151515]">Users &amp; Role Permissions</h2>
        <p className="text-sm text-[#666666]">
          Manage Sakthi Auto user accounts across all 8 authorized enterprise roles.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="bg-white border border-[#E6E6E6] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">Employee ID</label>
          <input
            type="text"
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            placeholder="EMP505"
            className="w-full px-3 py-2 text-xs font-mono border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Engineer Name"
            className="w-full px-3 py-2 text-xs border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full px-3 py-2 text-xs border border-[#E6E6E6] rounded-lg bg-white"
          >
            {(['EMPLOYEE', 'HOD', 'HOF', 'COF', 'CFT', 'CFT_LEADER', 'PLANT_HEAD', 'ADMIN'] as const).map((r) => (
              <option key={r} value={r}>
                {RoleDisplayLabel(r)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">Department</label>
          <input
            type="text"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-xs font-bold cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Add User
        </button>
      </form>

      <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#F7F7F7] border-b border-[#E6E6E6] text-[11px] font-bold text-[#666666] uppercase">
              <th className="py-3 px-4">Employee ID</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Facility</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E6E6]">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-3 px-4 font-mono text-xs font-bold text-[#151515]">
                  {u.employeeId}
                </td>
                <td className="py-3 px-4 font-semibold text-[#151515]">{u.name}</td>
                <td className="py-3 px-4 text-xs font-bold text-[#E87500]">
                  {RoleDisplayLabel(u.role)}
                </td>
                <td className="py-3 px-4 text-xs text-[#666666]">{u.department}</td>
                <td className="py-3 px-4 text-xs text-[#666666]">{u.facility}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CompaniesPage({
  companies,
  currentUser,
  onCreateCompany,
}: {
  companies: CompanyRecord[];
  currentUser: UserAccount;
  onCreateCompany: (payload: Partial<CompanyRecord>) => Promise<void>;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [facilityType, setFacilityType] = useState<CompanyRecord['facilityType']>('Machine Shop');
  const [location, setLocation] = useState('');
  const [gstOrRegNo, setGstOrRegNo] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-8 text-center space-y-2">
        <Building2 className="w-8 h-8 text-[#F28C00] mx-auto" />
        <h2 className="text-lg font-bold text-[#151515]">Administrator Access Required</h2>
        <p className="text-sm text-[#666666]">
          Companies and plant units can only be added or managed from the System Administrator Dashboard.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim() || !location.trim()) {
      setError('Company Code, Company Name, and Location are required.');
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);
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
      setSuccess(`Added ${name.trim()} (${code.trim().toUpperCase()})`);
      setCode('');
      setName('');
      setUnitName('');
      setLocation('');
      setGstOrRegNo('');
      setContactEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add company');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#151515]">Companies &amp; Manufacturing Units</h2>
        <p className="text-sm text-[#666666]">
          Register and manage Sakthi Auto plants, machine shops, and group manufacturing companies.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-[#E6E6E6] pb-3">
          <Building2 className="w-4 h-4 text-[#F28C00]" />
          <h3 className="text-sm font-bold text-[#151515]">Add New Company / Plant Unit</h3>
        </div>

        {error && (
          <div role="alert" className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label htmlFor="comp-code" className="block text-xs font-semibold text-[#666666] mb-1">
              Company Code *
            </label>
            <input
              id="comp-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SACL-MS2"
              className="w-full px-3 py-2 text-xs font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="comp-name" className="block text-xs font-semibold text-[#666666] mb-1">
              Company Name *
            </label>
            <input
              id="comp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sakthi Auto Precision Components Ltd."
              className="w-full px-3 py-2 text-xs border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="comp-facility" className="block text-xs font-semibold text-[#666666] mb-1">
              Facility Scope
            </label>
            <select
              id="comp-facility"
              value={facilityType}
              onChange={(e) => setFacilityType(e.target.value as CompanyRecord['facilityType'])}
              className="w-full px-3 py-2 text-xs border border-[#E6E6E6] rounded-lg bg-white"
            >
              <option value="Machine Shop">Machine Shop</option>
              <option value="Foundry">Foundry</option>
              <option value="Foundry & Machine Shop">Foundry &amp; Machine Shop</option>
              <option value="Corporate">Corporate</option>
            </select>
          </div>
          <div>
            <label htmlFor="comp-unit" className="block text-xs font-semibold text-[#666666] mb-1">
              Unit / Division Name
            </label>
            <input
              id="comp-unit"
              type="text"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="CNC Machine Shop Unit II"
              className="w-full px-3 py-2 text-xs border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="comp-location" className="block text-xs font-semibold text-[#666666] mb-1">
              Plant Location *
            </label>
            <input
              id="comp-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Pollachi / Coimbatore, TN"
              className="w-full px-3 py-2 text-xs border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="comp-gst" className="block text-xs font-semibold text-[#666666] mb-1">
              GST / Plant Reg. No.
            </label>
            <input
              id="comp-gst"
              type="text"
              value={gstOrRegNo}
              onChange={(e) => setGstOrRegNo(e.target.value)}
              placeholder="33AAACS8812N1Z4"
              className="w-full px-3 py-2 text-xs font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="comp-email" className="block text-xs font-semibold text-[#666666] mb-1">
              Contact Email
            </label>
            <input
              id="comp-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="plant@sakthiauto.com"
              className="w-full px-3 py-2 text-xs border border-[#E6E6E6] rounded-lg"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 py-2 px-4 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            <span>{submitting ? 'Adding...' : 'Add Company'}</span>
          </button>
        </div>
      </form>

      <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F7F7F7] border-b border-[#E6E6E6] text-[11px] font-bold text-[#666666] uppercase">
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Company &amp; Unit</th>
                <th className="py-3 px-4">Facility Type</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">GST / Reg No.</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E6]">
              {companies.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 px-4 font-mono text-xs font-bold text-[#E87500] whitespace-nowrap">
                    {c.code}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[#151515]">{c.name}</p>
                    <p className="text-xs text-[#666666]">{c.unitName}</p>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-[#151515]">{c.facilityType}</td>
                  <td className="py-3 px-4 text-xs text-[#666666]">{c.location}</td>
                  <td className="py-3 px-4 font-mono text-xs text-[#666666]">
                    {c.gstOrRegNo || '—'}
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-emerald-700">
                    {c.active ? 'Active' : 'Inactive'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function DepartmentsPage({ departments }: { departments: DepartmentRecord[] }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#151515]">Departments &amp; CFT Units</h2>
        <p className="text-sm text-[#666666]">Foundry, Machine Shop, QA, NPD, Maintenance &amp; Tooling teams.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs font-bold text-[#E87500]">{d.code}</span>
              <span className="text-xs text-[#666666]">{d.facility}</span>
            </div>
            <h3 className="text-base font-bold text-[#151515]">{d.name}</h3>
            <p className="text-xs text-[#666666]">
              HOD: <strong className="text-[#151515]">{d.hodName}</strong> · {d.memberCount} members
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CustomersPartsPage({
  customers,
  parts,
}: {
  customers: CustomerRecord[];
  parts: PartMasterRecord[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#151515]">Customers &amp; Parts Master</h2>
        <p className="text-sm text-[#666666]">OEM customers and active automotive casting/machined part numbers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-[#F7F7F7] border-b border-[#E6E6E6] text-xs font-bold uppercase text-[#151515]">
            OEM Customers
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <tbody className="divide-y divide-[#E6E6E6]">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 px-4 font-mono font-bold text-[#E87500]">{c.code}</td>
                  <td className="py-3 px-4 font-bold text-[#151515]">{c.name}</td>
                  <td className="py-3 px-4 text-[#666666]">{c.location}</td>
                  <td className="py-3 px-4 text-[#151515]">{c.contactPerson}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-[#F7F7F7] border-b border-[#E6E6E6] text-xs font-bold uppercase text-[#151515]">
            Parts Master
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <tbody className="divide-y divide-[#E6E6E6]">
              {parts.map((pt) => (
                <tr key={pt.id}>
                  <td className="py-3 px-4 font-mono font-bold text-[#151515]">{pt.partNumber}</td>
                  <td className="py-3 px-4 font-semibold text-[#151515]">{pt.partName}</td>
                  <td className="py-3 px-4 text-[#666666]">{pt.customer}</td>
                  <td className="py-3 px-4 font-mono text-[#E87500]">{pt.currentRevision}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AuditLogsPage({ auditLogs }: { auditLogs: AuditLogItem[] }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#151515]">System Audit Logs</h2>
        <p className="text-sm text-[#666666]">Immutable compliance trail of all workflow transitions and approvals.</p>
      </div>
      <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F7F7F7] border-b border-[#E6E6E6] text-[11px] font-bold text-[#666666] uppercase">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Actor</th>
              <th className="py-3 px-4">Entity</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E6E6]">
            {auditLogs.map((log) => (
              <tr key={log.id}>
                <td className="py-3 px-4 font-mono text-[#666666]">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="py-3 px-4 font-semibold text-[#151515]">
                  {log.actorName} ({log.actorRole})
                </td>
                <td className="py-3 px-4 font-mono font-bold text-[#E87500]">{log.entityId}</td>
                <td className="py-3 px-4 font-mono text-[#151515]">{log.action}</td>
                <td className="py-3 px-4 text-[#666666]">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [autoSync, setAutoSync] = useState(true);
  const [enforcePtrGate, setEnforcePtrGate] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-[#151515]">System Settings</h2>
        <p className="text-sm text-[#666666]">Configure workflow gating and form interconnection rules.</p>
      </div>
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-6 space-y-4">
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <div>
            <p className="text-sm font-bold text-[#151515]">Auto-Sync PCRF Metadata Across Forms 2–7</p>
            <p className="text-xs text-[#666666]">Propagates Part Name, Part No, Customer &amp; Department automatically.</p>
          </div>
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
            className="w-4 h-4 accent-[#F28C00]"
          />
        </label>
        <label className="flex items-center justify-between gap-4 pt-3 border-t border-[#E6E6E6] cursor-pointer">
          <div>
            <p className="text-sm font-bold text-[#151515]">Enforce Sequential PTR 1 → PTR 2 → PTR 3 Gate</p>
            <p className="text-xs text-[#666666]">Requires OK sign-off on PTR 1 before unlocking PTR 2 (25 Nos) and PTR 3 (50 Nos).</p>
          </div>
          <input
            type="checkbox"
            checked={enforcePtrGate}
            onChange={(e) => setEnforcePtrGate(e.target.checked)}
            className="w-4 h-4 accent-[#F28C00]"
          />
        </label>
        <div className="pt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSavedMsg(true);
              setTimeout(() => setSavedMsg(false), 2500);
            }}
            className="px-4 py-2 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-xs font-bold cursor-pointer"
          >
            Save Preferences
          </button>
          {savedMsg && <span className="text-xs font-semibold text-emerald-700">Preferences saved.</span>}
        </div>
      </div>
    </div>
  );
}
