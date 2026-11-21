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
      <div className="surface-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C6470]">
            <span className="font-mono font-bold text-[#111318]">QF/07/MRO-16</span>
            <span>·</span>
            <span>14.08.2017 · Mandatory Stage 6</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#D97700] font-semibold">
              <Link2 className="w-3.5 h-3.5" /> Linked to {form.partNameNumber}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#111318]">
            Form 6 — PTR Initiation Form (Production Trial Run)
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button type="button" onClick={onPrintOfficial} className="btn-secondary">
            <Printer className="w-4 h-4" />
            <span>Print Official Format</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(form)}
            className="btn-primary"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save PTR Form'}</span>
          </button>
        </div>
      </div>

      {/* Linked Details of Request */}
      <div className="surface-card p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="field-label">From</label>
          <input
            type="text"
            value={form.from}
            onChange={(e) => setForm({ ...form, from: e.target.value })}
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label">Department</label>
          <input
            type="text"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="field-input"
          />
        </div>
        <div>
          <label className="field-label">Customer</label>
          <input
            type="text"
            readOnly
            value={form.customer}
            className="field-input bg-[#F8F9FB]"
          />
        </div>
        <div>
          <label className="field-label">Part Name / Number</label>
          <input
            type="text"
            readOnly
            value={form.partNameNumber}
            className="field-input bg-[#F8F9FB]"
          />
        </div>
        <div>
          <label className="field-label">Rev. Number</label>
          <input
            type="text"
            value={form.revNumber}
            onChange={(e) => setForm({ ...form, revNumber: e.target.value })}
            className="field-input font-mono"
          />
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Reason</label>
          <input
            type="text"
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            className="field-input"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[#5C6470]">Request Signature</label>
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
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97700] hover:underline cursor-pointer"
              >
                <PenLine className="w-3 h-3" /> Sign as Me
              </button>
            )}
          </div>
          <input
            type="text"
            value={form.requestSignature}
            onChange={(e) => setForm({ ...form, requestSignature: e.target.value })}
            className="field-input"
          />
        </div>
      </div>

      {/* 3-Stage PTR Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              className={`surface-card p-6 space-y-4 ${locked ? 'opacity-75' : ''}`}
            >
              <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-4">
                <h4 className="text-sm font-bold text-[#111318]">{title}</h4>
                {locked && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D97700]">
                    <Lock className="w-3.5 h-3.5" /> Locked
                  </span>
                )}
              </div>

              {locked && (
                <p className="text-xs text-[#5C6470] bg-[#FFF5E8] p-4 rounded-lg">{reason}</p>
              )}

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#5C6470]">1. If Required</span>
                  <select
                    disabled={locked}
                    value={st.required}
                    onChange={(e) => updateStage(key, { required: e.target.value as 'Yes' | 'No' })}
                    className="h-8 px-3 border border-[#E4E7EC] rounded-lg bg-white font-semibold"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">2. Date of Production Run</label>
                  <input
                    type="date"
                    disabled={locked}
                    value={st.productionRunDate}
                    onChange={(e) => updateStage(key, { productionRunDate: e.target.value })}
                    className="field-input !h-8 !text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="field-label">3. Quantity Produced</label>
                  <input
                    type="text"
                    disabled={locked}
                    value={st.quantityProduced}
                    onChange={(e) => updateStage(key, { quantityProduced: e.target.value })}
                    className="field-input !h-8 !text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#5C6470]">4. Meets Drawing Req.</span>
                  <select
                    disabled={locked}
                    value={st.meetsDrawingReq}
                    onChange={(e) =>
                      updateStage(key, {
                        meetsDrawingReq: e.target.value as 'Yes' | 'No' | 'Pending',
                      })
                    }
                    className="h-8 px-3 border border-[#E4E7EC] rounded-lg bg-white font-semibold"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#5C6470]">5. Sample Submission Req.</span>
                  <select
                    disabled={locked}
                    value={st.sampleSubmissionReq}
                    onChange={(e) =>
                      updateStage(key, { sampleSubmissionReq: e.target.value as 'Yes' | 'No' })
                    }
                    className="h-8 px-3 border border-[#E4E7EC] rounded-lg bg-white font-semibold"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">6. Sample Submitted Date</label>
                  <input
                    type="date"
                    disabled={locked}
                    value={st.sampleSubmittedDate}
                    onChange={(e) => updateStage(key, { sampleSubmittedDate: e.target.value })}
                    className="field-input !h-8 !text-xs font-mono"
                  />
                </div>

                <div>
                  <span className="field-label">7. Status of Samples Submitted</span>
                  <div className="flex gap-2">
                    {(['OK', 'Not OK', 'Pending'] as const).map((statusOpt) => (
                      <button
                        key={statusOpt}
                        type="button"
                        disabled={locked}
                        onClick={() => updateStage(key, { sampleStatus: statusOpt })}
                        className={`flex-1 h-8 rounded-lg text-xs font-bold border cursor-pointer disabled:cursor-not-allowed transition-colors ${
                          st.sampleStatus === statusOpt
                            ? statusOpt === 'OK'
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : statusOpt === 'Not OK'
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-[#111318] text-white border-[#111318]'
                            : 'bg-white text-[#5C6470] border-[#E4E7EC] hover:border-[#111318]'
                        }`}
                      >
                        {statusOpt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="field-label">
                    Comments / Action Plan ({key.toUpperCase()})
                  </label>
                  <textarea
                    rows={2}
                    disabled={locked}
                    value={st.actionPlanComments}
                    onChange={(e) => updateStage(key, { actionPlanComments: e.target.value })}
                    className="field-textarea !text-xs"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Approved By Core Team Matrix (Concerned Authority) */}
      <div className="surface-card overflow-hidden">
        <div className="surface-header">
          <h4 className="text-sm font-bold text-[#111318]">
            Approved By Core Team (Concerned Authority Sign-Offs)
          </h4>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-bold text-[#5C6470] uppercase tracking-wider">
                <th className="h-10 px-6">Department</th>
                <th className="h-10 px-4">PTR 1 Status &amp; Sign</th>
                <th className="h-10 px-4">PTR 2 Status &amp; Sign</th>
                <th className="h-10 px-6">PTR 3 Status &amp; Sign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {form.coreTeamApprovals.map((row, idx) => (
                <tr key={row.department} className="hover:bg-[#F8F9FB] transition-colors">
                  <td className="py-4 px-6 font-bold text-[#111318]">{row.department}</td>
                  {(['ptr1', 'ptr2', 'ptr3'] as const).map((pKey) => {
                    const stField = `${pKey}Status` as const;
                    const sgField = `${pKey}Sign` as const;
                    return (
                      <td key={pKey} className="py-3 px-4">
                        <div className="flex items-center gap-2">
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
                            className="h-8 px-2 border border-[#E4E7EC] rounded-md bg-white font-semibold"
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
                            className="w-24 h-8 px-2 border border-[#E4E7EC] rounded-md"
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
                              className="w-8 h-8 inline-flex items-center justify-center text-emerald-700 hover:bg-emerald-50 rounded-md border border-[#E4E7EC] cursor-pointer shrink-0"
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
      <div className="surface-card p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-4">
          <label className="field-label">CFT Comments</label>
          <textarea
            rows={2}
            value={form.cftComments}
            onChange={(e) => setForm({ ...form, cftComments: e.target.value })}
            className="field-textarea"
          />
        </div>
        <div>
          <label className="field-label">Break Point Date</label>
          <input
            type="date"
            value={form.breakPointDate}
            onChange={(e) => setForm({ ...form, breakPointDate: e.target.value })}
            className="field-input font-mono"
          />
        </div>
        <div>
          <label className="field-label">Invoice Details</label>
          <input
            type="text"
            value={form.invoiceDetails}
            onChange={(e) => setForm({ ...form, invoiceDetails: e.target.value })}
            className="field-input"
          />
        </div>
        <div className="md:col-span-2">
          <label className="field-label">Identification on Part / Box / Trolley</label>
          <input
            type="text"
            value={form.identificationOnPartBoxTrolley}
            onChange={(e) => setForm({ ...form, identificationOnPartBoxTrolley: e.target.value })}
            placeholder="Green PTR Tag / Batch Label reference..."
            className="field-input"
          />
        </div>
      </div>
    </div>
  );
}
