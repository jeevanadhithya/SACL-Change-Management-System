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
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
            <span className="font-mono font-bold text-[#151515]">QF/07/MKT-08</span>
            <span>·</span>
            <span>Rev.No: 05 dt. 01.12.2024</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#E87500] font-semibold">
              <Link2 className="w-3.5 h-3.5" /> Linked to {form.drawingPartNo}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#151515] mt-0.5">
            Form 4 — Timing Plan (APQP Phase I Milestone Schedule)
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
            <span>{saving ? 'Saving...' : 'Save Timing Plan'}</span>
          </button>
        </div>
      </div>

      {/* Header Metadata & AA/A/B/C Checkboxes */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Project Name</label>
            <input
              type="text"
              value={form.projectName}
              onChange={(e) => setForm({ ...form, projectName: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Drg.No / Part No</label>
            <input
              type="text"
              readOnly
              value={form.drawingPartNo}
              className="w-full px-3 py-2 text-sm font-mono bg-[#F7F7F7] border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Product Name</label>
            <input
              type="text"
              readOnly
              value={form.productName}
              className="w-full px-3 py-2 text-sm bg-[#F7F7F7] border border-[#E6E6E6] rounded-lg"
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
            <label className="block text-xs font-semibold text-[#666666] mb-1">Prepared Date</label>
            <input
              type="date"
              value={form.preparedDate}
              onChange={(e) => setForm({ ...form, preparedDate: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Last Rev Date</label>
            <input
              type="date"
              value={form.lastRevDate}
              onChange={(e) => setForm({ ...form, lastRevDate: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Revision</label>
            <input
              type="text"
              value={form.revision}
              onChange={(e) => setForm({ ...form, revision: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <span className="block text-xs font-semibold text-[#666666] mb-1.5">
              Classification (AA/A New · B/C Change)
            </span>
            <div className="flex gap-1.5">
              {(['AA', 'A', 'B', 'C'] as const).map((flag) => (
                <button
                  key={flag}
                  type="button"
                  onClick={() => toggleFlag(flag)}
                  className={`flex-1 py-1.5 rounded text-xs font-bold border cursor-pointer ${
                    form.productTypeFlags.includes(flag)
                      ? 'bg-[#F28C00] text-white border-[#F28C00]'
                      : 'bg-white text-[#151515] border-[#E6E6E6]'
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
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E6E6] pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#F28C00]" />
            <h4 className="text-sm font-bold text-[#151515]">
              Stakeholder Timeline Alignment Notes
            </h4>
          </div>
          <span className="text-xs text-[#666666] tabular-nums">
            {form.activities.length} APQP Activities · {criticalCount} Critical (***) · {totalActual}/{totalPlanned} Wks Logged
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Customer Timeline Notes
            </label>
            <input
              type="text"
              value={form.customerTimelineRemarks}
              onChange={(e) => setForm({ ...form, customerTimelineRemarks: e.target.value })}
              placeholder="Customer PPAP / SOP target notes..."
              className="w-full px-3 py-2 text-xs border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Internal CFT Timeline Notes
            </label>
            <input
              type="text"
              value={form.internalTimelineRemarks}
              onChange={(e) => setForm({ ...form, internalTimelineRemarks: e.target.value })}
              placeholder="Internal tooling, PTR & QA readiness..."
              className="w-full px-3 py-2 text-xs border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Tier 2 (Sub-Supplier) Timeline Notes
            </label>
            <input
              type="text"
              value={form.tier2TimelineRemarks}
              onChange={(e) => setForm({ ...form, tier2TimelineRemarks: e.target.value })}
              placeholder="Sub-supplier / raw casting alignment..."
              className="w-full px-3 py-2 text-xs border border-[#E6E6E6] rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* APQP Phase I Activity Schedule Table */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#151515] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">APQP Phase / Activity</th>
                <th className="py-3 px-4">Applicability</th>
                <th className="py-3 px-4 text-center">Planned (Wks)</th>
                <th className="py-3 px-4 text-center">Actual (Wks)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4 text-right">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E6]">
              {form.activities.map((act) => {
                const pCount = act.plannedWeeks.filter(Boolean).length;
                const aCount = act.actualWeeks.filter(Boolean).length;
                return (
                  <tr key={act.id} className="hover:bg-[#F7F7F7]/60">
                    <td className="py-3 px-4 font-semibold text-[#151515]">
                      <span>{act.activity}</span>
                      {act.isCritical && (
                        <span className="ml-1.5 text-red-600 font-bold">***</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#666666] whitespace-nowrap">
                      {act.applicability}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min={0}
                        max={24}
                        aria-label={`Planned weeks for ${act.activity}`}
                        value={pCount}
                        onChange={(e) =>
                          updateActivityWeekCount(act.id, 'plannedWeeks', Number(e.target.value))
                        }
                        className="w-16 px-2 py-1 text-center font-mono text-xs border border-[#E6E6E6] rounded-md tabular-nums"
                      />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <input
                        type="number"
                        min={0}
                        max={24}
                        aria-label={`Actual weeks for ${act.activity}`}
                        value={aCount}
                        onChange={(e) =>
                          updateActivityWeekCount(act.id, 'actualWeeks', Number(e.target.value))
                        }
                        className="w-16 px-2 py-1 text-center font-mono text-xs border border-[#E6E6E6] rounded-md tabular-nums"
                      />
                    </td>
                    <td className="py-3 px-4 text-xs font-bold whitespace-nowrap">
                      {aCount >= pCount && pCount > 0 ? (
                        <span className="text-emerald-700">On Schedule</span>
                      ) : aCount > 0 ? (
                        <span className="text-[#E87500]">In Progress</span>
                      ) : (
                        <span className="text-[#666666]">Planned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 min-w-[200px]">
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
                        className="w-full px-2.5 py-1.5 text-xs border border-[#E6E6E6] rounded-md focus:border-[#F28C00] focus:outline-none"
                      />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
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
                          className={`p-1 rounded cursor-pointer ${
                            act.isCritical
                              ? 'text-[#F28C00]'
                              : 'text-neutral-300 hover:text-neutral-500'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          type="button"
                          title="Reset activity"
                          aria-label={`Reset ${act.activity}`}
                          onClick={() => clearActivityRow(act.id)}
                          className="p-1 rounded text-neutral-300 hover:text-red-600 cursor-pointer"
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
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#E6E6E6]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-bold text-[#666666] uppercase">Reviewed By:</span>
            {(['Initial Plan', 'Actual Status', 'Plan for Remaining'] as const).map((m) => (
              <label key={m} className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
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
            <span className="text-xs font-bold text-[#151515]">Go for next Phase:</span>
            {(['Yes', 'No', 'Pending'] as const).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setForm({ ...form, goForNextPhase: opt })}
                className={`px-3 py-1 rounded text-xs font-bold border cursor-pointer ${
                  form.goForNextPhase === opt
                    ? opt === 'Yes'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : opt === 'No'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-[#151515] text-white border-[#151515]'
                    : 'bg-white text-[#666666] border-[#E6E6E6]'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              className="px-3 py-1.5 text-xs border border-[#E6E6E6] rounded-lg"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Remarks</label>
            <input
              type="text"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#666666]">CFT Leader Signature</label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, cftLeaderSign: `${currentUser.name} (${today})` })}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E87500] hover:underline cursor-pointer"
                >
                  <PenLine className="w-3 h-3" /> Sign as Me
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.cftLeaderSign}
              onChange={(e) => setForm({ ...form, cftLeaderSign: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#666666]">Plant Head Signature</label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, plantHeadSign: `${currentUser.name} (${today})` })}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E87500] hover:underline cursor-pointer"
                >
                  <PenLine className="w-3 h-3" /> Sign as Me
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.plantHeadSign}
              onChange={(e) => setForm({ ...form, plantHeadSign: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
