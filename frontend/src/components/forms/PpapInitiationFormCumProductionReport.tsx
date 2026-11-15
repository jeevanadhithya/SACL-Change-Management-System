import React, { useEffect, useState } from 'react';
import { Link2, PenLine, Printer, Save } from 'lucide-react';
import type { Form7PPAP, UserAccount } from '../../types/pcms';

interface PpapInitiationFormCumProductionReportProps {
  data: Form7PPAP;
  currentUser?: UserAccount;
  saving: boolean;
  onSave: (updated: Form7PPAP) => Promise<void>;
  onPrintOfficial: () => void;
}

export function PpapInitiationFormCumProductionReport({
  data,
  currentUser,
  saving,
  onSave,
  onPrintOfficial,
}: PpapInitiationFormCumProductionReportProps) {
  const [form, setForm] = useState<Form7PPAP>(data);

  useEffect(() => {
    setForm(data);
  }, [data]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
            <span className="font-mono font-bold text-[#151515]">QF/07/MRO-05</span>
            <span>·</span>
            <span>20.08.2016 · Mandatory Stage 7</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#E87500] font-semibold">
              <Link2 className="w-3.5 h-3.5" /> Linked to {form.partNameNumber}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#151515] mt-0.5">
            Form 7 — PPAP Initiation Form cum Production Report
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
            <span>{saving ? 'Saving...' : 'Save PPAP Report'}</span>
          </button>
        </div>
      </div>

      {/* Linked Request Header */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">From</label>
          <input
            type="text"
            value={form.from}
            onChange={(e) => setForm({ ...form, from: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">Department</label>
          <input
            type="text"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
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
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">Part Name / Number</label>
          <input
            type="text"
            readOnly
            value={form.partNameNumber}
            className="w-full px-3 py-2 text-sm bg-[#F7F7F7] border border-[#E6E6E6] rounded-lg"
          />
        </div>
      </div>

      {/* 13 Numbered CFT Production & PPAP Fields */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-bold text-[#151515] border-b border-[#E6E6E6] pb-2">
          For Use of CFT — Production Run &amp; PSW Verification
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              1) Date of First Production Run
            </label>
            <input
              type="date"
              value={form.firstProductionRunDate}
              onChange={(e) => setForm({ ...form, firstProductionRunDate: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              2) Quantity Produced (300 Nos or 1 Day Qty)
            </label>
            <input
              type="text"
              value={form.quantityProduced}
              onChange={(e) => setForm({ ...form, quantityProduced: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              3) Cycle Time / Production Rate
            </label>
            <input
              type="text"
              value={form.cycleTimeProductionRate}
              onChange={(e) => setForm({ ...form, cycleTimeProductionRate: e.target.value })}
              placeholder="e.g., 118 sec / pc"
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              4) Process Flow Diagram Number
            </label>
            <input
              type="text"
              value={form.pfdNumber}
              onChange={(e) => setForm({ ...form, pfdNumber: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">PFD Rev No.</label>
            <input
              type="text"
              value={form.pfdRevNo}
              onChange={(e) => setForm({ ...form, pfdRevNo: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">PFD Date</label>
            <input
              type="date"
              value={form.pfdDate}
              onChange={(e) => setForm({ ...form, pfdDate: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              5) Control Plan Number
            </label>
            <input
              type="text"
              value={form.controlPlanNumber}
              onChange={(e) => setForm({ ...form, controlPlanNumber: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Control Plan Rev No.</label>
            <input
              type="text"
              value={form.controlPlanRevNo}
              onChange={(e) => setForm({ ...form, controlPlanRevNo: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Control Plan Date</label>
            <input
              type="date"
              value={form.controlPlanDate}
              onChange={(e) => setForm({ ...form, controlPlanDate: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
        </div>

        {/* Conditional Deviation Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E6E6E6]">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#151515]">
                6) Any Deviations to Process Flow Routing?
              </span>
              <div className="flex gap-2">
                {(['Yes', 'No'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm({ ...form, deviationsToProcessFlow: opt })}
                    className={`px-3 py-1 rounded text-xs font-bold border cursor-pointer ${
                      form.deviationsToProcessFlow === opt
                        ? 'bg-[#151515] text-white border-[#151515]'
                        : 'bg-white text-[#666666] border-[#E6E6E6]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {form.deviationsToProcessFlow === 'Yes' && (
              <input
                type="text"
                value={form.processFlowDeviationNature}
                onChange={(e) => setForm({ ...form, processFlowDeviationNature: e.target.value })}
                placeholder="7) If yes — Nature of Process Flow Deviation..."
                className="w-full px-3 py-2 text-xs border border-[#F28C00] rounded-lg"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#151515]">
                8) Any Deviations to Control Plan?
              </span>
              <div className="flex gap-2">
                {(['Yes', 'No'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm({ ...form, deviationsToControlPlan: opt })}
                    className={`px-3 py-1 rounded text-xs font-bold border cursor-pointer ${
                      form.deviationsToControlPlan === opt
                        ? 'bg-[#151515] text-white border-[#151515]'
                        : 'bg-white text-[#666666] border-[#E6E6E6]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            {form.deviationsToControlPlan === 'Yes' && (
              <input
                type="text"
                value={form.controlPlanDeviationNature}
                onChange={(e) => setForm({ ...form, controlPlanDeviationNature: e.target.value })}
                placeholder="9) If yes — Nature of Control Plan Deviation..."
                className="w-full px-3 py-2 text-xs border border-[#F28C00] rounded-lg"
              />
            )}
          </div>
        </div>

        {/* PSW, Submission & Dispatch */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-[#E6E6E6]">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#666666]">
                10) PSW Internal Approval On
              </label>
              <button
                type="button"
                onClick={() => setForm({ ...form, pswInternalApprovalDate: today })}
                className="text-[11px] font-bold text-[#E87500] hover:underline cursor-pointer"
              >
                Today
              </button>
            </div>
            <input
              type="date"
              value={form.pswInternalApprovalDate}
              onChange={(e) => setForm({ ...form, pswInternalApprovalDate: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              11) Submission Required
            </label>
            <select
              value={form.submissionRequired}
              onChange={(e) =>
                setForm({ ...form, submissionRequired: e.target.value as 'Yes' | 'No' })
              }
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg bg-white"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              12) Status of Submission
            </label>
            <select
              value={form.submissionStatus}
              onChange={(e) =>
                setForm({
                  ...form,
                  submissionStatus: e.target.value as Form7PPAP['submissionStatus'],
                })
              }
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg bg-white"
            >
              <option value="Pending">Pending</option>
              <option value="Yes">Yes (Submitted / Approved)</option>
              <option value="No">No</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#666666]">
                13) Product Dispatch Auth. By
              </label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, productDispatchAuthBy: currentUser.name })}
                  className="text-[11px] font-bold text-[#E87500] hover:underline cursor-pointer"
                >
                  Me
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.productDispatchAuthBy}
              onChange={(e) => setForm({ ...form, productDispatchAuthBy: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
        </div>

        {/* 3 Core Team Signatures */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-[#E6E6E6]">
          {form.coreTeamSignOffs.map((s, idx) => (
            <div key={idx} className="p-3 border border-[#E6E6E6] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#151515]">Core Team Approval {idx + 1}</p>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        coreTeamSignOffs: form.coreTeamSignOffs.map((row, i) =>
                          i === idx
                            ? { name: currentUser.name, sign: currentUser.name, date: today }
                            : row,
                        ),
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E87500] hover:underline cursor-pointer"
                  >
                    <PenLine className="w-3 h-3" /> Sign as Me
                  </button>
                )}
              </div>
              <input
                type="text"
                value={s.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    coreTeamSignOffs: form.coreTeamSignOffs.map((row, i) =>
                      i === idx ? { ...row, name: e.target.value } : row,
                    ),
                  })
                }
                placeholder="Name"
                className="w-full px-2.5 py-1.5 text-xs border border-[#E6E6E6] rounded"
              />
              <input
                type="text"
                value={s.sign}
                onChange={(e) =>
                  setForm({
                    ...form,
                    coreTeamSignOffs: form.coreTeamSignOffs.map((row, i) =>
                      i === idx ? { ...row, sign: e.target.value } : row,
                    ),
                  })
                }
                placeholder="Signature"
                className="w-full px-2.5 py-1.5 text-xs border border-[#E6E6E6] rounded"
              />
              <input
                type="date"
                value={s.date}
                onChange={(e) =>
                  setForm({
                    ...form,
                    coreTeamSignOffs: form.coreTeamSignOffs.map((row, i) =>
                      i === idx ? { ...row, date: e.target.value } : row,
                    ),
                  })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono border border-[#E6E6E6] rounded"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
