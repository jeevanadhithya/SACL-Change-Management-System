import React, { useEffect, useState } from 'react';
import { Check, Link2, Lock, PenLine, Printer, Save } from 'lucide-react';
import type { Form6PTR, PTRStageDetail, UserAccount } from '../../types/pcms';
import { canAdvancePTRStage } from '../../utils/workflow';

interface PtrInitiationFormProps {
  data: Form6PTR;
  currentUser?: UserAccount;
  saving: boolean;
  onSave: (updated: Form6PTR) => Promise<void>;
  onPrintOfficial: () => void;
}

export function PtrInitiationForm({
  data,
  currentUser,
  saving,
  onSave,
  onPrintOfficial,
}: PtrInitiationFormProps) {
  const [form, setForm] = useState<Form6PTR>(data);

  useEffect(() => {
    setForm(data);
  }, [data]);

  const today = new Date().toISOString().slice(0, 10);
  const ptr2Gate = canAdvancePTRStage(form, 'ptr2');
  const ptr3Gate = canAdvancePTRStage(form, 'ptr3');

  function updateStage(stageKey: 'ptr1' | 'ptr2' | 'ptr3', patch: Partial<PTRStageDetail>) {
    setForm((prev) => ({
      ...prev,
      [stageKey]: { ...prev[stageKey], ...patch },
    }));
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
            <span className="font-mono font-bold text-[#151515]">QF/07/MRO-16</span>
            <span>·</span>
            <span>14.08.2017 · Mandatory Stage 6</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#E87500] font-semibold">
              <Link2 className="w-3.5 h-3.5" /> Linked to {form.partNameNumber}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#151515] mt-0.5">
            Form 6 — PTR Initiation Form (Production Trial Run)
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
            <span>{saving ? 'Saving...' : 'Save PTR Form'}</span>
          </button>
        </div>
      </div>

      {/* Linked Details of Request */}
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
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">Rev. Number</label>
          <input
            type="text"
            value={form.revNumber}
            onChange={(e) => setForm({ ...form, revNumber: e.target.value })}
            className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-[#666666] mb-1">Reason</label>
          <input
            type="text"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[#666666]">Request Signature</label>
            {currentUser && (
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    requestSignature: `${currentUser.name} (${today})`,
                    requestDate: form.requestDate || today,
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
            value={form.requestSignature}
            onChange={(e) => setForm({ ...form, requestSignature: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
          />
        </div>
      </div>

      {/* 3-Stage PTR Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {(
          [
            { key: 'ptr1', title: 'PTR 1 — Initial Trial (5 Nos)', locked: false, reason: '' },
            {
              key: 'ptr2',
              title: 'PTR 2 — Validation Run (25 Nos)',
              locked: !ptr2Gate.allowed,
              reason: ptr2Gate.reason || '',
            },
            {
              key: 'ptr3',
              title: 'PTR 3 — Pilot Lot (50 Nos)',
              locked: !ptr3Gate.allowed,
              reason: ptr3Gate.reason || '',
            },
          ] as const
        ).map(({ key, title, locked, reason }) => {
          const st = form[key];
          return (
            <div
              key={key}
              className={`bg-white border rounded-xl p-5 space-y-3 ${
                locked ? 'border-[#E6E6E6] opacity-75' : 'border-[#E6E6E6]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#E6E6E6] pb-2">
                <h4 className="text-sm font-bold text-[#151515]">{title}</h4>
                {locked && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E87500]">
                    <Lock className="w-3.5 h-3.5" /> Locked
                  </span>
                )}
              </div>

              {locked && (
                <p className="text-xs text-[#666666] bg-[#FFF4E5]/60 p-2.5 rounded-lg">{reason}</p>
              )}

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#666666]">1. If Required</span>
                  <select
                    disabled={locked}
                    value={st.required}
                    onChange={(e) => updateStage(key, { required: e.target.value as 'Yes' | 'No' })}
                    className="px-2.5 py-1 border border-[#E6E6E6] rounded bg-white font-semibold"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#666666] mb-1">
                    2. Date of Production Run
                  </label>
                  <input
                    type="date"
                    disabled={locked}
                    value={st.productionRunDate}
                    onChange={(e) => updateStage(key, { productionRunDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 font-mono border border-[#E6E6E6] rounded"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#666666] mb-1">
                    3. Quantity Produced
                  </label>
                  <input
                    type="text"
                    disabled={locked}
                    value={st.quantityProduced}
                    onChange={(e) => updateStage(key, { quantityProduced: e.target.value })}
                    className="w-full px-2.5 py-1.5 font-mono border border-[#E6E6E6] rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#666666]">4. Meets Drawing Req.</span>
                  <select
                    disabled={locked}
                    value={st.meetsDrawingReq}
                    onChange={(e) =>
                      updateStage(key, {
                        meetsDrawingReq: e.target.value as 'Yes' | 'No' | 'Pending',
                      })
                    }
                    className="px-2.5 py-1 border border-[#E6E6E6] rounded bg-white font-semibold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#666666]">5. Sample Submission Req.</span>
                  <select
                    disabled={locked}
                    value={st.sampleSubmissionReq}
                    onChange={(e) =>
                      updateStage(key, { sampleSubmissionReq: e.target.value as 'Yes' | 'No' })
                    }
                    className="px-2.5 py-1 border border-[#E6E6E6] rounded bg-white font-semibold"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#666666] mb-1">
                    6. Sample Submitted Date
                  </label>
                  <input
                    type="date"
                    disabled={locked}
                    value={st.sampleSubmittedDate}
                    onChange={(e) => updateStage(key, { sampleSubmittedDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 font-mono border border-[#E6E6E6] rounded"
                  />
                </div>

                <div>
                  <span className="block font-semibold text-[#666666] mb-1">
                    7. Status of Samples Submitted
                  </span>
                  <div className="flex gap-1.5">
                    {(['OK', 'Not OK', 'Pending'] as const).map((statusOpt) => (
                      <button
                        key={statusOpt}
                        type="button"
                        disabled={locked}
                        onClick={() => updateStage(key, { sampleStatus: statusOpt })}
                        className={`flex-1 py-1.5 rounded text-xs font-bold border cursor-pointer disabled:cursor-not-allowed ${
                          st.sampleStatus === statusOpt
                            ? statusOpt === 'OK'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : statusOpt === 'Not OK'
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-[#151515] text-white border-[#151515]'
                            : 'bg-white text-[#666666] border-[#E6E6E6]'
                        }`}
                      >
                        {statusOpt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-[#666666] mb-1">
                    Comments / Action Plan ({key.toUpperCase()})
                  </label>
                  <textarea
                    rows={2}
                    disabled={locked}
                    value={st.actionPlanComments}
                    onChange={(e) => updateStage(key, { actionPlanComments: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#E6E6E6] rounded"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Approved By Core Team Matrix (Concerned Authority) */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
        <div className="px-5 py-3 bg-[#F7F7F7] border-b border-[#E6E6E6]">
          <h4 className="text-sm font-bold text-[#151515]">
            Approved By Core Team (Concerned Authority Sign-Offs)
          </h4>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F7F7] border-b border-[#E6E6E6] text-[11px] font-bold text-[#666666] uppercase">
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">PTR 1 Status &amp; Sign</th>
                <th className="py-2.5 px-3">PTR 2 Status &amp; Sign</th>
                <th className="py-2.5 px-3">PTR 3 Status &amp; Sign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E6]">
              {form.coreTeamApprovals.map((row, idx) => (
                <tr key={row.department}>
                  <td className="p-3 font-bold text-[#151515]">{row.department}</td>
                  {(['ptr1', 'ptr2', 'ptr3'] as const).map((pKey) => {
                    const stField = `${pKey}Status` as const;
                    const sgField = `${pKey}Sign` as const;
                    return (
                      <td key={pKey} className="p-2.5">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={row[stField]}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                coreTeamApprovals: prev.coreTeamApprovals.map((r, i) =>
                                  i === idx ? { ...r, [stField]: e.target.value } : r,
                                ),
                              }))
                            }
                            className="px-2 py-1 border border-[#E6E6E6] rounded bg-white font-semibold"
                          >
                            <option value="Pending">Pending</option>
                            <option value="OK">OK</option>
                            <option value="Not OK">Not OK</option>
                          </select>
                          <input
                            type="text"
                            value={row[sgField]}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                coreTeamApprovals: prev.coreTeamApprovals.map((r, i) =>
                                  i === idx ? { ...r, [sgField]: e.target.value } : r,
                                ),
                              }))
                            }
                            placeholder="Sign"
                            className="w-24 px-2 py-1 border border-[#E6E6E6] rounded"
                          />
                          {currentUser && (
                            <button
                              type="button"
                              title={`Mark ${pKey.toUpperCase()} OK & Sign as Me`}
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  coreTeamApprovals: prev.coreTeamApprovals.map((r, i) =>
                                    i === idx
                                      ? { ...r, [stField]: 'OK', [sgField]: currentUser.name }
                                      : r,
                                  ),
                                }))
                              }
                              className="p-1 text-emerald-700 hover:bg-emerald-50 rounded border border-[#E6E6E6] cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Final PTR Logistics Fields */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-[#666666] mb-1">CFT Comments</label>
          <textarea
            rows={2}
            value={form.cftComments}
            onChange={(e) => setForm({ ...form, cftComments: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">Break Point Date</label>
          <input
            type="date"
            value={form.breakPointDate}
            onChange={(e) => setForm({ ...form, breakPointDate: e.target.value })}
            className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#666666] mb-1">Invoice Details</label>
          <input
            type="text"
            value={form.invoiceDetails}
            onChange={(e) => setForm({ ...form, invoiceDetails: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-[#666666] mb-1">
            Identification on Part / Box / Trolley
          </label>
          <input
            type="text"
            value={form.identificationOnPartBoxTrolley}
            onChange={(e) => setForm({ ...form, identificationOnPartBoxTrolley: e.target.value })}
            placeholder="Green PTR Tag / Batch Label reference..."
            className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
