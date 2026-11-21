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
      <div className="surface-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C6470]">
            <span className="font-mono font-bold text-[#111318]">QF/07/MRO-03</span>
            <span>·</span>
            <span>01.12.2003 (Pages 01 to 04 of 04)</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#D97700] font-semibold">
              <Link2 className="w-3.5 h-3.5" /> Linked to {form.productCode}
            </span>
          </div>
          <h3 className="text-base font-bold text-[#111318]">
            Form 5 — Checklist for Managing and Tracking Change
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button type="button" onClick={onPrintOfficial} className="btn-secondary">
            <Printer className="w-4 h-4" />
            <span>Print 4-Page Official Format</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(form)}
            className="btn-primary"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Checklist'}</span>
          </button>
        </div>
      </div>

      {/* Header & Progress Bar */}
      <div className="surface-card p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="field-label">Product Code</label>
            <input
              type="text"
              readOnly
              value={form.productCode}
              className="field-input font-mono bg-[#F8F9FB]"
            />
          </div>
          <div>
            <label className="field-label">Product Description</label>
            <input
              type="text"
              readOnly
              value={form.productDescription}
              className="field-input bg-[#F8F9FB]"
            />
          </div>
          <div>
            <label className="field-label">Customer Name</label>
            <input
              type="text"
              readOnly
              value={form.customerName}
              className="field-input bg-[#F8F9FB]"
            />
          </div>
          <div>
            <label className="field-label">Customer Part No.</label>
            <input
              type="text"
              value={form.customerPartNo}
              onChange={(e) => setForm({ ...form, customerPartNo: e.target.value })}
              className="field-input font-mono"
            />
          </div>
          <div>
            <label className="field-label">Change Type</label>
            <select
              value={form.changeCategoryType}
              onChange={(e) =>
                setForm({
                  ...form,
                  changeCategoryType: e.target.value as Form5ChangeChecklist['changeCategoryType'],
                })
              }
              className="field-input"
            >
              <option value="Prod. Change">Prod. Change</option>
              <option value="Desg. Change">Desg. Change</option>
              <option value="Proc. Change">Proc. Change</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E4E7EC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums">
            <span className="font-bold text-[#111318]">
              Completion: {progress.percentComplete}% ({progress.completedActions}/{progress.total} items)
            </span>
            <span className="text-[#D97700] font-semibold">
              Affected (Yes → Next): {progress.affectedYes}
            </span>
            <span className="text-[#5C6470]">
              Not Affected (No → Terminate): {progress.affectedNo}
            </span>
          </div>
          {progress.shouldTerminateChecklist && (
            <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="w-4 h-4" /> All items Not Affected — Ready to Terminate Checklist
            </span>
          )}
        </div>
      </div>

      {/* Page Tabs, Quick Triage & Add Row */}
      <div className="surface-card overflow-hidden">
        <div className="surface-header flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-[#E4E7EC] rounded-lg">
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
                className={`h-8 px-3 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  activePage === pg ? 'bg-[#111318] text-white' : 'text-[#5C6470] hover:text-[#111318]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setOnlyAffected((v) => !v)}
              className={`h-8 inline-flex items-center gap-1.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                onlyAffected
                  ? 'bg-[#F28C00] text-white border-[#F28C00]'
                  : 'bg-white text-[#111318] border-[#E4E7EC] hover:border-[#111318]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{onlyAffected ? 'Showing Affected Only' : 'Only Affected (Yes)'}</span>
            </button>

            {visibleItems.some((i) => i.isAffected === 'Pending') && (
              <button
                type="button"
                onClick={markVisiblePendingAsNo}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111318] hover:text-[#D97700] cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark Pending as &lsquo;No&rsquo;</span>
              </button>
            )}

            <button
              type="button"
              onClick={addCustomItem}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97700] hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Checklist Item
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-bold text-[#5C6470] uppercase tracking-wider">
                <th className="h-10 px-4 w-12">Pg</th>
                <th className="h-10 px-3 min-w-[210px]">Impact of Change to be Considered On</th>
                <th className="h-10 px-3 w-36">Is Affected? (Yes/No)</th>
                <th className="h-10 px-3 min-w-[160px]">Action Comments</th>
                <th className="h-10 px-3 w-40">Responsibility</th>
                <th className="h-10 px-3 w-32">Reqd. Date</th>
                <th className="h-10 px-3 w-32">Actual Date</th>
                <th className="h-10 px-3 w-28">Doc. No.</th>
                <th className="h-10 px-3 w-24">Cur. Rev.</th>
                <th className="h-10 px-4 min-w-[120px]">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {visibleItems.map((item) => {
                const disabledByNo = item.isAffected === 'No';
                return (
                  <tr
                    key={item.id}
                    className={disabledByNo ? 'bg-[#F8F9FB] text-[#8C95A4]' : 'hover:bg-[#F8F9FB] transition-colors'}
                  >
                    <td className="py-3 px-4 font-mono text-center text-[#5C6470] tabular-nums">0{item.page}</td>
                    <td className="py-3 px-3 font-semibold text-[#111318]">
                      <input
                        type="text"
                        value={item.impactArea}
                        onChange={(e) => updateItem(item.id, { impactArea: e.target.value })}
                        className="w-full h-8 bg-transparent focus:outline-none focus:border-b focus:border-[#F28C00]"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="inline-flex rounded-md border border-[#E4E7EC] overflow-hidden bg-white">
                        {(['Yes', 'No', 'Pending'] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => updateItem(item.id, { isAffected: opt })}
                            className={`h-8 px-2 text-[11px] font-bold cursor-pointer ${
                              item.isAffected === opt
                                ? opt === 'Yes'
                                  ? 'bg-[#F28C00] text-white'
                                  : opt === 'No'
                                  ? 'bg-[#111318] text-white'
                                  : 'bg-[#E4E7EC] text-[#111318]'
                                : 'text-[#5C6470]'
                            }`}
                          >
                            {opt === 'Pending' ? '—' : opt}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        disabled={disabledByNo}
                        value={item.actionComments}
                        onChange={(e) => updateItem(item.id, { actionComments: e.target.value })}
                        placeholder={disabledByNo ? 'Terminated (N/A)' : 'Action...'}
                        className="w-full h-8 px-2 border border-[#E4E7EC] rounded-md bg-white disabled:bg-[#F4F5F7]"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <select
                        disabled={disabledByNo}
                        value={
                          RESPONSIBILITY_DROPDOWN.includes(item.responsibility)
                            ? item.responsibility
                            : ''
                        }
                        onChange={(e) => updateItem(item.id, { responsibility: e.target.value })}
                        className="w-full h-8 px-2 border border-[#E4E7EC] rounded-md bg-white disabled:bg-[#F4F5F7]"
                      >
                        {RESPONSIBILITY_DROPDOWN.map((r) => (
                          <option key={r} value={r}>
                            {r || 'Select Dept'}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="date"
                        disabled={disabledByNo}
                        value={item.reqdDate}
                        onChange={(e) => updateItem(item.id, { reqdDate: e.target.value })}
                        className="w-full h-8 px-2 font-mono border border-[#E4E7EC] rounded-md bg-white disabled:bg-[#F4F5F7]"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="date"
                        disabled={disabledByNo}
                        value={item.actualDate}
                        onChange={(e) => updateItem(item.id, { actualDate: e.target.value })}
                        className="w-full h-8 px-2 font-mono border border-[#E4E7EC] rounded-md bg-white disabled:bg-[#F4F5F7]"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        disabled={disabledByNo}
                        value={item.docNo}
                        onChange={(e) => updateItem(item.id, { docNo: e.target.value })}
                        className="w-full h-8 px-2 font-mono border border-[#E4E7EC] rounded-md bg-white disabled:bg-[#F4F5F7]"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        disabled={disabledByNo}
                        value={item.curRev}
                        onChange={(e) => updateItem(item.id, { curRev: e.target.value })}
                        placeholder="Rev"
                        className="w-full h-8 px-2 font-mono border border-[#E4E7EC] rounded-md bg-white disabled:bg-[#F4F5F7]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={(e) => updateItem(item.id, { remarks: e.target.value })}
                        className="w-full h-8 px-2 border border-[#E4E7EC] rounded-md bg-white"
                      />
                    </td>
                  </tr>
                );
              })}
              {visibleItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-xs text-[#5C6470]">
                    No checklist items match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Page 4 Final Implementation Details & Informed To */}
      <div className="surface-card p-6 space-y-6">
        <h4 className="text-sm font-bold text-[#111318] border-b border-[#E4E7EC] pb-4">
          Final Implementation Details &amp; Core Team Sign-off (Page 04 of 04)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="field-label">
              Actual Date of Implementation of Change (By CFT &amp; Planning)
            </label>
            <input
              type="date"
              value={form.actualImplementationDate}
              onChange={(e) => setForm({ ...form, actualImplementationDate: e.target.value })}
              className="field-input font-mono"
            />
          </div>
          <div>
            <label className="field-label">Any Other Remarks</label>
            <input
              type="text"
              value={form.otherRemarks}
              onChange={(e) => setForm({ ...form, otherRemarks: e.target.value })}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">
              Actions Taken / Proposed on Stock Produced Prior to Modification (Product changes only)
            </label>
            <textarea
              rows={2}
              value={form.actionsOnStockProduced}
              onChange={(e) => setForm({ ...form, actionsOnStockProduced: e.target.value })}
              className="field-textarea"
            />
          </div>
          <div>
            <label className="field-label">
              Actions Taken / Proposed on Toolings Prior to Modification (By CFT &amp; Planning)
            </label>
            <textarea
              rows={2}
              value={form.actionsOnToolings}
              onChange={(e) => setForm({ ...form, actionsOnToolings: e.target.value })}
              className="field-textarea"
            />
          </div>
        </div>

        {/* Informed To Checkboxes */}
        <div className="pt-4 border-t border-[#E4E7EC] flex flex-wrap items-center gap-6">
          <span className="text-xs font-bold text-[#111318]">Informed To (CFT &amp; Planning):</span>
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
            <label key={key} className="inline-flex items-center gap-2 text-xs font-semibold text-[#111318] cursor-pointer">
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

        {/* 3 Prepared & Signed By Blocks (flattened) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {form.signOffs.map((s, idx) => (
            <div key={idx} className="p-4 bg-[#F8F9FB] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#5C6470]">Signatory {idx + 1}</p>
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
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97700] hover:underline cursor-pointer"
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
                className="field-input !h-8 !text-xs"
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
                className="field-input !h-8 !text-xs"
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
                className="field-input !h-8 !text-xs"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
