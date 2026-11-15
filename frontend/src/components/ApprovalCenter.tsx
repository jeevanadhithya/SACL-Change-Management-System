import React, { useState } from 'react';
import { CheckCircle2, Eye, RotateCcw, XCircle } from 'lucide-react';
import type { ChangeRequestRecord, UserAccount } from '../types/pcms';
import { canUserApproveStage, WORKFLOW_STAGE_ORDER } from '../utils/workflow';
import { StatusText } from './ui/StatusBadge';

interface ApprovalCenterProps {
  user: UserAccount;
  pcrfs: ChangeRequestRecord[];
  onOpenPCRF: (id: string) => void;
  onDecision: (
    pcrfId: string,
    decision: 'APPROVE' | 'REJECT' | 'RETURN',
    comments: string,
  ) => Promise<void>;
}

export function ApprovalCenter({
  user,
  pcrfs,
  onOpenPCRF,
  onDecision,
}: ApprovalCenterProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pendingItems = pcrfs.filter(
    (p) =>
      p.overallStatus !== 'Closed' &&
      p.overallStatus !== 'Rejected' &&
      canUserApproveStage(user.role, p.currentStage),
  );

  const selected = pendingItems.find((p) => p.id === selectedId) || pendingItems[0] || null;

  async function handleAction(decision: 'APPROVE' | 'REJECT' | 'RETURN') {
    if (!selected) return;
    setSubmitting(true);
    try {
      await onDecision(selected.id, decision, comments);
      setComments('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#151515]">Approval Center</h2>
        <p className="text-sm text-[#666666]">
          Items awaiting sign-off from <strong>{user.role}</strong> ({user.name}).
        </p>
      </div>

      {pendingItems.length === 0 ? (
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-12 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-base font-bold text-[#151515]">All caught up</p>
          <p className="text-sm text-[#666666]">
            No change requests currently require your role&apos;s approval.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Pending Queue Table */}
          <div className="lg:col-span-7 bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F7F7F7] border-b border-[#E6E6E6] text-[11px] font-bold text-[#666666] uppercase">
                    <th className="py-3 px-4">PCRF No.</th>
                    <th className="py-3 px-4">Part / Customer</th>
                    <th className="py-3 px-4">Stage / Form</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4 text-right">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E6E6]">
                  {pendingItems.map((p) => {
                    const stageMeta = WORKFLOW_STAGE_ORDER.find((s) => s.key === p.currentStage);
                    const isSelected = selected?.id === p.id;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedId(p.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#FFF4E5]/60' : 'hover:bg-[#F7F7F7]'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-xs font-bold text-[#151515]">
                          {p.pcrfNo}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-[#151515]">{p.form1.partName}</p>
                          <p className="text-xs text-[#666666]">{p.form1.customer}</p>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <p className="font-semibold text-[#151515]">{stageMeta?.label}</p>
                          <p className="font-mono text-[#666666]">{stageMeta?.formCode || 'Gate'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <StatusText status={p.priority} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPCRF(p.id);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-[#E6E6E6] bg-white text-xs font-semibold hover:border-[#F28C00] cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Full Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Decision Panel */}
          {selected && (
            <div className="lg:col-span-5 bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
              <div className="border-b border-[#E6E6E6] pb-3">
                <p className="font-mono text-xs font-bold text-[#E87500]">{selected.pcrfNo}</p>
                <h3 className="text-base font-bold text-[#151515] mt-0.5">{selected.title}</h3>
                <p className="text-xs text-[#666666] mt-1">
                  Submitted by {selected.createdBy} ({selected.form1.department}) · Due{' '}
                  <span className="font-mono">{selected.dueDate}</span>
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <p className="font-bold text-[#151515]">Engineering Reason</p>
                <p className="text-[#444444] bg-[#F7F7F7] p-3 rounded-lg">
                  {selected.form1.reasonForChange}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 border border-[#E6E6E6] rounded-lg">
                    <span className="text-[#666666] block">Feasibility</span>
                    <span className="font-bold text-[#151515]">{selected.form2.conclusion}</span>
                  </div>
                  <div className="p-2.5 border border-[#E6E6E6] rounded-lg">
                    <span className="text-[#666666] block">Overall Risk</span>
                    <span className="font-bold text-[#151515]">
                      Level {selected.form3.overallRiskLevel} ({selected.form3.conclusion})
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#151515] mb-1">
                  Review Comments / Digital Sign-off Note
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter approval remarks or reason for return/rejection..."
                  className="w-full px-3 py-2 text-xs border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction('APPROVE')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction('RETURN')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-[#151515] text-[#151515] text-xs font-bold hover:bg-[#F7F7F7] cursor-pointer disabled:opacity-60"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction('REJECT')}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-red-600 text-red-600 text-xs font-bold hover:bg-red-50 cursor-pointer disabled:opacity-60"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
