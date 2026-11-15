import React, { useEffect, useState } from 'react';
import { Link2, PenLine, Plus, Printer, Save, Trash2 } from 'lucide-react';
import type {
  Classification4M,
  Form1PCRF,
  PCRFParticularRow,
  UserAccount,
} from '../../types/pcms';
import { PARTICULARS_DROPDOWN_OPTIONS } from '../../utils/workflow';

interface ProcessChangeRequisitionFormProps {
  data: Form1PCRF;
  currentUser?: UserAccount;
  saving: boolean;
  onSave: (updated: Form1PCRF) => Promise<void>;
  onPrintOfficial: () => void;
}

export function ProcessChangeRequisitionForm({
  data,
  currentUser,
  saving,
  onSave,
  onPrintOfficial,
}: ProcessChangeRequisitionFormProps) {
  const [form, setForm] = useState<Form1PCRF>(data);

  useEffect(() => {
    setForm(data);
  }, [data]);

  const today = new Date().toISOString().slice(0, 10);
  const stampUser = currentUser ? `${currentUser.name} (${today})` : `Verified (${today})`;

  function updateField<K extends keyof Form1PCRF>(key: K, val: Form1PCRF[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function toggleClassification(c: Classification4M) {
    setForm((prev) => ({
      ...prev,
      classifications: prev.classifications.includes(c)
        ? prev.classifications.filter((x) => x !== c)
        : [...prev.classifications, c],
    }));
  }

  function addParticularRow() {
    const newRow: PCRFParticularRow = {
      id: `part-${Date.now()}`,
      particulars: PARTICULARS_DROPDOWN_OPTIONS[0],
      customParticular: '',
      currentStatus: '',
      changeRequired: '',
      targetFacility:
        form.facilityScope === 'Foundry'
          ? 'F'
          : form.facilityScope === 'Machine Shop'
          ? 'M'
          : 'F&M',
    };
    setForm((prev) => ({ ...prev, particularsRows: [...prev.particularsRows, newRow] }));
  }

  function updateParticularRow(id: string, patch: Partial<PCRFParticularRow>) {
    setForm((prev) => ({
      ...prev,
      particularsRows: prev.particularsRows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }

  function removeParticularRow(id: string) {
    if (form.particularsRows.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      particularsRows: prev.particularsRows.filter((r) => r.id !== id),
    }));
  }

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
            <span className="font-mono font-bold text-[#151515]">QF/07/MRO-15</span>
            <span>·</span>
            <span>Rev.No: 03 dt 04.10.2021</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#E87500] font-semibold">
              <Link2 className="w-3.5 h-3.5" /> Master Source for Forms 2–7
            </span>
          </div>
          <h3 className="text-base font-bold text-[#151515] mt-0.5">
            Form 1 — Process Change Requisition Form (PCRF)
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
            <span>{saving ? 'Saving...' : 'Save & Sync Forms'}</span>
          </button>
        </div>
      </div>

      {/* Section A: Header Information */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E6E6] pb-2">
          <h4 className="text-sm font-bold text-[#151515]">
            1 · Requisition Header &amp; Interconnected Part Metadata
          </h4>
          <span className="text-[11px] text-[#666666]">
            Part, Customer &amp; Reason automatically propagate to Forms 2 through 7 on save.
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">PCRF No.</label>
            <input
              type="text"
              value={form.pcrfNo}
              onChange={(e) => updateField('pcrfNo', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono font-bold border border-[#E6E6E6] rounded-lg bg-[#F7F7F7]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Requisition By (Raise)
            </label>
            <input
              type="text"
              value={form.requisitionBy}
              onChange={(e) => updateField('requisitionBy', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Department</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => updateField('department', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#666666]">
                Requisitioner Sign (Approval)
              </label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => updateField('requisitionerSign', stampUser)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E87500] hover:underline cursor-pointer"
                >
                  <PenLine className="w-3 h-3" /> Sign as Me
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.requisitionerSign}
              onChange={(e) => updateField('requisitionerSign', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#666666]">Requisitioner HOD Sign</label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => updateField('requisitionerHodSign', stampUser)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E87500] hover:underline cursor-pointer"
                >
                  <PenLine className="w-3 h-3" /> Sign as Me
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.requisitionerHodSign}
              onChange={(e) => updateField('requisitionerHodSign', e.target.value)}
              placeholder="HOD digital sign & date"
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Customer</label>
            <input
              type="text"
              value={form.customer}
              onChange={(e) => updateField('customer', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Part Name</label>
            <input
              type="text"
              value={form.partName}
              onChange={(e) => updateField('partName', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">Part No.</label>
            <input
              type="text"
              value={form.partNo}
              onChange={(e) => updateField('partNo', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
            />
          </div>
        </div>

        {/* Classification + Product/Process + Foundry/Machine Shop Scope */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#E6E6E6]">
          <div>
            <span className="block text-xs font-semibold text-[#666666] mb-1.5">
              Classification (4M)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(['Man', 'Machine', 'Material', 'Method'] as const).map((c) => {
                const active = form.classifications.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleClassification(c)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border cursor-pointer ${
                      active
                        ? 'bg-[#151515] text-white border-[#151515]'
                        : 'bg-white text-[#666666] border-[#E6E6E6]'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[#666666] mb-1.5">
              Change Category (Product / Process)
            </span>
            <div className="flex gap-2">
              {(['Product', 'Process'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateField('changeType', t)}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold border cursor-pointer ${
                    form.changeType === t
                      ? 'bg-[#F28C00] text-white border-[#F28C00]'
                      : 'bg-white text-[#151515] border-[#E6E6E6]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[#666666] mb-1.5">
              Applicable Facility (F / M / F&amp;M)
            </span>
            <div className="flex gap-1.5">
              {(['Foundry', 'Machine Shop', 'Foundry & Machine Shop'] as const).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => updateField('facilityScope', sc)}
                  className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold border cursor-pointer truncate ${
                    form.facilityScope === sc
                      ? 'bg-[#151515] text-white border-[#151515]'
                      : 'bg-white text-[#151515] border-[#E6E6E6]'
                  }`}
                >
                  {sc === 'Foundry & Machine Shop' ? 'F & M' : sc === 'Foundry' ? 'F' : 'M'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section B: Details of Change Required */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-[#151515]">2 · Details of Change Required</h4>
            <p className="text-xs text-[#666666]">
              Select Particulars from dropdown or choose &ldquo;Any Other&rdquo; to enter custom line items.
            </p>
          </div>
          <button
            type="button"
            onClick={addParticularRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151515] text-white text-xs font-semibold hover:bg-[#242424] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Particular Row</span>
          </button>
        </div>

        <div className="overflow-x-auto no-scrollbar border border-[#E6E6E6] rounded-lg">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F7F7F7] border-b border-[#E6E6E6] text-[11px] font-bold text-[#666666] uppercase">
                <th className="py-2.5 px-3 w-64">Particulars</th>
                <th className="py-2.5 px-3">Current Status</th>
                <th className="py-2.5 px-3">Change Required</th>
                <th className="py-2.5 px-3 w-28">Facility</th>
                <th className="py-2.5 px-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E6]">
              {form.particularsRows.map((row) => (
                <tr key={row.id}>
                  <td className="p-2.5 align-top space-y-1.5">
                    <select
                      value={row.particulars}
                      onChange={(e) => updateParticularRow(row.id, { particulars: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#E6E6E6] rounded-md bg-white focus:outline-none focus:border-[#F28C00]"
                    >
                      {PARTICULARS_DROPDOWN_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                    {row.particulars === 'Any Other' && (
                      <input
                        type="text"
                        value={row.customParticular || ''}
                        onChange={(e) =>
                          updateParticularRow(row.id, { customParticular: e.target.value })
                        }
                        placeholder="Specify custom particular..."
                        className="w-full px-2.5 py-1.5 text-xs border border-[#E6E6E6] rounded-md focus:outline-none focus:border-[#F28C00]"
                      />
                    )}
                  </td>
                  <td className="p-2.5 align-top">
                    <textarea
                      rows={2}
                      value={row.currentStatus}
                      onChange={(e) => updateParticularRow(row.id, { currentStatus: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-[#E6E6E6] rounded-md focus:outline-none focus:border-[#F28C00]"
                    />
                  </td>
                  <td className="p-2.5 align-top">
                    <textarea
                      rows={2}
                      value={row.changeRequired}
                      onChange={(e) =>
                        updateParticularRow(row.id, { changeRequired: e.target.value })
                      }
                      className="w-full px-2.5 py-1.5 text-xs border border-[#E6E6E6] rounded-md focus:outline-none focus:border-[#F28C00]"
                    />
                  </td>
                  <td className="p-2.5 align-top">
                    <select
                      value={row.targetFacility}
                      onChange={(e) =>
                        updateParticularRow(row.id, {
                          targetFacility: e.target.value as 'F' | 'M' | 'F&M',
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs font-semibold border border-[#E6E6E6] rounded-md bg-white"
                    >
                      <option value="F">F (Foundry)</option>
                      <option value="M">M (Machine)</option>
                      <option value="F&M">F &amp; M</option>
                    </select>
                  </td>
                  <td className="p-2.5 align-top text-center">
                    <button
                      type="button"
                      aria-label="Remove particular row"
                      onClick={() => removeParticularRow(row.id)}
                      disabled={form.particularsRows.length <= 1}
                      className="p-1.5 text-neutral-400 hover:text-red-600 disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Reason for Change Required
            </label>
            <textarea
              rows={2}
              value={form.reasonForChange}
              onChange={(e) => updateField('reasonForChange', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Facility Applicability (F / M / Other)
            </label>
            <select
              value={form.reasonFacilityApplicable}
              onChange={(e) =>
                updateField(
                  'reasonFacilityApplicable',
                  e.target.value as Form1PCRF['reasonFacilityApplicable'],
                )
              }
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg bg-white focus:outline-none focus:border-[#F28C00]"
            >
              <option value="Foundry">Foundry (F)</option>
              <option value="Machine Shop">Machine Shop (M)</option>
              <option value="Both">Both Foundry &amp; Machine Shop</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section C: CFT Comments (Foundry & Machine Shop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#151515]">3A · CFT Comments — Foundry</h4>
            <select
              value={form.cftFoundryFeasibility}
              onChange={(e) =>
                updateField(
                  'cftFoundryFeasibility',
                  e.target.value as Form1PCRF['cftFoundryFeasibility'],
                )
              }
              className="px-2.5 py-1 text-xs font-semibold border border-[#E6E6E6] rounded-md"
            >
              <option value="Pending">Pending</option>
              <option value="Feasible">Feasible</option>
              <option value="Not Feasible">Not Feasible</option>
            </select>
          </div>
          <textarea
            rows={3}
            value={form.cftCommentsFoundry}
            onChange={(e) => updateField('cftCommentsFoundry', e.target.value)}
            placeholder="Foundry process / product impact comments..."
            className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-[#666666]">CFT Leader Sign</span>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      updateField('cftLeaderFoundrySign', currentUser.name);
                      updateField('cftLeaderFoundryDate', today);
                    }}
                    className="text-[11px] font-bold text-[#E87500] hover:underline cursor-pointer"
                  >
                    Sign as Me
                  </button>
                )}
              </div>
              <input
                type="text"
                value={form.cftLeaderFoundrySign}
                onChange={(e) => updateField('cftLeaderFoundrySign', e.target.value)}
                placeholder="CFT Leader Signature"
                className="w-full px-3 py-1.5 text-xs border border-[#E6E6E6] rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <span className="block text-[11px] font-semibold text-[#666666]">Date</span>
              <input
                type="date"
                value={form.cftLeaderFoundryDate}
                onChange={(e) => updateField('cftLeaderFoundryDate', e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-[#E6E6E6] rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#151515]">3B · CFT Comments — Machine Shop</h4>
            <select
              value={form.cftMachineShopFeasibility}
              onChange={(e) =>
                updateField(
                  'cftMachineShopFeasibility',
                  e.target.value as Form1PCRF['cftMachineShopFeasibility'],
                )
              }
              className="px-2.5 py-1 text-xs font-semibold border border-[#E6E6E6] rounded-md"
            >
              <option value="Pending">Pending</option>
              <option value="Feasible">Feasible</option>
              <option value="Not Feasible">Not Feasible</option>
            </select>
          </div>
          <textarea
            rows={3}
            value={form.cftCommentsMachineShop}
            onChange={(e) => updateField('cftCommentsMachineShop', e.target.value)}
            placeholder="Machine shop process comments..."
            className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-[#666666]">CFT Leader Sign</span>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      updateField('cftLeaderMachineShopSign', currentUser.name);
                      updateField('cftLeaderMachineShopDate', today);
                    }}
                    className="text-[11px] font-bold text-[#E87500] hover:underline cursor-pointer"
                  >
                    Sign as Me
                  </button>
                )}
              </div>
              <input
                type="text"
                value={form.cftLeaderMachineShopSign}
                onChange={(e) => updateField('cftLeaderMachineShopSign', e.target.value)}
                placeholder="CFT Leader Signature"
                className="w-full px-3 py-1.5 text-xs border border-[#E6E6E6] rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <span className="block text-[11px] font-semibold text-[#666666]">Date</span>
              <input
                type="date"
                value={form.cftLeaderMachineShopDate}
                onChange={(e) => updateField('cftLeaderMachineShopDate', e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-[#E6E6E6] rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section D: Internal Approval & Customer Communication + SOP Reflection */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
        <h4 className="text-sm font-bold text-[#151515] border-b border-[#E6E6E6] pb-2">
          4 · Internal Approval &amp; Customer Communication / SOP Reflection
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Internal Approval
            </label>
            <select
              value={form.internalApprovalStatus}
              onChange={(e) =>
                updateField(
                  'internalApprovalStatus',
                  e.target.value as Form1PCRF['internalApprovalStatus'],
                )
              }
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg bg-white"
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Others">If others, specify</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Approving Authority
            </label>
            <input
              type="text"
              value={form.approvingAuthority}
              onChange={(e) => updateField('approvingAuthority', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#666666]">Authority Signature</label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    updateField('approvingAuthority', currentUser.title || currentUser.role);
                    updateField('approvingAuthoritySign', stampUser);
                  }}
                  className="text-[11px] font-bold text-[#E87500] hover:underline cursor-pointer"
                >
                  Sign as Me
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.approvingAuthoritySign}
              onChange={(e) => updateField('approvingAuthoritySign', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-[#666666]">
                Plant Head Approval / Sign
              </label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    updateField('plantHeadApproval', 'Approved');
                    updateField('plantHeadSign', stampUser);
                  }}
                  className="text-[11px] font-bold text-[#E87500] hover:underline cursor-pointer"
                >
                  Sign as Me
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.plantHeadSign}
              onChange={(e) => updateField('plantHeadSign', e.target.value)}
              placeholder={form.plantHeadApproval}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Customer Communication Detail
            </label>
            <input
              type="text"
              value={form.customerCommunicationDetail}
              onChange={(e) => updateField('customerCommunicationDetail', e.target.value)}
              placeholder="ECN / customer notification reference & handling summary..."
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#666666] mb-1">
              Forwarded To (Next Stage)
            </label>
            <input
              type="text"
              value={form.forwardedTo}
              onChange={(e) => updateField('forwardedTo', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#151515] cursor-pointer">
            <input
              type="checkbox"
              checked={form.changeReflectionInSOP}
              onChange={(e) => updateField('changeReflectionInSOP', e.target.checked)}
              className="accent-[#F28C00] w-4 h-4"
            />
            <span>Change Reflection Required in SOP</span>
          </label>
          {form.changeReflectionInSOP && (
            <input
              type="text"
              value={form.sopDocumentRef}
              onChange={(e) => updateField('sopDocumentRef', e.target.value)}
              placeholder="SOP Document Ref (e.g., SOP-MSH-4410-R04)"
              className="px-3 py-1.5 text-xs font-mono border border-[#E6E6E6] rounded-lg w-72"
            />
          )}
        </div>
      </div>
    </div>
  );
}
