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
  initialCompanyId?: string;
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
  initialCompanyId,
  onCancel,
  onCreate,
}: CreatePCRFPageProps) {
  const isLockedCompanyUser = user.role === 'COMPANY_USER' && !!user.companyId;
  const defaultCompany =
    (isLockedCompanyUser ? companies.find((c) => c.id === user.companyId) : undefined) ||
    (initialCompanyId ? companies.find((c) => c.id === initialCompanyId) : undefined) ||
    (user.companyId ? companies.find((c) => c.id === user.companyId) : undefined) ||
    companies[0];

  const initialPartsForCompany = defaultCompany
    ? parts.filter((pt) => pt.companyId === defaultCompany.id)
    : [];
  const defaultPart = initialPartsForCompany[0] || parts[0];

  const [companyId, setCompanyId] = useState(defaultCompany?.id || '');
  const [customer, setCustomer] = useState(
    defaultPart?.customer || defaultCompany?.name || customers[0]?.name || '',
  );
  const [selectedPartNo, setSelectedPartNo] = useState(defaultPart?.partNumber || '');
  const [partName, setPartName] = useState(defaultPart?.partName || '');
  const [partNo, setPartNo] = useState(defaultPart?.partNumber || '');
  const [department, setDepartment] = useState(
    departments.some((d) => d.name === user.department)
      ? user.department
      : departments[0]?.name || user.department || '',
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
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCompany = companies.find((c) => c.id === companyId);
  const companySpecificParts = companyId
    ? parts.filter((pt) => pt.companyId === companyId)
    : [];
  const otherMasterParts = companyId
    ? parts.filter((pt) => pt.companyId !== companyId)
    : parts;
  const selectedPartObj = parts.find(
    (pt) => pt.partNumber.toUpperCase() === (selectedPartNo || partNo).trim().toUpperCase(),
  );

  function handlePartPick(pNum: string) {
    setSelectedPartNo(pNum);
    const found = parts.find((p) => p.partNumber === pNum);
    if (found) {
      setPartName(found.partName);
      setPartNo(found.partNumber);
      setCustomer(found.customer || selectedCompany?.name || customer);
      setFacilityScope(found.facility);
      if (!currentStatus.trim()) {
        const autoDetails = [
          found.materialGrade ? `Material: ${found.materialGrade}` : '',
          found.processType ? `Process: ${found.processType}` : '',
          found.drawingNumber ? `Drg: ${found.drawingNumber} (${found.currentRevision})` : `Rev: ${found.currentRevision}`,
          found.specifications ? `Specs: ${found.specifications}` : '',
        ]
          .filter(Boolean)
          .join(' | ');
        if (autoDetails) {
          setCurrentStatus(autoDetails);
        }
      }
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
      const compParts = parts.filter((pt) => pt.companyId === comp.id);
      if (compParts.length > 0) {
        const firstPart = compParts[0];
        setSelectedPartNo(firstPart.partNumber);
        setPartName(firstPart.partName);
        setPartNo(firstPart.partNumber);
        setCustomer(firstPart.customer || comp.name);
        setFacilityScope(firstPart.facility);
      } else if (!customer.trim()) {
        setCustomer(comp.name);
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
    if (!customer.trim() || !partName.trim() || !partNo.trim() || !reasonForChange.trim()) {
      setError('Customer, Part Name, Part Number, and Reason for Change are required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onCreate({
        companyId: companyId || undefined,
        companyName: selectedCompany
          ? `${selectedCompany.name} — ${selectedCompany.unitName}`
          : undefined,
        title: `${partName.trim()} — ${particulars}`,
        priority,
        createdBy: user.name,
        createdByEmployeeId: user.employeeId,
        department: department.trim() || user.department,
        customer: customer.trim(),
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
        currentRevision: selectedPartObj?.currentRevision,
        drawingNumber: selectedPartObj?.drawingNumber,
        materialGrade: selectedPartObj?.materialGrade,
        processType: selectedPartObj?.processType,
        specifications: selectedPartObj?.specifications,
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 rounded-lg border border-[#D5DAE1] bg-white hover:bg-[#F8F9FB] hover:border-[#121417] text-[#111318] flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Back to Change Requests"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#D97700]">
              QF/07/MRO-15 · Stage 1 Requisition
            </p>
            <h2 className="text-2xl leading-8 font-extrabold text-[#111318] tracking-tight">
              Create New 4M Change Request (PCRF)
            </h2>
            <p className="text-sm text-[#5C6470]">
              Raise a new change requisition and automatically link all 7 interconnected Sakthi Auto consultancy forms.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary self-start sm:self-auto shrink-0"
        >
          Back to Change Requests
        </button>
      </div>

      {/* Main 12-Column Workspace Layout */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Structured Requisition Form */}
        <div className="xl:col-span-8 space-y-6">
          {error && (
            <div
              role="alert"
              className="px-4 py-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
            >
              {error}
            </div>
          )}

          {/* Section 1: Company, Part & Customer */}
          <section className="surface-card p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-[#E4E7EC]">
              <Building2 className="w-4 h-4 text-[#F28C00]" />
              <h3 className="text-sm font-bold text-[#111318]">
                1. Company Unit &amp; Component Identification
              </h3>
            </div>

            <div>
              <label htmlFor="pcrf-company" className="field-label">
                Company / Plant Unit
              </label>
              <select
                id="pcrf-company"
                value={companyId}
                disabled={isLockedCompanyUser}
                onChange={(e) => handleCompanyPick(e.target.value)}
                className="field-input"
              >
                <option value="">
                  {companies.length === 0
                    ? 'No companies added in database yet (Admin can add in Companies)'
                    : 'Select company / plant unit'}
                </option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.code} — {comp.name} ({comp.unitName})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pcrf-part-select" className="field-label">
                  Select Company Manufactured / Master Part
                </label>
                <select
                  id="pcrf-part-select"
                  value={selectedPartNo}
                  onChange={(e) => handlePartPick(e.target.value)}
                  className="field-input"
                >
                  <option value="">
                    {parts.length === 0
                      ? 'No manufactured parts yet — add in Company View or enter below'
                      : 'Choose a manufactured part...'}
                  </option>
                  {companySpecificParts.length > 0 && (
                    <optgroup
                      label={`Manufactured Parts for ${selectedCompany?.code || 'Selected Company'}`}
                    >
                      {companySpecificParts.map((pt) => (
                        <option key={pt.id} value={pt.partNumber}>
                          {pt.partNumber} — {pt.partName} ({pt.currentRevision})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {otherMasterParts.length > 0 && (
                    <optgroup label="Other Master Parts">
                      {otherMasterParts.map((pt) => (
                        <option key={pt.id} value={pt.partNumber}>
                          {pt.partNumber} — {pt.partName} ({pt.currentRevision})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="pcrf-customer" className="field-label">
                  Customer *
                </label>
                <input
                  id="pcrf-customer"
                  type="text"
                  list="pcrf-customers-datalist"
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value)}
                  placeholder="Select or enter OEM Customer name"
                  className="field-input"
                />
                {customers.length > 0 && (
                  <datalist id="pcrf-customers-datalist">
                    {customers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                )}
              </div>

              {selectedPartObj && (
                <div className="sm:col-span-2 rounded-lg bg-[#FFF6EB] p-4 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#111318]">
                      Manufactured Part Details Linked to Forms 1–7:{' '}
                      <span className="font-mono text-[#D97700]">{selectedPartObj.partNumber}</span>
                    </span>
                    <span className="font-mono font-bold text-[#D97700]">
                      {selectedPartObj.currentRevision}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#344054]">
                    {selectedPartObj.drawingNumber && (
                      <span>
                        <strong>Drawing No:</strong>{' '}
                        <span className="font-mono">{selectedPartObj.drawingNumber}</span>
                      </span>
                    )}
                    {selectedPartObj.materialGrade && (
                      <span>
                        <strong>Material:</strong> {selectedPartObj.materialGrade}
                      </span>
                    )}
                    {selectedPartObj.processType && (
                      <span>
                        <strong>Process:</strong> {selectedPartObj.processType}
                      </span>
                    )}
                    {selectedPartObj.specifications && (
                      <span>
                        <strong>Specs:</strong> {selectedPartObj.specifications}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="pcrf-part-name" className="field-label">
                  Part Name *
                </label>
                <input
                  id="pcrf-part-name"
                  type="text"
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  placeholder="Enter component / part name"
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="pcrf-part-no" className="field-label">
                  Part Number *
                </label>
                <input
                  id="pcrf-part-no"
                  type="text"
                  value={partNo}
                  onChange={(e) => setPartNo(e.target.value)}
                  placeholder="Enter drawing / part number"
                  className="field-input font-mono"
                />
              </div>

              <div>
                <label htmlFor="pcrf-dept" className="field-label">
                  Department
                </label>
                {departments.length > 0 ? (
                  <select
                    id="pcrf-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="field-input"
                  >
                    <option value="">Select department...</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="pcrf-dept"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Enter department name"
                    className="field-input"
                  />
                )}
              </div>

              <div>
                <label htmlFor="pcrf-priority" className="field-label">
                  Priority
                </label>
                <select
                  id="pcrf-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'Critical' | 'High' | 'Normal')}
                  className="field-input"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </section>

          {/* Section 2: Change Scope & 4M Classification */}
          <section className="surface-card p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-[#E4E7EC]">
              <Layers className="w-4 h-4 text-[#F28C00]" />
              <h3 className="text-sm font-bold text-[#111318]">
                2. Change Type, Facility Scope &amp; 4M Classification
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="field-label">Change Type</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['Process', 'Product'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={changeType === t}
                      onClick={() => setChangeType(t)}
                      className={`h-10 px-4 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        changeType === t
                          ? 'bg-[#121417] text-white border-[#121417]'
                          : 'bg-white text-[#111318] border-[#D5DAE1] hover:bg-[#F8F9FB]'
                      }`}
                    >
                      {t} Change
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="field-label">Facility Scope (F / M / F&amp;M)</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Machine Shop', 'Foundry', 'Foundry & Machine Shop'] as const).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      aria-pressed={facilityScope === scope}
                      onClick={() => setFacilityScope(scope)}
                      className={`h-10 px-2 rounded-lg text-xs font-semibold border cursor-pointer whitespace-nowrap transition-colors ${
                        facilityScope === scope
                          ? 'bg-[#F28C00] text-white border-[#F28C00]'
                          : 'bg-white text-[#111318] border-[#D5DAE1] hover:bg-[#F8F9FB]'
                      }`}
                    >
                      {scope === 'Foundry & Machine Shop' ? 'F & M' : scope}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <span className="field-label">4M Classification (Select one or more)</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Man', 'Machine', 'Material', 'Method'] as const).map((c) => {
                  const active = classifications.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleClassification(c)}
                      className={`h-10 px-4 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                        active
                          ? 'bg-[#FFF6EB] border-[#F28C00] text-[#D97700]'
                          : 'bg-white border-[#D5DAE1] text-[#5C6470] hover:bg-[#F8F9FB]'
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
          <section className="surface-card p-6 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-[#E4E7EC]">
              <FileText className="w-4 h-4 text-[#F28C00]" />
              <h3 className="text-sm font-bold text-[#111318]">
                3. Change Particulars &amp; Engineering Justification
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pcrf-particulars" className="field-label">
                  Particulars
                </label>
                <select
                  id="pcrf-particulars"
                  value={particulars}
                  onChange={(e) => setParticulars(e.target.value)}
                  className="field-input"
                >
                  {PARTICULARS_DROPDOWN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="pcrf-due-date" className="field-label">
                  Target Due Date
                </label>
                <input
                  id="pcrf-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="field-input font-mono tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="pcrf-current-status" className="field-label">
                  Current Status
                </label>
                <input
                  id="pcrf-current-status"
                  type="text"
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  placeholder="e.g., Current CNC tooling / cycle time"
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="pcrf-change-req" className="field-label">
                  Change Required
                </label>
                <input
                  id="pcrf-change-req"
                  type="text"
                  value={changeRequired}
                  onChange={(e) => setChangeRequired(e.target.value)}
                  placeholder="e.g., Proposed machining fixture / insert"
                  className="field-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pcrf-reason" className="field-label">
                Reason for Change Required *
              </label>
              <textarea
                id="pcrf-reason"
                rows={4}
                value={reasonForChange}
                onChange={(e) => setReasonForChange(e.target.value)}
                placeholder="Explain engineering, quality, cost, cycle time, or customer justification..."
                className="field-textarea"
              />
            </div>

            <div className="pt-6 border-t border-[#E4E7EC] flex flex-wrap items-center justify-end gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-6"
              >
                {submitting ? 'Creating & Linking Forms...' : 'Raise PCRF & Link Forms'}
              </button>
            </div>
          </section>
        </div>

        {/* Right 4 Columns: Live Summary & Auto-Linked 7 Consultancy Forms */}
        <aside className="xl:col-span-4 space-y-6 xl:sticky xl:top-24">
          <div className="surface-card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-4 border-b border-[#E4E7EC]">
              <ShieldCheck className="w-4 h-4 text-[#F28C00]" />
              <h3 className="text-sm font-bold text-[#111318]">Requisitioner &amp; Unit Summary</h3>
            </div>
            <dl className="space-y-4 text-xs">
              <div className="flex justify-between gap-4">
                <dt className="text-[#5C6470]">Initiated By</dt>
                <dd className="font-semibold text-[#111318] text-right">
                  {user.name} ({user.employeeId})
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#5C6470]">Authorized Role</dt>
                <dd className="font-bold text-[#D97700] text-right">{RoleDisplayLabel(user.role)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#5C6470]">Selected Unit</dt>
                <dd className="font-semibold text-[#111318] text-right">
                  {selectedCompany ? `${selectedCompany.code} · ${selectedCompany.unitName}` : 'Not assigned'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#5C6470]">Part / Customer</dt>
                <dd className="font-semibold text-[#111318] text-right">
                  {partNo || customer ? (
                    <>
                      <span className="font-mono">{partNo || '—'}</span> · {customer || '—'}
                    </>
                  ) : (
                    'Not entered yet'
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#5C6470]">Scope &amp; 4M</dt>
                <dd className="font-semibold text-[#111318] text-right">
                  {changeType} · {facilityScope} ({classifications.join(', ') || 'Method'})
                </dd>
              </div>
            </dl>
          </div>

          <div className="surface-card p-6 space-y-4">
            <div className="flex items-center gap-2 pb-4 border-b border-[#E4E7EC]">
              <ClipboardCheck className="w-4 h-4 text-[#F28C00]" />
              <h3 className="text-sm font-bold text-[#111318]">7 Auto-Linked Consultancy Forms</h3>
            </div>
            <p className="text-xs text-[#5C6470] leading-5">
              Submitting this requisition initializes all seven controlled Sakthi Auto forms with synchronized part, customer, and department metadata:
            </p>
            <ul className="space-y-2">
              {LINKED_OFFICIAL_FORMS.map((item, idx) => (
                <li
                  key={item.code}
                  className="flex items-start gap-2 text-xs p-2 rounded-lg bg-[#F8F9FB]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#F28C00] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-[#111318] leading-5">
                      {idx + 1}. {item.title}
                    </p>
                    <p className="font-mono text-[11px] text-[#5C6470]">{item.code}</p>
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
