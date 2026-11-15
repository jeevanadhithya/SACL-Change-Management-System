import React, { useState } from 'react';
import { X } from 'lucide-react';
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

interface NewPCRFModalProps {
  user: UserAccount;
  companies: CompanyRecord[];
  departments: DepartmentRecord[];
  customers: CustomerRecord[];
  parts: PartMasterRecord[];
  onClose: () => void;
  onCreate: (payload: Record<string, unknown>) => Promise<void>;
}

export function NewPCRFModal({
  user,
  companies,
  departments,
  customers,
  parts,
  onClose,
  onCreate,
}: NewPCRFModalProps) {
  const [companyId, setCompanyId] = useState(companies[0]?.id || 'comp-1');
  const [customer, setCustomer] = useState(customers[0]?.name || 'Tata Motors Ltd.');
  const [selectedPartNo, setSelectedPartNo] = useState(parts[0]?.partNumber || 'SA-SK-4410');
  const [partName, setPartName] = useState(parts[0]?.partName || 'Steering Knuckle LH');
  const [partNo, setPartNo] = useState(parts[0]?.partNumber || 'SA-SK-4410');
  const [department, setDepartment] = useState(user.department || departments[0]?.name || 'Machine Shop');
  const [changeType, setChangeType] = useState<ChangeCategoryType>('Process');
  const [facilityScope, setFacilityScope] = useState<FacilityScope>('Machine Shop');
  const [classifications, setClassifications] = useState<Classification4M[]>(['Method']);
  const [particulars, setParticulars] = useState(PARTICULARS_DROPDOWN_OPTIONS[0]);
  const [currentStatus, setCurrentStatus] = useState('');
  const [changeRequired, setChangeRequired] = useState('');
  const [reasonForChange, setReasonForChange] = useState('');
  const [priority, setPriority] = useState<'Critical' | 'High' | 'Normal'>('High');
  const [dueDate, setDueDate] = useState('2027-01-15');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      else if (comp.facilityType === 'Foundry & Machine Shop') setFacilityScope('Foundry & Machine Shop');
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
    const selectedCompany = companies.find((c) => c.id === companyId);
    try {
      await onCreate({
        companyId,
        companyName: selectedCompany
          ? `${selectedCompany.name} — ${selectedCompany.unitName}`
          : undefined,
        title: `${partName} — ${particulars}`,
        priority,
        createdBy: user.name,
        createdByEmployeeId: user.employeeId,
        department,
        customer,
        partName,
        partNo,
        changeType,
        facilityScope,
        classifications: classifications.length ? classifications : ['Method'],
        reasonForChange,
        particulars,
        currentStatus: currentStatus || 'Baseline process state',
        changeRequired: changeRequired || reasonForChange,
        dueDate,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create Change Request');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-pcrf-title"
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-xl border border-[#E6E6E6] max-w-2xl w-full shadow-xl my-8">
        <div className="px-6 py-4 border-b border-[#E6E6E6] flex items-center justify-between">
          <div>
            <h2 id="new-pcrf-title" className="text-lg font-bold text-[#151515]">
              Create New 4M Change Request (PCRF)
            </h2>
            <p className="text-xs text-[#666666]">
              Links all 7 official forms (PCRF to PPAP) for Machine Shop &amp; Foundry operations.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-[#151515] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold"
            >
              {error}
            </div>
          )}

          {/* Company / Plant Unit Selection */}
          <div>
            <label htmlFor="pcrf-company" className="block text-xs font-semibold text-[#151515] mb-1">
              Company / Plant Unit
            </label>
            <select
              id="pcrf-company"
              value={companyId}
              onChange={(e) => handleCompanyPick(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg bg-white"
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
              <label htmlFor="pcrf-part-select" className="block text-xs font-semibold text-[#151515] mb-1">
                Select Master Part
              </label>
              <select
                id="pcrf-part-select"
                value={selectedPartNo}
                onChange={(e) => handlePartPick(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg bg-white"
              >
                {parts.map((pt) => (
                  <option key={pt.id} value={pt.partNumber}>
                    {pt.partNumber} — {pt.partName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pcrf-customer" className="block text-xs font-semibold text-[#151515] mb-1">
                Customer
              </label>
              <select
                id="pcrf-customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pcrf-part-name" className="block text-xs font-semibold text-[#151515] mb-1">
                Part Name
              </label>
              <input
                id="pcrf-part-name"
                type="text"
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="pcrf-part-no" className="block text-xs font-semibold text-[#151515] mb-1">
                Part Number
              </label>
              <input
                id="pcrf-part-no"
                type="text"
                value={partNo}
                onChange={(e) => setPartNo(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="pcrf-dept" className="block text-xs font-semibold text-[#151515] mb-1">
                Department
              </label>
              <select
                id="pcrf-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pcrf-priority" className="block text-xs font-semibold text-[#151515] mb-1">
                Priority
              </label>
              <select
                id="pcrf-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'Critical' | 'High' | 'Normal')}
                className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <span className="block text-xs font-semibold text-[#151515] mb-1.5">
                Change Type
              </span>
              <div className="flex gap-2">
                {(['Process', 'Product'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={changeType === t}
                    onClick={() => setChangeType(t)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                      changeType === t
                        ? 'bg-[#151515] text-white border-[#151515]'
                        : 'bg-white text-[#151515] border-[#E6E6E6]'
                    }`}
                  >
                    {t} Change
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-[#151515] mb-1.5">
                Facility Scope (F / M / F&amp;M)
              </span>
              <div className="flex gap-2">
                {(['Machine Shop', 'Foundry', 'Foundry & Machine Shop'] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    aria-pressed={facilityScope === scope}
                    onClick={() => setFacilityScope(scope)}
                    className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold border cursor-pointer truncate ${
                      facilityScope === scope
                        ? 'bg-[#F28C00] text-white border-[#F28C00]'
                        : 'bg-white text-[#151515] border-[#E6E6E6]'
                    }`}
                  >
                    {scope === 'Foundry & Machine Shop' ? 'F & M' : scope}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[#151515] mb-1.5">
              4M Classification
            </span>
            <div className="flex flex-wrap gap-2">
              {(['Man', 'Machine', 'Material', 'Method'] as const).map((c) => {
                const active = classifications.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleClassification(c)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                      active
                        ? 'bg-[#FFF4E5] border-[#F28C00] text-[#E87500]'
                        : 'bg-white border-[#E6E6E6] text-[#666666]'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pcrf-particulars" className="block text-xs font-semibold text-[#151515] mb-1">
                Particulars
              </label>
              <select
                id="pcrf-particulars"
                value={particulars}
                onChange={(e) => setParticulars(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg bg-white"
              >
                {PARTICULARS_DROPDOWN_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pcrf-due-date" className="block text-xs font-semibold text-[#151515] mb-1">
                Target Due Date
              </label>
              <input
                id="pcrf-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pcrf-current-status" className="block text-xs font-semibold text-[#151515] mb-1">
                Current Status
              </label>
              <input
                id="pcrf-current-status"
                type="text"
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                placeholder="e.g., Current CNC tooling / cycle time"
                className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="pcrf-change-req" className="block text-xs font-semibold text-[#151515] mb-1">
                Change Required
              </label>
              <input
                id="pcrf-change-req"
                type="text"
                value={changeRequired}
                onChange={(e) => setChangeRequired(e.target.value)}
                placeholder="e.g., Proposed machining fixture / insert"
                className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
              />
            </div>
          </div>

          <div>
            <label htmlFor="pcrf-reason" className="block text-xs font-semibold text-[#151515] mb-1">
              Reason for Change Required
            </label>
            <textarea
              id="pcrf-reason"
              rows={2}
              value={reasonForChange}
              onChange={(e) => setReasonForChange(e.target.value)}
              placeholder="Explain engineering, quality, cost, or customer justification..."
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>

          <div className="pt-3 border-t border-[#E6E6E6] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E6E6E6] text-sm font-semibold text-[#151515] hover:bg-[#F7F7F7] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-sm font-bold cursor-pointer disabled:opacity-60"
            >
              {submitting ? 'Creating...' : 'Raise PCRF & Link Forms'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
