import React, { useEffect, useState } from 'react';
import { Calendar, Link2, PenLine, Printer, RotateCcw, Save, Star } from 'lucide-react';
import type { Form4TimingPlan, UserAccount } from '../../types/pcms';
import { createEmptyWeeks } from '../../utils/workflow';

interface TimingPlanProps {
  data: Form4TimingPlan;
  currentUser?: UserAccount;
  saving: boolean;
  onSave: (updated: Form4TimingPlan) => Promise<void>;
  onPrintOfficial: () => void;
}

function buildWeeksArray(count: number): boolean[] {
  const clamped = Math.max(0, Math.min(24, Math.round(count)));
  return Array.from({ length: 24 }, (_, idx) => idx < clamped);
}

export function TimingPlan({
  data,
  currentUser,
  saving,
  onSave,
  onPrintOfficial,
}: TimingPlanProps) {
  const [form, setForm] = useState<Form4TimingPlan>(data);

  useEffect(() => {
    setForm(data);
  }, [data]);

  const today = new Date().toISOString().slice(0, 10);

  function updateActivityWeekCount(
    actId: string,
    type: 'plannedWeeks' | 'actualWeeks',
    weeksCount: number,
  ) {
    setForm((prev) => ({
      ...prev,
      activities: prev.activities.map((act) =>
        act.id === actId ? { ...act, [type]: buildWeeksArray(weeksCount) } : act,
      ),
    }));
  }

  function clearActivityRow(actId: string) {
    setForm((prev) => ({
      ...prev,
      activities: prev.activities.map((act) =>
        act.id === actId
          ? { ...act, plannedWeeks: createEmptyWeeks(), actualWeeks: createEmptyWeeks(), remarks: '' }
          : act,
      ),
    }));
  }

  function toggleFlag(flag: 'AA' | 'A' | 'B' | 'C') {
    setForm((prev) => ({
      ...prev,
      productTypeFlags: prev.productTypeFlags.includes(flag)
        ? prev.productTypeFlags.filter((f) => f !== flag)
        : [...prev.productTypeFlags, flag],
    }));
  }

  function toggleReviewMode(mode: 'Initial Plan' | 'Actual Status' | 'Plan for Remaining') {
    setForm((prev) => ({
      ...prev,
      reviewMode: prev.reviewMode.includes(mode)
        ? prev.reviewMode.filter((m) => m !== mode)
        : [...prev.reviewMode, mode],
    }));
  }

  const totalPlanned = form.activities.reduce(
    (sum, a) => sum + a.plannedWeeks.filter(Boolean).length,
    0,
  );
  const totalActual = form.activities.reduce(
    (sum, a) => sum + a.actualWeeks.filter(Boolean).length,
    0,
  );
  const criticalCount = form.activities.filter((a) => a.isCritical).length;

  return (
    <div className="space-y-6">
      <div className="surface-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C6470]">
            <span className="font-mono font-bold text-[#111318]">QF/07/MKT-08</span>
            <span>·</span>
            <span>Rev.No: 05 dt. 01.12.2024</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#D97700] font-semibold">
              <Link2 className="w-3.5 h-3.5" /> Linked to {form.drawingPartNo}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#111318]">
            Form 4 — Timing Plan (APQP Phase I Milestone Schedule)
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
            <span>{saving ? 'Saving...' : 'Save Timing Plan'}</span>
          </button>
        </div>
      </div>

      {/* Header Metadata & AA/A/B/C Checkboxes */}
      <div className="surface-card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="field-label">Project Name</label>
            <input
              type="text"
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Drg.No / Part No</label>
            <input
              type="text"
              readOnly
              value={form.drawingPartNo}
              className="field-input font-mono bg-[#F8F9FB]"
            />
          </div>
          <div>
            <label className="field-label">Product Name</label>
            <input
              type="text"
              readOnly
              value={form.productName}
              className="field-input bg-[#F8F9FB]"
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
            <label className="field-label">Prepared Date</label>
            <input
              type="date"
              value={form.preparedDate}
              onChange={(e) => setForm({ ...form, preparedDate: e.target.value })}
              className="field-input font-mono"
            />
          </div>
          <div>
            <label className="field-label">Last Rev Date</label>
            <input
              type="date"
              value={form.lastRevDate}
              onChange={(e) => setForm({ ...form, lastRevDate: e.target.value })}
              className="field-input font-mono"
            />
          </div>
          <div>
            <label className="field-label">Revision</label>
            <input
              type="text"
              value={form.revision}
              onChange={(e) => setForm({ ...form, revision: e.target.value })}
              className="field-input font-mono"
            />
          </div>
          <div>
            <span className="field-label">Classification (AA/A New · B/C Change)</span>
            <div className="flex gap-2">
              {(['AA', 'A', 'B', 'C'] as const).map((flag) => (
                <button
                  key={flag}
                  type="button"
                  onClick={() => toggleFlag(flag)}
                  className={`flex-1 h-10 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                    form.productTypeFlags.includes(flag)
                      ? 'bg-[#F28C00] text-white border-[#F28C00]'
                      : 'bg-white text-[#111318] border-[#E4E7EC] hover:border-[#111318]'
                  }`}
                >
                  {flag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stakeholder Milestone Alignment Notes */}
      <div className="surface-card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E4E7EC] pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#F28C00]" />
            <h4 className="text-sm font-bold text-[#111318]">
              Stakeholder Timeline Alignment Notes
            </h4>
          </div>
          <span className="text-xs text-[#5C6470] tabular-nums">
            {form.activities.length} APQP Activities · {criticalCount} Critical (***) · {totalActual}/{totalPlanned} Wks Logged
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="field-label">Customer Timeline Notes</label>
            <input
              type="text"
              value={form.customerTimelineRemarks}
              onChange={(e) => setForm({ ...form, customerTimelineRemarks: e.target.value })}
              placeholder="Customer PPAP / SOP target notes..."
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Internal CFT Timeline Notes</label>
            <input
              type="text"
              value={form.internalTimelineRemarks}
              onChange={(e) => setForm({ ...form, internalTimelineRemarks: e.target.value })}
              placeholder="Internal tooling, PTR & QA readiness..."
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Tier 2 (Sub-Supplier) Timeline Notes</label>
            <input
              type="text"
              value={form.tier2TimelineRemarks}
              onChange={(e) => setForm({ ...form, tier2TimelineRemarks: e.target.value })}
              placeholder="Sub-supplier / raw casting alignment..."
              className="field-input"
            />
          </div>
        </div>
      </div>

      {/* APQP Phase I Activity Schedule Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#121417] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="h-10 px-6">APQP Phase / Activity</th>
                <th className="h-10 px-4">Applicability</th>
                <th className="h-10 px-4 text-center">Planned (Wks)</th>
                <th className="h-10 px-4 text-center">Actual (Wks)</th>
                <th className="h-10 px-4">Status</th>
                <th className="h-10 px-4">Remarks</th>
                <th className="h-10 px-6 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {form.activities.map((act) => {
                const pCount = act.plannedWeeks.filter(Boolean).length;
                const aCount = act.actualWeeks.filter(Boolean).length;
                return (
                  <tr key={act.id} className="hover:bg-[#F8F9FB] transition-colors">
                    <td className="py-4 px-6 font-semibold text-[#111318]">
                      <span>{act.activity}</span>
                      {act.isCritical && (
                        <span className="ml-1.5 text-red-600 font-bold">***</span>
                      )}
                    </td>
                    <td className="py-4 px-4 font-mono text-xs text-[#5C6470] whitespace-nowrap">
                      {act.applicability}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <input
                        type="number"
                        min={0}
                        max={24}
                        aria-label={`Planned weeks for ${act.activity}`}
                        value={pCount}
                        onChange={(e) =>
                          updateActivityWeekCount(act.id, 'plannedWeeks', Number(e.target.value))
                        }
                        className="w-16 h-8 px-2 text-center font-mono text-xs border border-[#E4E7EC] rounded-md tabular-nums focus:outline-none focus:border-[#F28C00]"
                      />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <input
                        type="number"
                        min={0}
                        max={24}
                        aria-label={`Actual weeks for ${act.activity}`}
                        value={aCount}
                        onChange={(e) =>
                          updateActivityWeekCount(act.id, 'actualWeeks', Number(e.target.value))
                        }
                        className="w-16 h-8 px-2 text-center font-mono text-xs border border-[#E4E7EC] rounded-md tabular-nums focus:outline-none focus:border-[#F28C00]"
                      />
                    </td>
                    <td className="py-4 px-4 text-xs font-bold whitespace-nowrap">
                      {aCount >= pCount && pCount > 0 ? (
                        <span className="text-emerald-700">On Schedule</span>
                      ) : aCount > 0 ? (
                        <span className="text-[#D97700]">In Progress</span>
                      ) : (
                        <span className="text-[#5C6470]">Planned</span>
                      )}
                    </td>
                    <td className="py-4 px-4 min-w-[200px]">
                      <input
                        type="text"
                        value={act.remarks}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            activities: prev.activities.map((a) =>
                              a.id === act.id ? { ...a, remarks: e.target.value } : a,
                            ),
                          }))
                        }
                        placeholder="Add remarks..."
                        className="w-full h-8 px-3 text-xs border border-[#E4E7EC] rounded-md focus:border-[#F28C00] focus:outline-none"
                      />
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          title="Toggle Critical Milestone (***)"
                          aria-label={`Toggle critical milestone for ${act.activity}`}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              activities: prev.activities.map((a) =>
                                a.id === act.id ? { ...a, isCritical: !a.isCritical } : a,
                              ),
                            }))
                          }
                          className={`w-8 h-8 inline-flex items-center justify-center rounded-md cursor-pointer ${
                            act.isCritical
                              ? 'text-[#F28C00]'
                              : 'text-[#C2C8D1] hover:text-[#5C6470]'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          type="button"
                          title="Reset activity"
                          aria-label={`Reset ${act.activity}`}
                          onClick={() => clearActivityRow(act.id)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-md text-[#C2C8D1] hover:text-red-600 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Review & Go/No-Go */}
      <div className="surface-card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E4E7EC]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-bold text-[#5C6470] uppercase tracking-wider">Reviewed By:</span>
            {(['Initial Plan', 'Actual Status', 'Plan for Remaining'] as const).map((m) => (
              <label key={m} className="inline-flex items-center gap-2 text-xs font-semibold text-[#111318] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.reviewMode.includes(m)}
                  onChange={() => toggleReviewMode(m)}
                  className="accent-[#F28C00]"
                />
                <span>{m}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#111318]">Go for next Phase:</span>
            {(['Yes', 'No', 'Pending'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setForm({ ...form, goForNextPhase: opt })}
                className={`h-8 px-3 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                  form.goForNextPhase === opt
                    ? opt === 'Yes'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : opt === 'No'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-[#111318] text-white border-[#111318]'
                    : 'bg-white text-[#5C6470] border-[#E4E7EC] hover:border-[#111318]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {form.cftMembers.map((mem, idx) => (
            <input
              key={idx}
              type="text"
              value={mem}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  cftMembers: prev.cftMembers.map((m, i) => (i === idx ? e.target.value : m)),
                }))
              }
              placeholder={`CFT Member ${idx + 1}`}
              className="field-input"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="field-label">Remarks</label>
            <input
              type="text"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#5C6470]">CFT Leader Signature</label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, cftLeaderSign: `${currentUser.name} (${today})` })}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97700] hover:underline cursor-pointer"
                >
                  <PenLine className="w-3 h-3" /> Sign as Me
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.cftLeaderSign}
              onChange={(e) => setForm({ ...form, cftLeaderSign: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#5C6470]">Plant Head Signature</label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, plantHeadSign: `${currentUser.name} (${today})` })}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97700] hover:underline cursor-pointer"
                >
                  <PenLine className="w-3 h-3" /> Sign as Me
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.plantHeadSign}
              onChange={(e) => setForm({ ...form, plantHeadSign: e.target.value })}
              className="field-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
