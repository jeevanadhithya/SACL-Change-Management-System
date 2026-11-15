import React, { useEffect, useState } from 'react';
import { CheckCheck, Link2, PenLine, Plus, Printer, Save, Trash2 } from 'lucide-react';
import type {
  FeasibilityRequirementItem,
  Form2Feasibility,
  UserAccount,
} from '../../types/pcms';

interface FeasibilityReportForChangeRequestProps {
  data: Form2Feasibility;
  currentUser?: UserAccount;
  saving: boolean;
  onSave: (updated: Form2Feasibility) => Promise<void>;
  onPrintOfficial: () => void;
}

const SECTIONS: FeasibilityRequirementItem['section'][] = [
  'Manufacturing Process / Product Requirement',
  'System Requirement',
  'Inspection Requirement',
  'Any Other Requirement',
];

const CATEGORY_DROPDOWN = [
  'Process (Method / Machine) — Machine Shop',
  'Process (Material / Method) — Foundry',
  'Product Engineering Drawing Revision — Foundry & Machine Shop',
  'Tooling / Gauge / Fixture Modification',
  'Customer Specific Requirement / ECN',
];

export function FeasibilityReportForChangeRequest({
  data,
  currentUser,
  saving,
  onSave,
  onPrintOfficial,
}: FeasibilityReportForChangeRequestProps) {
  const [form, setForm] = useState<Form2Feasibility>(data);

  useEffect(() => {
    setForm(data);
  }, [data]);

  const today = new Date().toISOString().slice(0, 10);
  const feasibleCount = form.requirements.filter((r) => r.decision === 'Feasible').length;
  const notFeasibleCount = form.requirements.filter((r) => r.decision === 'Not Feasible').length;
  const pendingCount = form.requirements.filter((r) => r.decision === 'Pending').length;

  function addRequirement(section: FeasibilityRequirementItem['section']) {
    setForm((prev) => ({
      ...prev,
      requirements: [
        ...prev.requirements,
        {
          id: `req-${Date.now()}`,
          section,
          description: '',
          decision: 'Pending',
        },
      ],
    }));
  }

  function updateReq(id: string, patch: Partial<FeasibilityRequirementItem>) {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }

  function removeReq(id: string) {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((r) => r.id !== id),
    }));
  }

  function markAllPendingFeasible() {
    setForm((prev) => ({
      ...prev,
      requirements: prev.requirements.map((r) =>
        r.decision === 'Pending' ? { ...r, decision: 'Feasible' } : r,
      ),
      conclusion: prev.conclusion === 'PENDING' ? 'FEASIBLE' : prev.conclusion,
    }));
  }

  function updateSignature(slot: number, field: 'name' | 'signed' | 'date', value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      cftSignatures: prev.cftSignatures.map((s) =>
        s.slot === slot ? { ...s, [field]: value } : s,
      ),
    }));
  }

  function signSlotAsMe(slot: number) {
    if (!currentUser) return;
    setForm((prev) => ({
      ...prev,
      cftSignatures: prev.cftSignatures.map((s) =>
        s.slot === slot ? { ...s, name: currentUser.name, signed: true, date: today } : s,
      ),
    }));
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
            <span className="font-mono font-bold text-[#151515]">QF/07/MRO-02</span>
            <span>·</span>
            <span>10/06/2015</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#E87500] font-semibold">
              <Link2 className="w-3.5 h-3.5" /> Linked to {form.slNo} ({form.partNo})
            </span>
          </div>
          <h3 className="text-base font-bold text-[#151515] mt-0.5">
            Form 2 — Feasibility Report for Change Request
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onPrintOfficial}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#151515] text-xs font-bold text-[#151515] hover:bg-[#151515] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Format</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(form)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Feasibility'}</span>
          </button>
        </div>
      </div>

      {/* Auto-linked Metadata */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">
            SL. No (of Change Request)
          </label>
          <input
            type="text"
            readOnly
            value={form.slNo}
            className="w-full px-3 py-2 text-sm font-mono font-bold bg-[#F7F7F7] border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">
            From (Department Owner)
          </label>
          <input
            type="text"
            value={form.from}
            onChange={(e) => setForm({ ...form, from: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">To (Team)</label>
          <input
            type="text"
            value={form.to}
            onChange={(e) => setForm({ ...form, to: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">Part Name</label>
          <input
            type="text"
            readOnly
            value={form.partName}
            className="w-full px-3 py-2 text-sm bg-[#F7F7F7] border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">Part No.</label>
          <input
            type="text"
            readOnly
            value={form.partNo}
            className="w-full px-3 py-2 text-sm font-mono bg-[#F7F7F7] border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">Customer</label>
          <input
            type="text"
            readOnly
            value={form.customer}
            className="w-full px-3 py-2 text-sm bg-[#F7F7F7] border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-[#666666] mb-1">
            Category of Change (as per change request — Dropdown)
          </label>
          <select
            value={
              CATEGORY_DROPDOWN.includes(form.categoryOfChange)
                ? form.categoryOfChange
                : CATEGORY_DROPDOWN[0]
            }
            onChange={(e) => setForm({ ...form, categoryOfChange: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg bg-white"
          >
            {CATEGORY_DROPDOWN.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">Report Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
          />
        </div>
      </div>

      {/* Assessment Sections */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-[#151515]">Requirements Assessment</h4>
            <p className="text-xs text-[#666666] tabular-nums">
              {feasibleCount} Feasible · {notFeasibleCount} Not Feasible · {pendingCount} Pending
            </p>
          </div>
          {pendingCount > 0 && (
            <button
              type="button"
              onClick={markAllPendingFeasible}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6E6E6] hover:border-[#151515] text-xs font-bold text-[#151515] cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark All Pending Feasible</span>
            </button>
          )}
        </div>

        {SECTIONS.map((section) => {
          const rows = form.requirements.filter((r) => r.section === section);
          return (
            <div key={section} className="border border-[#E6E6E6] rounded-lg overflow-hidden">
              <div className="bg-[#F7F7F7] px-4 py-2.5 flex items-center justify-between border-b border-[#E6E6E6]">
                <span className="text-xs font-bold text-[#151515]">{section}</span>
                <button
                  type="button"
                  onClick={() => addRequirement(section)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#E87500] hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Line
                </button>
              </div>
              <div className="divide-y divide-[#E6E6E6]">
                {rows.map((row) => (
                  <div key={row.id} className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateReq(row.id, { description: e.target.value })}
                      placeholder="Enter requirement description..."
                      className="flex-1 px-3 py-1.5 text-sm border border-[#E6E6E6] rounded-md"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(['Feasible', 'Not Feasible', 'Pending'] as const).map((dec) => (
                        <button
                          key={dec}
                          type="button"
                          onClick={() => updateReq(row.id, { decision: dec })}
                          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border cursor-pointer ${
                            row.decision === dec
                              ? dec === 'Feasible'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : dec === 'Not Feasible'
                                ? 'bg-red-600 text-white border-red-600'
                                : 'bg-[#151515] text-white border-[#151515]'
                              : 'bg-white text-[#666666] border-[#E6E6E6]'
                          }`}
                        >
                          {dec}
                        </button>
                      ))}
                      <button
                        type="button"
                        aria-label="Remove requirement"
                        onClick={() => removeReq(row.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">
            Additional Manufacturing or Inspection or Other Resource Requirement at Foundry / Machine Shop
          </label>
          <textarea
            rows={2}
            value={form.additionalResourceRequirement}
            onChange={(e) => setForm({ ...form, additionalResourceRequirement: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
          />
        </div>
      </div>

      {/* Conclusion, 6 CFT Signatures & Acknowledgement */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E6E6]">
          <div>
            <span className="text-sm font-bold text-[#151515]">Feasibility Conclusion</span>
            <p className="text-xs text-[#666666]">
              Determines Decision 1 gate to Risk Analysis &amp; Timing Plan.
            </p>
          </div>
          <div className="flex gap-2">
            {(['FEASIBLE', 'NOT FEASIBLE', 'PENDING'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, conclusion: c })}
                className={`px-4 py-2 rounded-lg text-xs font-bold border cursor-pointer ${
                  form.conclusion === c
                    ? c === 'FEASIBLE'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : c === 'NOT FEASIBLE'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-[#151515] text-white border-[#151515]'
                    : 'bg-white text-[#666666] border-[#E6E6E6]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-[#666666] uppercase tracking-wider mb-3">
            6 CFT Members Sign / Date
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {form.cftSignatures.map((sig) => (
              <div key={sig.slot} className="p-3 border border-[#E6E6E6] rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#151515]">
                    {sig.slot}. {sig.department}
                  </span>
                  <div className="flex items-center gap-2">
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => signSlotAsMe(sig.slot)}
                        className="inline-flex items-center gap-0.5 text-[11px] font-bold text-[#E87500] hover:underline cursor-pointer"
                      >
                        <PenLine className="w-3 h-3" /> Sign
                      </button>
                    )}
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sig.signed}
                        onChange={(e) => updateSignature(sig.slot, 'signed', e.target.checked)}
                        className="accent-[#F28C00]"
                      />
                      <span className="font-semibold text-[#151515]">Signed</span>
                    </label>
                  </div>
                </div>
                <input
                  type="text"
                  value={sig.name}
                  onChange={(e) => updateSignature(sig.slot, 'name', e.target.value)}
                  placeholder="Member name"
                  className="w-full px-2.5 py-1.5 text-xs border border-[#E6E6E6] rounded-md"
                />
                <input
                  type="date"
                  value={sig.date}
                  onChange={(e) => updateSignature(sig.slot, 'date', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-[#E6E6E6] rounded-md"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-[#666666] mb-1">Comments</label>
            <input
              type="text"
              value={form.comments}
              onChange={(e) => setForm({ ...form, comments: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Forwarded To</label>
            <input
              type="text"
              value={form.forwardedTo}
              onChange={(e) => setForm({ ...form, forwardedTo: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#666666]">Acknowledgement</label>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    acknowledgementStatus: 'Acknowledged',
                    acknowledgementDate: form.acknowledgementDate || today,
                  })
                }
                className="text-[11px] font-bold text-[#E87500] hover:underline cursor-pointer"
              >
                Acknowledge Today
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={form.acknowledgementStatus}
                onChange={(e) =>
                  setForm({
                    ...form,
                    acknowledgementStatus: e.target.value as 'Pending' | 'Acknowledged',
                  })
                }
                className="flex-1 px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg bg-white"
              >
                <option value="Pending">Pending</option>
                <option value="Acknowledged">Acknowledged</option>
              </select>
              <input
                type="date"
                value={form.acknowledgementDate}
                onChange={(e) => setForm({ ...form, acknowledgementDate: e.target.value })}
                className="px-2.5 py-2 text-xs font-mono border border-[#E6E6E6] rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
