import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import type {
  ChangeCategoryType,
  Classification4M,
  CompanyRecord,
  CustomerRecord,
  DepartmentRecord,
  FacilityScope,
  PartMasterRecord,
  UserAccount,
} from '../types/pcms';
import { PARTICULARS_DROPDOWN_OPTIONS } from '../utils/workflow';
import { RoleDisplayLabel } from './ui/StatusBadge';

interface CreatePCRFPageProps {
  user: UserAccount;
  companies: CompanyRecord[];
  departments: DepartmentRecord[];
  customers: CustomerRecord[];
  parts: PartMasterRecord[];
  onCancel: () => void;
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
}

const LINKED_OFFICIAL_FORMS = [
  { code: 'QF/07/MRO-15', title: 'Process Change Requisition Form (PCRF)' },
  { code: 'QF/07/MRO-02', title: 'Feasibility Report for Change Request' },
  { code: 'QF/07/MKT-14', title: 'Risk Analysis Check Sheet (4M + QCD)' },
  { code: 'QF/07/MKT-08', title: 'Timing Plan (APQP Phase I)' },
  { code: 'QF/07/MRO-03', title: 'Change Management Checklist (4 Pages)' },
  { code: 'QF/07/MRO-16', title: 'PTR Initiation Form (PTR 1 / 2 / 3)' },
  { code: 'QF/07/MRO-05', title: 'PPAP Initiation & Production Report' },
];

export function CreatePCRFPage({
  user,
  companies,
  departments,
  customers,
  parts,
  onCancel,
  onCreate,
}: CreatePCRFPageProps) {
  const defaultCompany =
    (user.companyId ? companies.find((c) => c.id === user.companyId) : undefined) ||
    companies[0];

  const [companyId, setCompanyId] = useState(defaultCompany?.id || 'comp-1');
  const [customer, setCustomer] = useState(customers[0]?.name || 'Tata Motors Ltd.');
  const [selectedPartNo, setSelectedPartNo] = useState(parts[0]?.partNumber || 'SA-SK-4410');
  const [partName, setPartName] = useState(parts[0]?.partName || 'Steering Knuckle LH');
  const [partNo, setPartNo] = useState(parts[0]?.partNumber || 'SA-SK-4410');
  const [department, setDepartment] = useState(
    departments.some((d) => d.name === user.department)
      ? user.department
      : departments[0]?.name || 'Machine Shop',
  );
  const [changeType, setChangeType] = useState<ChangeCategoryType>('Process');
  const [facilityScope, setFacilityScope] = useState<FacilityScope>(
    defaultCompany?.facilityType === 'Foundry'
      ? 'Foundry'
      : defaultCompany?.facilityType === 'Foundry & Machine Shop'
      ? 'Foundry & Machine Shop'
      : 'Machine Shop',
  );
  const [classifications, setClassifications] = useState<Classification4M[]>(['Method']);
  const [particulars, setParticulars] = useState(PARTICULARS_DROPDOWN_OPTIONS[0]);
  const [currentStatus, setCurrentStatus] = useState('');
  const [changeRequired, setChangeRequired] = useState('');
  const [reasonForChange, setReasonForChange] = useState('');
  const [priority, setPriority] = useState<'Critical' | 'High' | 'Normal'>('High');
  const [dueDate, setDueDate] = useState('2027-01-15');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCompany = companies.find((c) => c.id === companyId);

  function handlePartPick(pNum: string) {
    setSelectedPartNo(pNum);
    const found = parts.find((p) => p.partNumber === pNum);
    if (found) {
      setPartName(found.partName);
      setPartNo(found.partNumber);
      setCustomer(found.customer);
      setFacilityScope(found.facility);
    }
  }

  function handleCompanyPick(compId: string) {
    setCompanyId(compId);
    const comp = companies.find((c) => c.id === compId);
    if (comp) {
      if (comp.facilityType === 'Machine Shop') setFacilityScope('Machine Shop');
      else if (comp.facilityType === 'Foundry') setFacilityScope('Foundry');
      else if (comp.facilityType === 'Foundry & Machine Shop') {
        setFacilityScope('Foundry & Machine Shop');
      }
    }
  }

  function toggleClassification(c: Classification4M) {
    setClassifications((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partName.trim() || !partNo.trim() || !reasonForChange.trim()) {
      setError('Part Name, Part Number, and Reason for Change are required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onCreate({
        companyId,
        companyName: selectedCompany
          ? `${selectedCompany.name} — ${selectedCompany.unitName}`
          : undefined,
        title: `${partName.trim()} — ${particulars}`,
        priority,
        createdBy: user.name,
        createdByEmployeeId: user.employeeId,
        department,
        customer,
        partName: partName.trim(),
        partNo: partNo.trim(),
        changeType,
        facilityScope,
        classifications: classifications.length ? classifications : ['Method'],
        reasonForChange: reasonForChange.trim(),
        particulars,
        currentStatus: currentStatus.trim() || 'Baseline process state',
        changeRequired: changeRequired.trim() || reasonForChange.trim(),
        dueDate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Change Request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="mt-0.5 p-2 rounded-lg border border-[#E6E6E6] bg-white hover:bg-[#F7F7F7] text-[#151515] transition-colors cursor-pointer"
            aria-label="Back to Change Requests"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#E87500]">
              QF/07/MRO-15 · Stage 1 Requisition
            </p>
            <h2 className="text-2xl font-extrabold text-[#151515] mt-0.5">
              Create New 4M Change Request (PCRF)
            </h2>
            <p className="text-sm text-[#666666]">
              Raise a new change requisition and automatically link all 7 interconnected Sakthi Auto consultancy forms.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="self-start sm:self-auto px-4 py-2 rounded-lg border border-[#E6E6E6] bg-white text-xs font-semibold text-[#151515] hover:bg-[#F7F7F7] cursor-pointer"
        >
          Back to Change Requests
        </button>
      </div>

      {/* Main 12-Column Workspace Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Structured Requisition Form */}
        <div className="xl:col-span-8 space-y-5">
          {error && (
            <div
              role="alert"
              className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
            >
              {error}
            </div>
          )}

          {/* Section 1: Company, Part & Customer */}
          <section className="bg-white border border-[#E6E6E6] rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E6E6E6]">
              <Building2 className="w-4 h-4 text-[#F28C00]" />
              <h3 className="text-sm font-bold text-[#151515]">
                1. Company Unit &amp; Component Identification
              </h3>
            </div>

            <div>
              <label htmlFor="pcrf-company" className="block text-xs font-semibold text-[#151515] mb-1.5">
                Company / Plant Unit
              </label>
              <select
                id="pcrf-company"
                value={companyId}
                onChange={(e) => handleCompanyPick(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-[#E6E6E6] rounded-lg bg-white focus:outline-none focus:border-[#F28C00]"
              >
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.code} — {comp.name} ({comp.unitName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pcrf-part-select" className="block text-xs font-semibold text-[#151515] mb-1.5">
                  Select Master Part
                </label>
                <select
                  id="pcrf-part-select"
                  value={selectedPartNo}
                  onChange={(e) => handlePartPick(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E6E6E6] rounded-lg bg-white focus:outline-none focus:border-[#F28C00]"
                >
                  {parts.map((pt) => (
                    <option key={pt.id} value={pt.partNumber}>
                      {pt.partNumber} — {pt.partName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pcrf-customer" className="block text-xs font-semibold text-[#151515] mb-1.5">
                  Customer
                </label>
                <select
                  id="pcrf-customer"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E6E6E6] rounded-lg bg-white focus:outline-none focus:border-[#F28C00]"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pcrf-part-name" className="block text-xs font-semibold text-[#151515] mb-1.5">
                  Part Name *
                </label>
                <input
                  id="pcrf-part-name"
                  type="text"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
                />
              </div>

              <div>
                <label htmlFor="pcrf-part-no" className="block text-xs font-semibold text-[#151515] mb-1.5">
                  Part Number *
                </label>
                <input
                  id="pcrf-part-no"
                  type="text"
                  value={partNo}
                  onChange={(e) => setPartNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
                />
              </div>

              <div>
                <label htmlFor="pcrf-dept" className="block text-xs font-semibold text-[#151515] mb-1.5">
                  Department
                </label>
                <select
                  id="pcrf-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E6E6E6] rounded-lg bg-white focus:outline-none focus:border-[#F28C00]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pcrf-priority" className="block text-xs font-semibold text-[#151515] mb-1.5">
                  Priority
                </label>
                <select
                  id="pcrf-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'Critical' | 'High' | 'Normal')}
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E6E6E6] rounded-lg bg-white focus:outline-none focus:border-[#F28C00]"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Change Scope & 4M Classification */}
          <section className="bg-white border border-[#E6E6E6] rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E6E6E6]">
              <Layers className="w-4 h-4 text-[#F28C00]" />
              <h3 className="text-sm font-bold text-[#151515]">
                2. Change Type, Facility Scope &amp; 4M Classification
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-semibold text-[#151515] mb-2">
                  Change Type
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['Process', 'Product'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={changeType === t}
                      onClick={() => setChangeType(t)}
                      className={`py-2.5 px-3 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        changeType === t
                          ? 'bg-[#151515] text-white border-[#151515]'
                          : 'bg-white text-[#151515] border-[#E6E6E6] hover:bg-[#F7F7F7]'
                      }`}
                    >
                      {t} Change
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#151515] mb-2">
                  Facility Scope (F / M / F&amp;M)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Machine Shop', 'Foundry', 'Foundry & Machine Shop'] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      aria-pressed={facilityScope === scope}
                      onClick={() => setFacilityScope(scope)}
                      className={`py-2.5 px-2.5 rounded-lg text-xs font-semibold border cursor-pointer whitespace-nowrap transition-colors ${
                        facilityScope === scope
                          ? 'bg-[#F28C00] text-white border-[#F28C00]'
                          : 'bg-white text-[#151515] border-[#E6E6E6] hover:bg-[#F7F7F7]'
                      }`}
                    >
                      {scope === 'Foundry & Machine Shop' ? 'F & M' : scope}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#151515] mb-2">
                4M Classification (Select one or more)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['Man', 'Machine', 'Material', 'Method'] as const).map((c) => {
                  const active = classifications.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleClassification(c)}
                      className={`py-2.5 px-3.5 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#FFF4E5] border-[#F28C00] text-[#E87500]'
                          : 'bg-white border-[#E6E6E6] text-[#666666] hover:bg-[#F7F7F7]'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Section 3: Particulars & Technical Justification */}
          <section className="bg-white border border-[#E6E6E6] rounded-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E6E6E6]">
              <FileText className="w-4 h-4 text-[#F28C00]" />
              <h3 className="text-sm font-bold text-[#151515]">
                3. Change Particulars &amp; Engineering Justification
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pcrf-particulars" className="block text-xs font-semibold text-[#151515] mb-1.5">
                  Particulars
                </label>
                <select
                  id="pcrf-particulars"
                  value={particulars}
                  onChange={(e) => setParticulars(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E6E6E6] rounded-lg bg-white focus:outline-none focus:border-[#F28C00]"
                >
                  {PARTICULARS_DROPDOWN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pcrf-due-date" className="block text-xs font-semibold text-[#151515] mb-1.5">
                  Target Due Date
                </label>
                <input
                  id="pcrf-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
                />
              </div>

              <div>
                <label htmlFor="pcrf-current-status" className="block text-xs font-semibold text-[#151515] mb-1.5">
                  Current Status
                </label>
                <input
                  id="pcrf-current-status"
                  type="text"
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  placeholder="e.g., Current CNC tooling / cycle time"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
                />
              </div>

              <div>
                <label htmlFor="pcrf-change-req" className="block text-xs font-semibold text-[#151515] mb-1.5">
                  Change Required
                </label>
                <input
                  id="pcrf-change-req"
                  type="text"
                  value={changeRequired}
                  onChange={(e) => setChangeRequired(e.target.value)}
                  placeholder="e.g., Proposed machining fixture / insert"
                  className="w-full px-3.5 py-2.5 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pcrf-reason" className="block text-xs font-semibold text-[#151515] mb-1.5">
                Reason for Change Required *
              </label>
              <textarea
                id="pcrf-reason"
                rows={4}
                value={reasonForChange}
                onChange={(e) => setReasonForChange(e.target.value)}
                placeholder="Explain engineering, quality, cost, cycle time, or customer justification..."
                className="w-full px-3.5 py-2.5 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
              />
            </div>

            <div className="pt-3 border-t border-[#E6E6E6] flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-lg border border-[#E6E6E6] text-sm font-semibold text-[#151515] hover:bg-[#F7F7F7] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-sm font-bold cursor-pointer disabled:opacity-60 shadow-sm"
              >
                {submitting ? 'Creating & Linking Forms...' : 'Raise PCRF & Link Forms'}
              </button>
            </div>
          </section>
        </div>

        {/* Right 4 Columns: Live Summary & Auto-Linked 7 Consultancy Forms */}
        <aside className="xl:col-span-4 space-y-5 xl:sticky xl:top-20">
          <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E6E6E6]">
              <ShieldCheck className="w-4 h-4 text-[#F28C00]" />
              <h3 className="text-sm font-bold text-[#151515]">Requisitioner &amp; Unit Summary</h3>
            </div>
            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-[#666666]">Initiated By</dt>
                <dd className="font-semibold text-[#151515] text-right">
                  {user.name} ({user.employeeId})
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#666666]">Authorized Role</dt>
                <dd className="font-bold text-[#E87500] text-right">{RoleDisplayLabel(user.role)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#666666]">Selected Unit</dt>
                <dd className="font-semibold text-[#151515] text-right">
                  {selectedCompany ? `${selectedCompany.code} · ${selectedCompany.unitName}` : 'Default Unit'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#666666]">Part / Customer</dt>
                <dd className="font-semibold text-[#151515] text-right">
                  <span className="font-mono">{partNo}</span> · {customer}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#666666]">Scope &amp; 4M</dt>
                <dd className="font-semibold text-[#151515] text-right">
                  {changeType} · {facilityScope} ({classifications.join(', ') || 'Method'})
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E6E6E6]">
              <ClipboardCheck className="w-4 h-4 text-[#F28C00]" />
              <h3 className="text-sm font-bold text-[#151515]">7 Auto-Linked Consultancy Forms</h3>
            </div>
            <p className="text-xs text-[#666666]">
              Submitting this requisition initializes all seven controlled Sakthi Auto forms with synchronized part, customer, and department metadata:
            </p>
            <ul className="space-y-2 pt-1">
              {LINKED_OFFICIAL_FORMS.map((item, idx) => (
                <li
                  key={item.code}
                  className="flex items-start gap-2.5 text-xs p-2 rounded-lg bg-[#F7F7F7]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F28C00] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold text-[#151515] leading-snug">
                      {idx + 1}. {item.title}
                    </p>
                    <p className="font-mono text-[10.5px] text-[#666666]">{item.code}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </form>
    </div>
  );
}
