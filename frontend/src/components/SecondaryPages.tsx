import React, { useState } from 'react';
import {
  Bell,
  Building2,
  Check,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Plus,
  Printer,
  UserPlus,
} from 'lucide-react';
import type { CreateCompanyPayload } from '../api/client';
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
  canCreatePCRF = true,
  onCreateNew,
  onOpenPCRFTab,
  onPrintForm,
}: {
  pcrfs: ChangeRequestRecord[];
  canCreatePCRF?: boolean;
  onCreateNew?: () => void;
  onOpenPCRFTab: (pcrfId: string, tab: DetailsTabKey) => void;
  onPrintForm: (pcrfId: string, formKey: FormIdentifier) => void;
}) {
  const [selectedId, setSelectedId] = useState(pcrfs[0]?.id || '');
  const activeRecord = pcrfs.find((p) => p.id === selectedId) || pcrfs[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl leading-8 font-extrabold text-[#111318] tracking-tight">
            Interconnected Consultancy Forms Hub
          </h2>
          <p className="text-sm text-[#5C6470]">
            Select a Change Request to fill or print any of the 7 linked Sakthi Auto official forms.
          </p>
        </div>
        {pcrfs.length > 0 && (
          <select
            aria-label="Select active Change Request"
            value={activeRecord?.id || ''}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-10 px-4 text-sm font-semibold text-[#111318] border border-[#D5DAE1] rounded-lg bg-white focus:outline-none focus:border-[#F28C00]"
          >
            {pcrfs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.pcrfNo} — {p.form1.partName} ({p.form1.customer})
              </option>
            ))}
          </select>
        )}
      </div>

      {!activeRecord ? (
        <div className="surface-card p-12 text-center space-y-4">
          <FileText className="w-8 h-8 text-[#F28C00] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#111318]">No Change Requests in Database</h3>
            <p className="text-sm text-[#5C6470] max-w-md mx-auto">
              Create a Change Request (PCRF) to unlock and interconnect all 7 official Sakthi Auto consultancy forms.
            </p>
          </div>
          {canCreatePCRF && onCreateNew && (
            <button
              type="button"
              onClick={onCreateNew}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Create First PCRF</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FORM_CARDS.map((card) => (
            <div
              key={card.formKey}
              className="surface-card p-6 flex flex-col justify-between gap-6"
            >
              <div className="space-y-2">
                <p className="font-mono text-xs font-bold text-[#D97700]">{card.code}</p>
                <h3 className="text-base font-bold text-[#111318]">{card.title}</h3>
                <p className="text-xs text-[#5C6470] leading-5">{card.desc}</p>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-[#E4E7EC]">
                <button
                  type="button"
                  onClick={() => onOpenPCRFTab(activeRecord.id, card.tabKey)}
                  className="flex-1 btn-dark hover:bg-[#F28C00]"
                >
                  Open &amp; Fill Form
                </button>
                <button
                  type="button"
                  onClick={() => onPrintForm(activeRecord.id, card.formKey)}
                  className="btn-secondary"
                >
                  <Printer className="w-4 h-4" />
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl leading-8 font-extrabold text-[#111318] tracking-tight">
            My Tasks &amp; Milestones
          </h2>
          <p className="text-sm text-[#5C6470]">
            Active workflow tasks and stage deliverables for {user.name}.
          </p>
        </div>
        <div className="surface-card flex items-center gap-1 p-1 w-fit">
          {(['ALL', 'PENDING', 'COMPLETED'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`h-8 px-4 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                filter === f ? 'bg-[#121417] text-white' : 'text-[#5C6470] hover:text-[#111318]'
              }`}
            >
              {f === 'ALL' ? 'All Tasks' : f === 'PENDING' ? 'In Progress' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#5C6470] uppercase tracking-wider">
                <th className="h-10 px-6">PCRF No.</th>
                <th className="h-10 px-4">Task / Stage</th>
                <th className="h-10 px-4">Part</th>
                <th className="h-10 px-4">Due Date</th>
                <th className="h-10 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-6 text-center text-xs text-[#5C6470]">
                    No workflow tasks recorded in the database yet.
                  </td>
                </tr>
              ) : (
                rows.map(({ pcrf, stage }, idx) => (
                  <tr
                    key={`${pcrf.id}-${stage.key}-${idx}`}
                    onClick={() => onOpenPCRF(pcrf.id)}
                    className="hover:bg-[#FFF6EB]/50 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 font-mono text-xs font-bold text-[#D97700] whitespace-nowrap">
                      {pcrf.pcrfNo}
                    </td>
                    <td className="py-4 px-4 font-semibold text-[#111318]">{stage.label}</td>
                    <td className="py-4 px-4 text-xs text-[#5C6470]">{pcrf.form1.partName}</td>
                    <td className="py-4 px-4 font-mono text-xs tabular-nums text-[#5C6470]">
                      {pcrf.dueDate}
                    </td>
                    <td className="py-4 px-6">
                      <StatusText status={stage.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl leading-8 font-extrabold text-[#111318] tracking-tight">
            Notifications
          </h2>
          <p className="text-sm text-[#5C6470]">
            Real-time workflow alerts, approval requests, and milestone updates.
          </p>
        </div>
        <button
          type="button"
          onClick={onMarkAllRead}
          className="btn-secondary self-start sm:self-auto"
        >
          <Check className="w-4 h-4" />
          <span>Mark All Read</span>
        </button>
      </div>

      <div className="surface-card divide-y divide-[#E4E7EC] overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Bell className="w-8 h-8 text-[#D5DAE1] mx-auto" />
            <p className="text-sm font-bold text-[#111318]">No Notifications Yet</p>
            <p className="text-xs text-[#5C6470]">
              Workflow notifications will appear here automatically as Change Requests are submitted and approved.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                n.read ? 'bg-white' : 'bg-[#FFF6EB]/60'
              }`}
            >
              <div className="flex items-start gap-4">
                <Bell className={`w-4 h-4 mt-1 shrink-0 ${n.read ? 'text-[#8A94A6]' : 'text-[#F28C00]'}`} />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#111318]">{n.title}</p>
                  <p className="text-xs text-[#5C6470]">{n.message}</p>
                  <p className="text-[11px] font-mono text-[#8A94A6] tabular-nums">
                    {n.type} · {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(n.id)}
                    className="btn-compact border border-[#D5DAE1] bg-white hover:border-[#121417] text-[#111318]"
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
                  className="btn-compact bg-[#121417] text-white hover:bg-[#F28C00]"
                >
                  Open {n.pcrfNo}
                </button>
              </div>
            </div>
          ))
        )}
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl leading-8 font-extrabold text-[#111318] tracking-tight">
          Document Center
        </h2>
        <p className="text-sm text-[#5C6470]">
          Print or export official Sakthi Auto PDF formats generated directly from saved PCRF records.
        </p>
      </div>

      <div className="space-y-4">
        {pcrfs.length === 0 ? (
          <div className="surface-card p-12 text-center space-y-2">
            <FileText className="w-8 h-8 text-[#D5DAE1] mx-auto" />
            <p className="text-sm font-bold text-[#111318]">No Saved PCRF Documents</p>
            <p className="text-xs text-[#5C6470]">
              Printable Sakthi Auto forms (QF/07/MRO-15 through QF/07/MRO-05) will appear here once Change Requests are stored in the database.
            </p>
          </div>
        ) : (
          pcrfs.map((p) => (
            <div key={p.id} className="surface-card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4E7EC] pb-4">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold text-[#D97700]">{p.pcrfNo}</span>
                  <h3 className="text-sm font-bold text-[#111318]">
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
                    className="btn-compact border border-[#D5DAE1] bg-white hover:border-[#F28C00] hover:bg-[#FFF6EB]/60 text-[#111318]"
                  >
                    <FileText className="w-4 h-4 text-[#F28C00]" />
                    <span>{fc.code}</span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl leading-8 font-extrabold text-[#111318] tracking-tight">
            Reports &amp; Analytics
          </h2>
          <p className="text-sm text-[#5C6470]">
            Live metrics computed from persisted Change Request records.
          </p>
        </div>
        <select
          aria-label="Filter analytics by department"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="h-10 px-4 text-xs font-semibold text-[#111318] border border-[#D5DAE1] rounded-lg bg-white"
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card p-6">
          <p className="text-xs font-medium text-[#5C6470]">Filtered PCRFs</p>
          <p className="text-[32px] leading-10 font-extrabold text-[#111318] mt-2 tabular-nums tracking-tight">
            {filtered.length}
          </p>
        </div>
        <div className="surface-card p-6">
          <p className="text-xs font-medium text-[#5C6470]">PTR 1+ Passed</p>
          <p className="text-[32px] leading-10 font-extrabold text-[#D97700] mt-2 tabular-nums tracking-tight">
            {ptrCompleted}
          </p>
        </div>
        <div className="surface-card p-6">
          <p className="text-xs font-medium text-[#5C6470]">PPAP Submitted</p>
          <p className="text-[32px] leading-10 font-extrabold text-[#111318] mt-2 tabular-nums tracking-tight">
            {ppapCompleted}
          </p>
        </div>
        <div className="surface-card p-6">
          <p className="text-xs font-medium text-[#5C6470]">Closure Rate</p>
          <p className="text-[32px] leading-10 font-extrabold text-emerald-700 mt-2 tabular-nums tracking-tight">
            {filtered.length ? Math.round((closed / filtered.length) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="surface-card p-6 space-y-6">
        <h3 className="text-sm font-bold text-[#111318]">Stage Distribution Breakdown</h3>
        <div className="space-y-4">
          {WORKFLOW_STAGE_ORDER.map((st) => {
            const cnt = filtered.filter((p) => p.currentStage === st.key).length;
            const pct = filtered.length ? Math.round((cnt / filtered.length) * 100) : 0;
            return (
              <div key={st.key} className="grid grid-cols-12 items-center gap-4 text-xs">
                <span className="col-span-4 font-semibold text-[#111318] truncate">{st.label}</span>
                <div className="col-span-6 h-2 bg-[#F4F5F7] rounded-full overflow-hidden">
                  <div className="h-full bg-[#F28C00] rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="col-span-2 text-right font-mono font-bold text-[#111318] tabular-nums">
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
  companies,
  onCreateUser,
}: {
  users: UserAccount[];
  companies: CompanyRecord[];
  onCreateUser: (payload: Partial<UserAccount> & { password?: string }) => Promise<void>;
}) {
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [dept, setDept] = useState('Machine Shop');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !name.trim() || !password.trim()) {
      setError('Username / Employee ID, Full Name, and Password are required.');
      return;
    }
    if (password.trim().length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await onCreateUser({
        employeeId: username.trim(),
        username: username.trim(),
        name: name.trim(),
        email: email.trim() || undefined,
        password: password.trim(),
        role,
        department: dept.trim() || 'Machine Shop',
        companyId: companyId || null,
      });
      setSuccess(`Created account "${username.trim()}" (${RoleDisplayLabel(role)}) with JWT access.`);
      setUsername('');
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl leading-8 font-extrabold text-[#111318] tracking-tight">
          Users &amp; JWT Role Permissions
        </h2>
        <p className="text-sm text-[#5C6470]">
          Provision individual login accounts with custom usernames, passwords, company assignments, and JWT role permissions.
        </p>
      </div>

      <form onSubmit={handleAdd} className="surface-card p-6 space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-[#E4E7EC]">
          <UserPlus className="w-4 h-4 text-[#F28C00]" />
          <h3 className="text-sm font-bold text-[#111318]">Create Individual User / Company Account</h3>
        </div>

        {error && (
          <div role="alert" className="px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="user-company" className="field-label">
              Assigned Company / Unit
            </label>
            <select
              id="user-company"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="field-input"
            >
              <option value="">All Plants / Corporate</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="user-username" className="field-label">
              Username / Employee ID *
            </label>
            <input
              id="user-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., sacl_unit2_hod"
              className="field-input font-mono"
            />
          </div>
          <div>
            <label htmlFor="user-fullname" className="field-label">
              Full Name *
            </label>
            <input
              id="user-fullname"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Account Holder Name"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="user-password" className="field-label">
              Account Password *
            </label>
            <div className="relative flex items-center">
              <input
                id="user-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 4 characters"
                className="field-input !pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 w-8 h-8 flex items-center justify-center text-[#5C6470] hover:text-[#111318] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="user-role" className="field-label">
              JWT Access Role
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="field-input"
            >
              {(
                [
                  'COMPANY_USER',
                  'EMPLOYEE',
                  'HOD',
                  'HOF',
                  'COF',
                  'CFT',
                  'CFT_LEADER',
                  'PLANT_HEAD',
                  'ADMIN',
                ] as const
              ).map((r) => (
                <option key={r} value={r}>
                  {RoleDisplayLabel(r)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="user-dept" className="field-label">
              Department
            </label>
            <input
              id="user-dept"
              type="text"
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="user-email" className="field-label">
              Email (Optional)
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@sakthiauto.com"
              className="field-input"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary"
            >
              <UserPlus className="w-4 h-4" />
              <span>{submitting ? 'Creating...' : 'Create Account'}</span>
            </button>
          </div>
        </div>
      </form>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#5C6470] uppercase tracking-wider">
                <th className="h-10 px-6">Username / ID</th>
                <th className="h-10 px-4">Name</th>
                <th className="h-10 px-4">Company / Unit</th>
                <th className="h-10 px-4">Role</th>
                <th className="h-10 px-4">Department</th>
                <th className="h-10 px-6">Facility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {users.map((u) => {
                const matchedCompany = u.companyId
                  ? companies.find((c) => c.id === u.companyId)
                  : undefined;
                return (
                  <tr key={u.id} className="hover:bg-[#F8F9FB] transition-colors">
                    <td className="py-4 px-6 font-mono text-xs font-bold text-[#111318] whitespace-nowrap">
                      {u.username || u.employeeId}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-[#111318]">{u.name}</p>
                      <p className="text-xs text-[#5C6470] mt-1">{u.email}</p>
                    </td>
                    <td className="py-4 px-4 text-xs text-[#111318]">
                      {matchedCompany ? (
                        <div>
                          <span className="font-mono font-bold text-[#D97700]">{matchedCompany.code}</span>
                          <p className="text-xs text-[#5C6470] mt-1">{matchedCompany.name}</p>
                        </div>
                      ) : u.companyCode ? (
                        <span className="font-mono font-bold text-[#D97700]">{u.companyCode}</span>
                      ) : (
                        <span className="text-[#5C6470]">Corporate / All Units</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs font-bold text-[#D97700] whitespace-nowrap">
                      {RoleDisplayLabel(u.role)}
                    </td>
                    <td className="py-4 px-4 text-xs text-[#5C6470]">{u.department}</td>
                    <td className="py-4 px-6 text-xs text-[#5C6470]">{u.facility}</td>
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

export function CompaniesPage({
  companies,
  users,
  parts,
  currentUser,
  onCreateCompany,
  onViewCompany,
}: {
  companies: CompanyRecord[];
  users: UserAccount[];
  parts: PartMasterRecord[];
  currentUser: UserAccount;
  onCreateCompany: (payload: CreateCompanyPayload) => Promise<void>;
  onViewCompany: (companyId: string) => void;
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [facilityType, setFacilityType] = useState<CompanyRecord['facilityType']>('Machine Shop');
  const [location, setLocation] = useState('');
  const [gstOrRegNo, setGstOrRegNo] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  // Optional initial individual login account during company registration
  const [createInitialAcc, setCreateInitialAcc] = useState(true);
  const [initUsername, setInitUsername] = useState('');
  const [initFullName, setInitFullName] = useState('');
  const [initPassword, setInitPassword] = useState('');
  const [initRole, setInitRole] = useState<UserRole>('COMPANY_USER');
  const [showInitPassword, setShowInitPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="surface-card p-8 text-center space-y-2">
        <Building2 className="w-8 h-8 text-[#F28C00] mx-auto" />
        <h2 className="text-lg font-bold text-[#111318]">Administrator Access Required</h2>
        <p className="text-sm text-[#5C6470]">
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
    if (createInitialAcc) {
      if (!initUsername.trim() || !initFullName.trim() || !initPassword.trim()) {
        setError(
          'Individual Company Account Username, Account Holder Name, and Password are required (or uncheck account creation).',
        );
        return;
      }
      if (initPassword.trim().length < 4) {
        setError('Account Password must be at least 4 characters long.');
        return;
      }
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
        ...(createInitialAcc
          ? {
              initialAccount: {
                username: initUsername.trim(),
                name: initFullName.trim(),
                email: contactEmail.trim() || undefined,
                password: initPassword.trim(),
                role: initRole,
                department: unitName.trim() || facilityType,
              },
            }
          : {}),
      });
      setSuccess(
        createInitialAcc
          ? `Added ${name.trim()} (${code.trim().toUpperCase()}) with login account "${initUsername.trim()}" (${RoleDisplayLabel(initRole)}).`
          : `Added ${name.trim()} (${code.trim().toUpperCase()}).`,
      );
      setCode('');
      setName('');
      setUnitName('');
      setLocation('');
      setGstOrRegNo('');
      setContactEmail('');
      setInitUsername('');
      setInitFullName('');
      setInitPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add company');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-[#111318] tracking-tight">
          Companies &amp; Individual Login Accounts
        </h2>
        <p className="text-sm text-[#5C6470]">
          Register Sakthi Auto group companies/units and provision individual username &amp; password accounts with JWT role-based access.
        </p>
      </div>

      {/* Add Company + Optional Individual Account Form */}
      <form onSubmit={handleSubmit} className="surface-card p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-[#E4E7EC] pb-4">
          <Building2 className="w-4 h-4 text-[#F28C00]" />
          <h3 className="text-sm font-bold text-[#111318]">Add New Company / Plant Unit</h3>
        </div>

        {error && (
          <div
            role="alert"
            className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            role="status"
            className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold"
          >
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="comp-code" className="field-label">
              Company Code *
            </label>
            <input
              id="comp-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="SACL-PUNE"
              className="field-input font-mono"
            />
          </div>
          <div className="lg:col-span-2">
            <label htmlFor="comp-name" className="field-label">
              Company Name *
            </label>
            <input
              id="comp-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sakthi Auto Precision Components Ltd."
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="comp-facility" className="field-label">
              Facility Scope
            </label>
            <select
              id="comp-facility"
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
            <label htmlFor="comp-unit" className="field-label">
              Unit / Division Name
            </label>
            <input
              id="comp-unit"
              type="text"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="CNC Machine Shop Unit II"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="comp-location" className="field-label">
              Plant Location *
            </label>
            <input
              id="comp-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Pollachi / Coimbatore, TN"
              className="field-input"
            />
          </div>
          <div>
            <label htmlFor="comp-gst" className="field-label">
              GST / Plant Reg. No.
            </label>
            <input
              id="comp-gst"
              type="text"
              value={gstOrRegNo}
              onChange={(e) => setGstOrRegNo(e.target.value)}
              placeholder="33AAACS8812N1Z4"
              className="field-input font-mono"
            />
          </div>
          <div>
            <label htmlFor="comp-email" className="field-label">
              Contact Email
            </label>
            <input
              id="comp-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="plant@sakthiauto.com"
              className="field-input"
            />
          </div>
        </div>

        {/* Flattened Individual Company Account Provisioning (no nested border) */}
        <div className="pt-6 border-t border-[#E4E7EC]">
          <div className="rounded-lg bg-[#F8F9FB] p-6 space-y-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={createInitialAcc}
                onChange={(e) => setCreateInitialAcc(e.target.checked)}
                className="w-4 h-4 accent-[#F28C00] cursor-pointer"
              />
              <KeyRound className="w-4 h-4 text-[#F28C00]" />
              <span className="text-xs font-bold text-[#111318]">
                Create Individual Login Account (Username &amp; Password) for this Company
              </span>
            </label>

            {createInitialAcc && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="comp-acc-username" className="field-label">
                    Account Username *
                  </label>
                  <input
                    id="comp-acc-username"
                    type="text"
                    value={initUsername}
                    onChange={(e) => setInitUsername(e.target.value)}
                    placeholder="e.g., pune_hod"
                    className="field-input font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="comp-acc-name" className="field-label">
                    Account Holder Name *
                  </label>
                  <input
                    id="comp-acc-name"
                    type="text"
                    value={initFullName}
                    onChange={(e) => setInitFullName(e.target.value)}
                    placeholder="e.g., R. Sundaram"
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="comp-acc-password" className="field-label">
                    Password *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="comp-acc-password"
                      type={showInitPassword ? 'text' : 'password'}
                      value={initPassword}
                      onChange={(e) => setInitPassword(e.target.value)}
                      placeholder="Set login password"
                      className="field-input !pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showInitPassword ? 'Hide initial password' : 'Show initial password'}
                      onClick={() => setShowInitPassword((prev) => !prev)}
                      className="absolute right-2 w-8 h-8 flex items-center justify-center text-[#5C6470] hover:text-[#111318] cursor-pointer"
                    >
                      {showInitPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="comp-acc-role" className="field-label">
                    JWT Role Access
                  </label>
                  <select
                    id="comp-acc-role"
                    value={initRole}
                    onChange={(e) => setInitRole(e.target.value as UserRole)}
                    className="field-input"
                  >
                    {(
                      [
                        'COMPANY_USER',
                        'EMPLOYEE',
                        'HOD',
                        'HOF',
                        'COF',
                        'CFT',
                        'CFT_LEADER',
                        'PLANT_HEAD',
                        'ADMIN',
                      ] as const
                    ).map((r) => (
                      <option key={r} value={r}>
                        {RoleDisplayLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="btn-primary">
            <Plus className="w-4 h-4" />
            <span>
              {submitting
                ? 'Saving...'
                : createInitialAcc
                ? 'Add Company & Create Account'
                : 'Add Company'}
            </span>
          </button>
        </div>
      </form>

      {/* Registered Companies & Linked Accounts Table */}
      <div className="surface-card overflow-hidden">
        <div className="surface-header flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-bold text-[#111318] tabular-nums">
            Registered Companies ({companies.length})
          </span>
          <span className="text-xs text-[#5C6470]">
            Double-click any company row or click <strong className="text-[#111318]">View</strong> to manage users, passwords &amp; manufactured parts.
          </span>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-bold text-[#5C6470] uppercase tracking-wider">
                <th className="h-10 px-6">Code</th>
                <th className="h-10 px-4">Company &amp; Unit</th>
                <th className="h-10 px-4">Facility Type</th>
                <th className="h-10 px-4">Location</th>
                <th className="h-10 px-4">Linked Accounts</th>
                <th className="h-10 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {companies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-6 text-center text-xs text-[#5C6470]">
                    No companies registered in the database yet. Use the form above to add a plant unit and create its individual login account.
                  </td>
                </tr>
              ) : (
                companies.map((c) => {
                  const companyAccounts = users.filter((u) => u.companyId === c.id);
                  const companyPartsCount = parts.filter((pt) => pt.companyId === c.id).length;
                  return (
                    <tr
                      key={c.id}
                      onDoubleClick={() => onViewCompany(c.id)}
                      title={`Double-click to view ${c.code} details, users & manufactured parts`}
                      className="hover:bg-[#F8F9FB] cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-6 font-mono text-xs font-bold text-[#D97700] whitespace-nowrap">
                        {c.code}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-[#111318]">{c.name}</p>
                        <p className="text-xs text-[#5C6470] mt-0.5">
                          {c.unitName}
                          {companyPartsCount > 0 && (
                            <span className="ml-2 font-mono text-[11px] text-[#D97700] font-semibold tabular-nums">
                              · {companyPartsCount} manufactured {companyPartsCount === 1 ? 'part' : 'parts'}
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-[#111318]">{c.facilityType}</td>
                      <td className="py-4 px-4 text-xs text-[#5C6470]">{c.location}</td>
                      <td className="py-4 px-4">
                        {companyAccounts.length === 0 ? (
                          <span className="text-xs text-[#8C95A4]">No individual accounts yet</span>
                        ) : (
                          <div className="space-y-1">
                            {companyAccounts.map((acc) => (
                              <div key={acc.id} className="text-xs flex items-center gap-2">
                                <span className="font-mono font-bold text-[#111318]">
                                  {acc.username || acc.employeeId}
                                </span>
                                <span className="text-[11px] text-[#D97700] font-semibold">
                                  ({RoleDisplayLabel(acc.role)})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          aria-label={`View company ${c.code}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewCompany(c.id);
                          }}
                          className="btn-compact"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function DepartmentsPage({
  departments,
  currentUser,
  onCreateDepartment,
}: {
  departments: DepartmentRecord[];
  currentUser?: UserAccount;
  onCreateDepartment?: (payload: {
    code: string;
    name: string;
    facility: DepartmentRecord['facility'];
    hodName: string;
    memberCount: number;
  }) => Promise<void>;
}) {
  const canManage =
    !!onCreateDepartment &&
    !!currentUser &&
    ['ADMIN', 'COF', 'PLANT_HEAD'].includes(currentUser.role);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [facility, setFacility] = useState<DepartmentRecord['facility']>('Machine Shop');
  const [hodName, setHodName] = useState('');
  const [memberCount, setMemberCount] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleAddDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!onCreateDepartment) return;
    if (!code.trim() || !name.trim()) {
      setError('Department Code and Department Name are required.');
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await onCreateDepartment({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        facility,
        hodName: hodName.trim(),
        memberCount: Math.max(0, Number(memberCount) || 0),
      });
      setSuccess(`Added department "${name.trim()}" (${code.trim().toUpperCase()}) to database.`);
      setCode('');
      setName('');
      setHodName('');
      setMemberCount('0');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save department');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-[#111318] tracking-tight">Departments &amp; CFT Units</h2>
        <p className="text-sm text-[#5C6470]">
          Live department and Cross-Functional Team (CFT) units stored in the database.
        </p>
      </div>

      {canManage && (
        <form onSubmit={handleAddDepartment} className="surface-card p-6 space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-[#E4E7EC]">
            <Plus className="w-4 h-4 text-[#F28C00]" />
            <h3 className="text-sm font-bold text-[#111318]">Add Department / CFT Unit</h3>
          </div>
          {error && (
            <div
              role="alert"
              className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
            >
              {error}
            </div>
          )}
          {success && (
            <div
              role="status"
              className="px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold"
            >
              {success}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label htmlFor="dept-code" className="field-label">
                Dept Code *
              </label>
              <input
                id="dept-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g., MSH"
                className="field-input font-mono"
              />
            </div>
            <div>
              <label htmlFor="dept-name" className="field-label">
                Department Name *
              </label>
              <input
                id="dept-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Department Name"
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="dept-facility" className="field-label">
                Facility
              </label>
              <select
                id="dept-facility"
                value={facility}
                onChange={(e) => setFacility(e.target.value as DepartmentRecord['facility'])}
                className="field-input"
              >
                <option value="Machine Shop">Machine Shop</option>
                <option value="Foundry">Foundry</option>
                <option value="Quality">Quality</option>
                <option value="Corporate">Corporate</option>
              </select>
            </div>
            <div>
              <label htmlFor="dept-hod" className="field-label">
                HOD Name
              </label>
              <input
                id="dept-hod"
                type="text"
                value={hodName}
                onChange={(e) => setHodName(e.target.value)}
                placeholder="Head of Department"
                className="field-input"
              />
            </div>
            <div>
              <label htmlFor="dept-members" className="field-label">
                Members
              </label>
              <input
                id="dept-members"
                type="number"
                min={0}
                value={memberCount}
                onChange={(e) => setMemberCount(e.target.value)}
                className="field-input font-mono tabular-nums"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="btn-primary">
              <Plus className="w-4 h-4" />
              <span>{submitting ? 'Saving...' : 'Add Department'}</span>
            </button>
          </div>
        </form>
      )}

      {departments.length === 0 ? (
        <div className="surface-card p-12 text-center space-y-2">
          <p className="text-sm font-bold text-[#111318]">No Departments Recorded</p>
          <p className="text-xs text-[#5C6470]">
            Add departments above so engineers can select them when raising Change Requests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {departments.map((d) => (
            <div key={d.id} className="surface-card p-6 space-y-2">
              <div className="flex justify-between items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#D97700]">{d.code}</span>
                <span className="text-xs text-[#5C6470]">{d.facility}</span>
              </div>
              <h3 className="text-base font-bold text-[#111318]">{d.name}</h3>
              <p className="text-xs text-[#5C6470] tabular-nums">
                HOD: <strong className="text-[#111318]">{d.hodName || 'Unassigned'}</strong> · {d.memberCount} members
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CustomersPartsPage({
  customers,
  parts,
  currentUser,
  onCreateCustomer,
  onCreatePart,
}: {
  customers: CustomerRecord[];
  parts: PartMasterRecord[];
  currentUser?: UserAccount;
  onCreateCustomer?: (payload: {
    code: string;
    name: string;
    location: string;
    contactPerson: string;
  }) => Promise<void>;
  onCreatePart?: (payload: {
    partNumber: string;
    partName: string;
    customer: string;
    facility: PartMasterRecord['facility'];
    currentRevision: string;
  }) => Promise<void>;
}) {
  const canManage =
    !!currentUser && ['ADMIN', 'CFT_LEADER', 'COF'].includes(currentUser.role);

  const [custCode, setCustCode] = useState('');
  const [custName, setCustName] = useState('');
  const [custLocation, setCustLocation] = useState('');
  const [custContact, setCustContact] = useState('');
  const [custSaving, setCustSaving] = useState(false);
  const [custMsg, setCustMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [partNo, setPartNo] = useState('');
  const [partName, setPartName] = useState('');
  const [partCustomer, setPartCustomer] = useState('');
  const [partFacility, setPartFacility] = useState<PartMasterRecord['facility']>('Machine Shop');
  const [partRev, setPartRev] = useState('Rev 01');
  const [partSaving, setPartSaving] = useState(false);
  const [partMsg, setPartMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!onCreateCustomer) return;
    if (!custCode.trim() || !custName.trim()) {
      setCustMsg({ type: 'error', text: 'Customer Code and Customer Name are required.' });
      return;
    }
    setCustSaving(true);
    setCustMsg(null);
    try {
      await onCreateCustomer({
        code: custCode.trim().toUpperCase(),
        name: custName.trim(),
        location: custLocation.trim(),
        contactPerson: custContact.trim(),
      });
      setCustMsg({ type: 'success', text: `Added customer "${custName.trim()}" to database.` });
      setCustCode('');
      setCustName('');
      setCustLocation('');
      setCustContact('');
    } catch (err) {
      setCustMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save customer',
      });
    } finally {
      setCustSaving(false);
    }
  }

  async function handleAddPart(e: React.FormEvent) {
    e.preventDefault();
    if (!onCreatePart) return;
    if (!partNo.trim() || !partName.trim()) {
      setPartMsg({ type: 'error', text: 'Part Number and Part Name are required.' });
      return;
    }
    setPartSaving(true);
    setPartMsg(null);
    try {
      await onCreatePart({
        partNumber: partNo.trim(),
        partName: partName.trim(),
        customer: partCustomer.trim(),
        facility: partFacility,
        currentRevision: partRev.trim() || 'Rev 01',
      });
      setPartMsg({ type: 'success', text: `Added part "${partNo.trim()}" to database.` });
      setPartNo('');
      setPartName('');
      setPartCustomer('');
      setPartRev('Rev 01');
    } catch (err) {
      setPartMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save part',
      });
    } finally {
      setPartSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-[#111318] tracking-tight">Customers &amp; Parts Master</h2>
        <p className="text-sm text-[#5C6470]">
          Real OEM customers and part numbers stored in the database.
        </p>
      </div>

      {canManage && onCreateCustomer && onCreatePart && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form onSubmit={handleAddCustomer} className="surface-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#111318] pb-4 border-b border-[#E4E7EC]">
              Add OEM Customer
            </h3>
            {custMsg && (
              <div
                role={custMsg.type === 'error' ? 'alert' : 'status'}
                className={`px-4 py-3 rounded-lg text-xs font-semibold border ${
                  custMsg.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {custMsg.text}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cust-code" className="field-label">
                  Customer Code *
                </label>
                <input
                  id="cust-code"
                  type="text"
                  value={custCode}
                  onChange={(e) => setCustCode(e.target.value)}
                  placeholder="e.g., OEM01"
                  className="field-input font-mono"
                />
              </div>
              <div>
                <label htmlFor="cust-name" className="field-label">
                  Customer Name *
                </label>
                <input
                  id="cust-name"
                  type="text"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="OEM Customer Name"
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="cust-loc" className="field-label">
                  Location
                </label>
                <input
                  id="cust-loc"
                  type="text"
                  value={custLocation}
                  onChange={(e) => setCustLocation(e.target.value)}
                  placeholder="City / Plant"
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="cust-contact" className="field-label">
                  Contact Person
                </label>
                <input
                  id="cust-contact"
                  type="text"
                  value={custContact}
                  onChange={(e) => setCustContact(e.target.value)}
                  placeholder="SQA / Buyer Contact"
                  className="field-input"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={custSaving} className="btn-primary">
                <Plus className="w-4 h-4" />
                <span>{custSaving ? 'Saving...' : 'Add Customer'}</span>
              </button>
            </div>
          </form>

          <form onSubmit={handleAddPart} className="surface-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#111318] pb-4 border-b border-[#E4E7EC]">
              Add Part to Master
            </h3>
            {partMsg && (
              <div
                role={partMsg.type === 'error' ? 'alert' : 'status'}
                className={`px-4 py-3 rounded-lg text-xs font-semibold border ${
                  partMsg.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {partMsg.text}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="part-no" className="field-label">
                  Part Number *
                </label>
                <input
                  id="part-no"
                  type="text"
                  value={partNo}
                  onChange={(e) => setPartNo(e.target.value)}
                  placeholder="e.g., PT-1001"
                  className="field-input font-mono"
                />
              </div>
              <div>
                <label htmlFor="part-name" className="field-label">
                  Part Name *
                </label>
                <input
                  id="part-name"
                  type="text"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="Component Description"
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="part-cust" className="field-label">
                  Customer
                </label>
                {customers.length > 0 ? (
                  <select
                    id="part-cust"
                    value={partCustomer}
                    onChange={(e) => setPartCustomer(e.target.value)}
                    className="field-input"
                  >
                    <option value="">Select customer (optional)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="part-cust"
                    type="text"
                    value={partCustomer}
                    onChange={(e) => setPartCustomer(e.target.value)}
                    placeholder="OEM Customer Name"
                    className="field-input"
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="part-facility" className="field-label">
                    Facility
                  </label>
                  <select
                    id="part-facility"
                    value={partFacility}
                    onChange={(e) => setPartFacility(e.target.value as PartMasterRecord['facility'])}
                    className="field-input"
                  >
                    <option value="Machine Shop">Machine Shop</option>
                    <option value="Foundry">Foundry</option>
                    <option value="Foundry & Machine Shop">Foundry &amp; Machine Shop</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="part-rev" className="field-label">
                    Revision
                  </label>
                  <input
                    id="part-rev"
                    type="text"
                    value={partRev}
                    onChange={(e) => setPartRev(e.target.value)}
                    placeholder="Rev 01"
                    className="field-input font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={partSaving} className="btn-dark">
                <Plus className="w-4 h-4" />
                <span>{partSaving ? 'Saving...' : 'Add Part'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface-card overflow-hidden">
          <div className="surface-header text-xs font-bold uppercase tracking-wider text-[#111318] tabular-nums">
            OEM Customers ({customers.length})
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-[#E4E7EC]">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 px-6 text-center text-[#5C6470]">
                      No OEM customers in the database yet.
                    </td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F8F9FB] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#D97700] whitespace-nowrap">{c.code}</td>
                      <td className="py-4 px-4 font-bold text-[#111318]">{c.name}</td>
                      <td className="py-4 px-4 text-[#5C6470]">{c.location}</td>
                      <td className="py-4 px-6 text-[#111318]">{c.contactPerson}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="surface-header text-xs font-bold uppercase tracking-wider text-[#111318] tabular-nums">
            Parts Master ({parts.length})
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <tbody className="divide-y divide-[#E4E7EC]">
                {parts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 px-6 text-center text-[#5C6470]">
                      No parts in the database yet.
                    </td>
                  </tr>
                ) : (
                  parts.map((pt) => (
                    <tr key={pt.id} className="hover:bg-[#F8F9FB] transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-[#111318] whitespace-nowrap">
                        <div>{pt.partNumber}</div>
                        {pt.drawingNumber && (
                          <div className="text-[11px] font-normal text-[#5C6470] mt-0.5">
                            Drg: {pt.drawingNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-[#111318]">{pt.partName}</div>
                        {(pt.materialGrade || pt.processType) && (
                          <div className="text-[11px] text-[#5C6470] mt-0.5">
                            {[pt.materialGrade, pt.processType].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-[#5C6470]">{pt.customer}</td>
                      <td className="py-4 px-6 font-mono text-[#D97700] whitespace-nowrap">{pt.currentRevision}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuditLogsPage({ auditLogs }: { auditLogs: AuditLogItem[] }) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-[#111318] tracking-tight">System Audit Logs</h2>
        <p className="text-sm text-[#5C6470]">
          Immutable compliance trail of all workflow transitions and approvals.
        </p>
      </div>
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-bold text-[#5C6470] uppercase tracking-wider">
                <th className="h-10 px-6">Timestamp</th>
                <th className="h-10 px-4">Actor</th>
                <th className="h-10 px-4">Entity</th>
                <th className="h-10 px-4">Action</th>
                <th className="h-10 px-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 px-6 text-center text-[#5C6470]">
                    No audit events recorded in the database yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#F8F9FB] transition-colors">
                    <td className="py-4 px-6 font-mono text-[#5C6470] whitespace-nowrap tabular-nums">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-semibold text-[#111318]">
                      {log.actorName} ({log.actorRole})
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-[#D97700] whitespace-nowrap">
                      {log.entityId}
                    </td>
                    <td className="py-4 px-4 font-mono text-[#111318]">{log.action}</td>
                    <td className="py-4 px-6 text-[#5C6470]">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const [autoSync, setAutoSync] = useState(true);
  const [enforcePtrGate, setEnforcePtrGate] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-[#111318] tracking-tight">System Settings</h2>
        <p className="text-sm text-[#5C6470]">Configure workflow gating and form interconnection rules.</p>
      </div>
      <div className="surface-card p-6 space-y-6">
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#111318]">Auto-Sync PCRF Metadata Across Forms 2–7</p>
            <p className="text-xs text-[#5C6470]">Propagates Part Name, Part No, Customer &amp; Department automatically.</p>
          </div>
          <input
            type="checkbox"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
            className="w-4 h-4 accent-[#F28C00]"
          />
        </label>
        <label className="flex items-center justify-between gap-4 pt-6 border-t border-[#E4E7EC] cursor-pointer">
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#111318]">Enforce Sequential PTR 1 → PTR 2 → PTR 3 Gate</p>
            <p className="text-xs text-[#5C6470]">Requires OK sign-off on PTR 1 before unlocking PTR 2 (25 Nos) and PTR 3 (50 Nos).</p>
          </div>
          <input
            type="checkbox"
            checked={enforcePtrGate}
            onChange={(e) => setEnforcePtrGate(e.target.checked)}
            className="w-4 h-4 accent-[#F28C00]"
          />
        </label>
        <div className="pt-4 border-t border-[#E4E7EC] flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setSavedMsg(true);
              setTimeout(() => setSavedMsg(false), 2500);
            }}
            className="btn-primary"
          >
            Save Preferences
          </button>
          {savedMsg && <span className="text-xs font-semibold text-emerald-700">Preferences saved.</span>}
        </div>
      </div>
    </div>
  );
}
