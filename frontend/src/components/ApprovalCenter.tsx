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
      <div className="space-y-1">
        <h2 className="text-2xl leading-8 font-extrabold text-[#111318] tracking-tight">
          Approval Center
        </h2>
        <p className="text-sm text-[#5C6470]">
          Items awaiting sign-off from <strong className="text-[#111318]">{user.role}</strong> ({user.name}).
        </p>
      </div>

      {pendingItems.length === 0 ? (
        <div className="surface-card p-12 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-base font-bold text-[#111318]">All caught up</p>
          <p className="text-sm text-[#5C6470]">
            No change requests currently require your role&apos;s approval.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Pending Queue Table */}
          <div className="lg:col-span-7 surface-card overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#5C6470] uppercase tracking-wider">
                    <th className="h-10 px-6">PCRF No.</th>
                    <th className="h-10 px-4">Part / Customer</th>
                    <th className="h-10 px-4">Stage / Form</th>
                    <th className="h-10 px-4">Priority</th>
                    <th className="h-10 px-6 text-right">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC]">
                  {pendingItems.map((p) => {
                    const stageMeta = WORKFLOW_STAGE_ORDER.find((s) => s.key === p.currentStage);
                    const isSelected = selected?.id === p.id;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedId(p.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#FFF6EB]' : 'hover:bg-[#F8F9FB]'
                        }`}
                      >
                        <td className="py-4 px-6 font-mono text-xs font-bold text-[#111318] whitespace-nowrap">
                          {p.pcrfNo}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-semibold text-[#111318]">{p.form1.partName}</p>
                          <p className="text-xs text-[#5C6470] mt-1">{p.form1.customer}</p>
                        </td>
                        <td className="py-4 px-4 text-xs">
                          <p className="font-semibold text-[#111318]">{stageMeta?.label}</p>
                          <p className="font-mono text-[#5C6470] mt-1">{stageMeta?.formCode || 'Gate'}</p>
                        </td>
                        <td className="py-4 px-4">
                          <StatusText status={p.priority} />
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPCRF(p.id);
                            }}
                            className="btn-compact border border-[#D5DAE1] bg-white hover:border-[#F28C00] hover:text-[#D97700] text-[#111318]"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Full Details</span>
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
            <div className="lg:col-span-5 surface-card p-6 space-y-6">
              <div className="border-b border-[#E4E7EC] pb-4 space-y-1">
                <p className="font-mono text-xs font-bold text-[#D97700]">{selected.pcrfNo}</p>
                <h3 className="text-base font-bold text-[#111318]">{selected.title}</h3>
                <p className="text-xs text-[#5C6470]">
                  Submitted by {selected.createdBy} ({selected.form1.department}) · Due{' '}
                  <span className="font-mono tabular-nums">{selected.dueDate}</span>
                </p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="space-y-2">
                  <p className="font-bold text-[#111318]">Engineering Reason</p>
                  <p className="text-[#344054] bg-[#F8F9FB] p-4 rounded-lg leading-5">
                    {selected.form1.reasonForChange}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#F8F9FB] rounded-lg space-y-1">
                    <span className="text-[#5C6470] block">Feasibility</span>
                    <span className="font-bold text-[#111318]">{selected.form2.conclusion}</span>
                  </div>
                  <div className="p-4 bg-[#F8F9FB] rounded-lg space-y-1">
                    <span className="text-[#5C6470] block">Overall Risk</span>
                    <span className="font-bold text-[#111318]">
                      Level {selected.form3.overallRiskLevel} ({selected.form3.conclusion})
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="field-label">
                  Review Comments / Digital Sign-off Note
                </label>
                <textarea
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Enter approval remarks or reason for return/rejection..."
                  className="field-textarea"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction('APPROVE')}
                  className="flex-1 btn-primary"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction('RETURN')}
                  className="btn-secondary"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleAction('REJECT')}
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-red-600 text-red-600 text-[13px] font-semibold hover:bg-red-50 cursor-pointer disabled:opacity-55 transition-colors"
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
