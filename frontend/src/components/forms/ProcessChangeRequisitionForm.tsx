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
      <div className="surface-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C6470]">
            <span className="font-mono font-bold text-[#111318]">QF/07/MRO-15</span>
            <span>·</span>
            <span>Rev.No: 03 dt 04.10.2021</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#D97700] font-semibold">
              <Link2 className="w-3.5 h-3.5" /> Master Source for Forms 2–7
            </span>
          </div>
          <h3 className="text-base font-bold text-[#111318]">
            Form 1 — Process Change Requisition Form (PCRF)
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
            <span>{saving ? 'Saving...' : 'Save & Sync Forms'}</span>
          </button>
        </div>
      </div>

      {/* Section A: Header Information */}
      <div className="surface-card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E7EC] pb-4">
          <h4 className="text-sm font-bold text-[#111318]">
            1 · Requisition Header &amp; Interconnected Part Metadata
          </h4>
          <span className="text-xs text-[#5C6470]">
            Part, Customer &amp; Reason automatically propagate to Forms 2 through 7 on save.
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="field-label">PCRF No.</label>
            <input
              type="text"
              value={form.pcrfNo}
              onChange={(e) => updateField('pcrfNo', e.target.value)}
              className="field-input font-mono font-bold bg-[#F8F9FB]"
            />
          </div>
          <div>
            <label className="field-label">Requisition By (Raise)</label>
            <input
              type="text"
              value={form.requisitionBy}
              onChange={(e) => updateField('requisitionBy', e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="field-input font-mono"
            />
          </div>
          <div>
            <label className="field-label">Department</label>
            <input
              type="text"
              value={form.department}
              onChange={(e) => updateField('department', e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#5C6470]">
                Requisitioner Sign (Approval)
              </label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => updateField('requisitionerSign', stampUser)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97700] hover:underline cursor-pointer"
                >
                  <PenLine className="w-3 h-3" /> Sign as Me
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.requisitionerSign}
              onChange={(e) => updateField('requisitionerSign', e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#5C6470]">Requisitioner HOD Sign</label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => updateField('requisitionerHodSign', stampUser)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97700] hover:underline cursor-pointer"
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
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Customer</label>
            <input
              type="text"
              value={form.customer}
              onChange={(e) => updateField('customer', e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Part Name</label>
            <input
              type="text"
              value={form.partName}
              onChange={(e) => updateField('partName', e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Part No.</label>
            <input
              type="text"
              value={form.partNo}
              onChange={(e) => updateField('partNo', e.target.value)}
              className="field-input font-mono"
            />
          </div>
        </div>

        {/* Classification + Product/Process + Foundry/Machine Shop Scope */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-[#E4E7EC]">
          <div>
            <span className="field-label">Classification (4M)</span>
            <div className="flex flex-wrap gap-2">
              {(['Man', 'Machine', 'Material', 'Method'] as const).map((c) => {
                const active = form.classifications.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleClassification(c)}
                    className={`h-8 px-3 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#111318] text-white border-[#111318]'
                        : 'bg-white text-[#5C6470] border-[#E4E7EC] hover:border-[#111318]'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className="field-label">Change Category (Product / Process)</span>
            <div className="flex gap-2">
              {(['Product', 'Process'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => updateField('changeType', t)}
                  className={`flex-1 h-8 px-3 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                    form.changeType === t
                      ? 'bg-[#F28C00] text-white border-[#F28C00]'
                      : 'bg-white text-[#111318] border-[#E4E7EC] hover:border-[#111318]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="field-label">Applicable Facility (F / M / F&amp;M)</span>
            <div className="flex gap-2">
              {(['Foundry', 'Machine Shop', 'Foundry & Machine Shop'] as const).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => updateField('facilityScope', sc)}
                  className={`flex-1 h-8 px-2 rounded-lg text-xs font-semibold border cursor-pointer truncate transition-colors ${
                    form.facilityScope === sc
                      ? 'bg-[#111318] text-white border-[#111318]'
                      : 'bg-white text-[#111318] border-[#E4E7EC] hover:border-[#111318]'
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
      <div className="surface-card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-[#111318]">2 · Details of Change Required</h4>
            <p className="text-xs text-[#5C6470]">
              Select Particulars from dropdown or choose &ldquo;Any Other&rdquo; to enter custom line items.
            </p>
          </div>
          <button type="button" onClick={addParticularRow} className="btn-compact">
            <Plus className="w-3.5 h-3.5" />
            <span>Add Particular Row</span>
          </button>
        </div>

        <div className="overflow-x-auto no-scrollbar border border-[#E4E7EC] rounded-lg">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-bold text-[#5C6470] uppercase tracking-wider">
                <th className="h-10 px-4 w-64">Particulars</th>
                <th className="h-10 px-4">Current Status</th>
                <th className="h-10 px-4">Change Required</th>
                <th className="h-10 px-4 w-28">Facility</th>
                <th className="h-10 px-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {form.particularsRows.map((row) => (
                <tr key={row.id}>
                  <td className="p-3 align-top space-y-2">
                    <select
                      value={row.particulars}
                      onChange={(e) => updateParticularRow(row.id, { particulars: e.target.value })}
                      className="w-full h-8 px-2 text-xs border border-[#E4E7EC] rounded-md bg-white focus:outline-none focus:border-[#F28C00]"
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
                        className="w-full h-8 px-2 text-xs border border-[#E4E7EC] rounded-md focus:outline-none focus:border-[#F28C00]"
                      />
                    )}
                  </td>
                  <td className="p-3 align-top">
                    <textarea
                      rows={2}
                      value={row.currentStatus}
                      onChange={(e) => updateParticularRow(row.id, { currentStatus: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-[#E4E7EC] rounded-md focus:outline-none focus:border-[#F28C00]"
                    />
                  </td>
                  <td className="p-3 align-top">
                    <textarea
                      rows={2}
                      value={row.changeRequired}
                      onChange={(e) =>
                        updateParticularRow(row.id, { changeRequired: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs border border-[#E4E7EC] rounded-md focus:outline-none focus:border-[#F28C00]"
                    />
                  </td>
                  <td className="p-3 align-top">
                    <select
                      value={row.targetFacility}
                      onChange={(e) =>
                        updateParticularRow(row.id, {
                          targetFacility: e.target.value as 'F' | 'M' | 'F&M',
                        })
                      }
                      className="w-full h-8 px-2 text-xs font-semibold border border-[#E4E7EC] rounded-md bg-white"
                    >
                      <option value="F">F (Foundry)</option>
                      <option value="M">M (Machine)</option>
                      <option value="F&M">F &amp; M</option>
                    </select>
                  </td>
                  <td className="p-3 align-top text-center">
                    <button
                      type="button"
                      aria-label="Remove particular row"
                      onClick={() => removeParticularRow(row.id)}
                      disabled={form.particularsRows.length <= 1}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-md text-[#8C95A4] hover:text-red-600 disabled:opacity-30 cursor-pointer"
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
            <label className="field-label">Reason for Change Required</label>
            <textarea
              rows={2}
              value={form.reasonForChange}
              onChange={(e) => updateField('reasonForChange', e.target.value)}
              className="field-textarea"
            />
          </div>
          <div>
            <label className="field-label">Facility Applicability (F / M / Other)</label>
            <select
              value={form.reasonFacilityApplicable}
              onChange={(e) =>
                updateField(
                  'reasonFacilityApplicable',
                  e.target.value as Form1PCRF['reasonFacilityApplicable'],
                )
              }
              className="field-input"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-[#111318]">3A · CFT Comments — Foundry</h4>
            <select
              value={form.cftFoundryFeasibility}
              onChange={(e) =>
                updateField(
                  'cftFoundryFeasibility',
                  e.target.value as Form1PCRF['cftFoundryFeasibility'],
                )
              }
              className="h-8 px-3 text-xs font-semibold border border-[#E4E7EC] rounded-lg bg-white"
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
            className="field-textarea"
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[#5C6470]">CFT Leader Sign</span>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      updateField('cftLeaderFoundrySign', currentUser.name);
                      updateField('cftLeaderFoundryDate', today);
                    }}
                    className="text-[11px] font-bold text-[#D97700] hover:underline cursor-pointer"
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
                className="field-input"
              />
            </div>
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-[#5C6470]">Date</span>
              <input
                type="date"
                value={form.cftLeaderFoundryDate}
                onChange={(e) => updateField('cftLeaderFoundryDate', e.target.value)}
                className="field-input font-mono"
              />
            </div>
          </div>
        </div>

        <div className="surface-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-[#111318]">3B · CFT Comments — Machine Shop</h4>
            <select
              value={form.cftMachineShopFeasibility}
              onChange={(e) =>
                updateField(
                  'cftMachineShopFeasibility',
                  e.target.value as Form1PCRF['cftMachineShopFeasibility'],
                )
              }
              className="h-8 px-3 text-xs font-semibold border border-[#E4E7EC] rounded-lg bg-white"
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
            className="field-textarea"
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[#5C6470]">CFT Leader Sign</span>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      updateField('cftLeaderMachineShopSign', currentUser.name);
                      updateField('cftLeaderMachineShopDate', today);
                    }}
                    className="text-[11px] font-bold text-[#D97700] hover:underline cursor-pointer"
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
                className="field-input"
              />
            </div>
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-[#5C6470]">Date</span>
              <input
                type="date"
                value={form.cftLeaderMachineShopDate}
                onChange={(e) => updateField('cftLeaderMachineShopDate', e.target.value)}
                className="field-input font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section D: Internal Approval & Customer Communication + SOP Reflection */}
      <div className="surface-card p-6 space-y-6">
        <h4 className="text-sm font-bold text-[#111318] border-b border-[#E4E7EC] pb-4">
          4 · Internal Approval &amp; Customer Communication / SOP Reflection
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="field-label">Internal Approval</label>
            <select
              value={form.internalApprovalStatus}
              onChange={(e) =>
                updateField(
                  'internalApprovalStatus',
                  e.target.value as Form1PCRF['internalApprovalStatus'],
                )
              }
              className="field-input"
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Others">If others, specify</option>
            </select>
          </div>
          <div>
            <label className="field-label">Approving Authority</label>
            <input
              type="text"
              value={form.approvingAuthority}
              onChange={(e) => updateField('approvingAuthority', e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#5C6470]">Authority Signature</label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    updateField('approvingAuthority', currentUser.title || currentUser.role);
                    updateField('approvingAuthoritySign', stampUser);
                  }}
                  className="text-[11px] font-bold text-[#D97700] hover:underline cursor-pointer"
                >
                  Sign as Me
                </button>
              )}
            </div>
            <input
              type="text"
              value={form.approvingAuthoritySign}
              onChange={(e) => updateField('approvingAuthoritySign', e.target.value)}
              className="field-input"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#5C6470]">
                Plant Head Approval / Sign
              </label>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    updateField('plantHeadApproval', 'Approved');
                    updateField('plantHeadSign', stampUser);
                  }}
                  className="text-[11px] font-bold text-[#D97700] hover:underline cursor-pointer"
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
              className="field-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="field-label">Customer Communication Detail</label>
            <input
              type="text"
              value={form.customerCommunicationDetail}
              onChange={(e) => updateField('customerCommunicationDetail', e.target.value)}
              placeholder="ECN / customer notification reference & handling summary..."
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">Forwarded To (Next Stage)</label>
            <input
              type="text"
              value={form.forwardedTo}
              onChange={(e) => updateField('forwardedTo', e.target.value)}
              className="field-input"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[#E4E7EC]">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#111318] cursor-pointer">
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
              className="field-input font-mono !w-72"
            />
          )}
        </div>
      </div>
    </div>
  );
}
