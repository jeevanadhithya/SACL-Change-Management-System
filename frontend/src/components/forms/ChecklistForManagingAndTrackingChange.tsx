import React, { useEffect, useState } from 'react';
import { CheckCheck, CheckCircle2, Filter, Link2, PenLine, Plus, Printer, Save } from 'lucide-react';
import type {
  ChangeChecklistItem,
  Form5ChangeChecklist,
  UserAccount,
} from '../../types/pcms';
import { computeChecklistProgress } from '../../utils/workflow';

interface ChecklistForManagingAndTrackingChangeProps {
  data: Form5ChangeChecklist;
  currentUser?: UserAccount;
  saving: boolean;
  onSave: (updated: Form5ChangeChecklist) => Promise<void>;
  onPrintOfficial: () => void;
}

const RESPONSIBILITY_DROPDOWN = [
  '',
  'Foundry QA',
  'Machine Shop QA',
  'Production Lead',
  'Tooling & Fixtures',
  'NPD / Engineering',
  'Planning',
  'Maintenance',
  'Marketing',
  'CFT Leader',
  'N/A',
];

export function ChecklistForManagingAndTrackingChange({
  data,
  currentUser,
  saving,
  onSave,
  onPrintOfficial,
}: ChecklistForManagingAndTrackingChangeProps) {
  const [form, setForm] = useState<Form5ChangeChecklist>(data);
  const [activePage, setActivePage] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [onlyAffected, setOnlyAffected] = useState(false);

  useEffect(() => {
    setForm(data);
  }, [data]);

  const progress = computeChecklistProgress(form.items);
  const pageItems =
    activePage === 0 ? form.items : form.items.filter((i) => i.page === activePage);
  const visibleItems = onlyAffected
    ? pageItems.filter((i) => i.isAffected === 'Yes')
    : pageItems;

  function updateItem(id: string, patch: Partial<ChangeChecklistItem>) {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  }

  function markVisiblePendingAsNo() {
    const visibleIds = new Set(visibleItems.filter((i) => i.isAffected === 'Pending').map((i) => i.id));
    if (visibleIds.size === 0) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        visibleIds.has(item.id) ? { ...item, isAffected: 'No' } : item,
      ),
    }));
  }

  function addCustomItem() {
    const targetPage = activePage === 0 ? 4 : activePage;
    const newItem: ChangeChecklistItem = {
      id: `chk-custom-${Date.now()}`,
      page: targetPage as 1 | 2 | 3 | 4,
      impactArea: 'Additional Change Impact Item',
      isAffected: 'Pending',
      actionComments: '',
      responsibility: '',
      reqdDate: '',
      actualDate: '',
      docNo: '',
      curRev: '',
      remarks: '',
    };
    setForm((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
            <span className="font-mono font-bold text-[#151515]">QF/07/MRO-03</span>
            <span>·</span>
            <span>01.12.2003 (Pages 01 to 04 of 04)</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#E87500] font-semibold">
              <Link2 className="w-3.5 h-3.5" /> Linked to {form.productCode}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#151515] mt-0.5">
            Form 5 — Checklist for Managing and Tracking Change
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onPrintOfficial}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#151515] text-xs font-bold text-[#151515] hover:bg-[#151515] hover:text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print 4-Page Official Format</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(form)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Checklist'}</span>
          </button>
        </div>
      </div>

      {/* Header & Progress Bar */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Product Code</label>
            <input
              type="text"
              readOnly
              value={form.productCode}
              className="w-full px-3 py-2 text-sm font-mono bg-[#F7F7F7] border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Product Description</label>
            <input
              type="text"
              readOnly
              value={form.productDescription}
              className="w-full px-3 py-2 text-sm bg-[#F7F7F7] border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Customer Name</label>
            <input
              type="text"
              readOnly
              value={form.customerName}
              className="w-full px-3 py-2 text-sm bg-[#F7F7F7] border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Customer Part No.</label>
            <input
              type="text"
              value={form.customerPartNo}
              onChange={(e) => setForm({ ...form, customerPartNo: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Change Type</label>
            <select
              value={form.changeCategoryType}
              onChange={(e) =>
                setForm({
                  ...form,
                  changeCategoryType: e.target.value as Form5ChangeChecklist['changeCategoryType'],
                })
              }
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg bg-white"
            >
              <option value="Prod. Change">Prod. Change</option>
              <option value="Desg. Change">Desg. Change</option>
              <option value="Proc. Change">Proc. Change</option>
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-[#E6E6E6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-bold text-[#151515] tabular-nums">
              Completion: {progress.percentComplete}% ({progress.completedActions}/{progress.total} items)
            </span>
            <span className="text-[#E87500] font-semibold">
              Affected (Yes → Next): {progress.affectedYes}
            </span>
            <span className="text-[#666666]">
              Not Affected (No → Terminate): {progress.affectedNo}
            </span>
          </div>
          {progress.shouldTerminateChecklist && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> All items Not Affected — Ready to Terminate Checklist
            </span>
          )}
        </div>
      </div>

      {/* Page Tabs, Quick Triage & Add Row */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-[#F7F7F7] border-b border-[#E6E6E6] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-[#E6E6E6] rounded-lg">
            {(
              [
                [0, 'All 4 Pages (33)'],
                [1, 'Page 01 (9)'],
                [2, 'Page 02 (10)'],
                [3, 'Page 03 (11)'],
                [4, 'Page 04 (3+)'],
              ] as const
            ).map(([pg, label]) => (
              <button
                key={pg}
                type="button"
                onClick={() => setActivePage(pg)}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                  activePage === pg ? 'bg-[#151515] text-white' : 'text-[#666666] hover:text-[#151515]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setOnlyAffected((v) => !v)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-semibold cursor-pointer ${
                onlyAffected
                  ? 'bg-[#F28C00] text-white border-[#F28C00]'
                  : 'bg-white text-[#151515] border-[#E6E6E6]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{onlyAffected ? 'Showing Affected Only' : 'Only Affected (Yes)'}</span>
            </button>

            {visibleItems.some((i) => i.isAffected === 'Pending') && (
              <button
                type="button"
                onClick={markVisiblePendingAsNo}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#151515] hover:text-[#E87500] cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark Pending as &lsquo;No&rsquo;</span>
              </button>
            )}

            <button
              type="button"
              onClick={addCustomItem}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#E87500] hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Checklist Item
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F7F7] border-b border-[#E6E6E6] text-[11px] font-bold text-[#666666] uppercase">
                <th className="py-2.5 px-3 w-12">Pg</th>
                <th className="py-2.5 px-3 min-w-[210px]">Impact of Change to be Considered On</th>
                <th className="py-2.5 px-3 w-36">Is Affected? (Yes/No)</th>
                <th className="py-2.5 px-3 min-w-[160px]">Action Comments</th>
                <th className="py-2.5 px-3 w-40">Responsibility</th>
                <th className="py-2.5 px-3 w-32">Reqd. Date</th>
                <th className="py-2.5 px-3 w-32">Actual Date</th>
                <th className="py-2.5 px-3 w-28">Doc. No.</th>
                <th className="py-2.5 px-3 w-24">Cur. Rev.</th>
                <th className="py-2.5 px-3 min-w-[120px]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E6]">
              {visibleItems.map((item) => {
                const disabledByNo = item.isAffected === 'No';
                return (
                  <tr key={item.id} className={disabledByNo ? 'bg-neutral-50 text-neutral-400' : ''}>
                    <td className="p-2 font-mono text-center text-[#666666]">0{item.page}</td>
                    <td className="p-2 font-semibold text-[#151515]">
                      <input
                        type="text"
                        value={item.impactArea}
                        onChange={(e) => updateItem(item.id, { impactArea: e.target.value })}
                        className="w-full bg-transparent focus:outline-none focus:border-b focus:border-[#F28C00]"
                      />
                    </td>
                    <td className="p-2">
                      <div className="inline-flex rounded border border-[#E6E6E6] overflow-hidden bg-white">
                        {(['Yes', 'No', 'Pending'] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateItem(item.id, { isAffected: opt })}
                            className={`px-2 py-1 text-[11px] font-bold cursor-pointer ${
                              item.isAffected === opt
                                ? opt === 'Yes'
                                  ? 'bg-[#F28C00] text-white'
                                  : opt === 'No'
                                  ? 'bg-[#151515] text-white'
                                  : 'bg-neutral-300 text-[#151515]'
                                : 'text-[#666666]'
                            }`}
                          >
                            {opt === 'Pending' ? '—' : opt}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={disabledByNo}
                        value={item.actionComments}
                        onChange={(e) => updateItem(item.id, { actionComments: e.target.value })}
                        placeholder={disabledByNo ? 'Terminated (N/A)' : 'Action...'}
                        className="w-full px-2 py-1 border border-[#E6E6E6] rounded bg-white disabled:bg-neutral-100"
                      />
                    </td>
                    <td className="p-2">
                      <select
                        disabled={disabledByNo}
                        value={
                          RESPONSIBILITY_DROPDOWN.includes(item.responsibility)
                            ? item.responsibility
                            : ''
                        }
                        onChange={(e) => updateItem(item.id, { responsibility: e.target.value })}
                        className="w-full px-2 py-1 border border-[#E6E6E6] rounded bg-white disabled:bg-neutral-100"
                      >
                        {RESPONSIBILITY_DROPDOWN.map((r) => (
                          <option key={r} value={r}>
                            {r || 'Select Dept'}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        disabled={disabledByNo}
                        value={item.reqdDate}
                        onChange={(e) => updateItem(item.id, { reqdDate: e.target.value })}
                        className="w-full px-1.5 py-1 font-mono border border-[#E6E6E6] rounded bg-white disabled:bg-neutral-100"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="date"
                        disabled={disabledByNo}
                        value={item.actualDate}
                        onChange={(e) => updateItem(item.id, { actualDate: e.target.value })}
                        className="w-full px-1.5 py-1 font-mono border border-[#E6E6E6] rounded bg-white disabled:bg-neutral-100"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={disabledByNo}
                        value={item.docNo}
                        onChange={(e) => updateItem(item.id, { docNo: e.target.value })}
                        className="w-full px-2 py-1 font-mono border border-[#E6E6E6] rounded bg-white disabled:bg-neutral-100"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        disabled={disabledByNo}
                        value={item.curRev}
                        onChange={(e) => updateItem(item.id, { curRev: e.target.value })}
                        placeholder="Rev"
                        className="w-full px-2 py-1 font-mono border border-[#E6E6E6] rounded bg-white disabled:bg-neutral-100"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={(e) => updateItem(item.id, { remarks: e.target.value })}
                        className="w-full px-2 py-1 border border-[#E6E6E6] rounded bg-white"
                      />
                    </td>
                  </tr>
                );
              })}
              {visibleItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-xs text-[#666666]">
                    No checklist items match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Page 4 Final Implementation Details & Informed To */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-5">
        <h4 className="text-sm font-bold text-[#151515] border-b border-[#E6E6E6] pb-2">
          Final Implementation Details &amp; Core Team Sign-off (Page 04 of 04)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Actual Date of Implementation of Change (By CFT &amp; Planning)
            </label>
            <input
              type="date"
              value={form.actualImplementationDate}
              onChange={(e) => setForm({ ...form, actualImplementationDate: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Any Other Remarks
            </label>
            <input
              type="text"
              value={form.otherRemarks}
              onChange={(e) => setForm({ ...form, otherRemarks: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Actions Taken / Proposed on Stock Produced Prior to Modification (Product changes only)
            </label>
            <textarea
              rows={2}
              value={form.actionsOnStockProduced}
              onChange={(e) => setForm({ ...form, actionsOnStockProduced: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Actions Taken / Proposed on Toolings Prior to Modification (By CFT &amp; Planning)
            </label>
            <textarea
              rows={2}
              value={form.actionsOnToolings}
              onChange={(e) => setForm({ ...form, actionsOnToolings: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
        </div>

        {/* Informed To Checkboxes */}
        <div className="pt-2 border-t border-[#E6E6E6] flex flex-wrap items-center gap-5">
          <span className="text-xs font-bold text-[#151515]">Informed To (CFT &amp; Planning):</span>
          {(
            [
              ['customer', 'Customer'],
              ['marketing', 'Marketing'],
              ['planning', 'Planning'],
              ['production', 'Production'],
              ['qa', 'QA'],
              ['qc', 'QC'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={form.informedTo[key]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    informedTo: { ...form.informedTo, [key]: e.target.checked },
                  })
                }
                className="accent-[#F28C00] w-4 h-4"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        {/* 3 Prepared & Signed By Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {form.signOffs.map((s, idx) => (
            <div key={idx} className="p-3 border border-[#E6E6E6] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#666666]">Signatory {idx + 1}</p>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        signOffs: form.signOffs.map((row, i) =>
                          i === idx
                            ? {
                                name: currentUser.name,
                                title: currentUser.title || currentUser.role,
                                sign: `${currentUser.name} (${new Date().toISOString().slice(0, 10)})`,
                              }
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
                    signOffs: form.signOffs.map((row, i) =>
                      i === idx ? { ...row, name: e.target.value } : row,
                    ),
                  })
                }
                placeholder="Name"
                className="w-full px-2.5 py-1.5 text-xs border border-[#E6E6E6] rounded"
              />
              <input
                type="text"
                value={s.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    signOffs: form.signOffs.map((row, i) =>
                      i === idx ? { ...row, title: e.target.value } : row,
                    ),
                  })
                }
                placeholder="Title"
                className="w-full px-2.5 py-1.5 text-xs border border-[#E6E6E6] rounded"
              />
              <input
                type="text"
                value={s.sign}
                onChange={(e) =>
                  setForm({
                    ...form,
                    signOffs: form.signOffs.map((row, i) =>
                      i === idx ? { ...row, sign: e.target.value } : row,
                    ),
                  })
                }
                placeholder="Digital Sign / Initials"
                className="w-full px-2.5 py-1.5 text-xs border border-[#E6E6E6] rounded"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
