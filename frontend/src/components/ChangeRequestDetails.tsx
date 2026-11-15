import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Printer,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import type {
  ChangeRequestRecord,
  FormIdentifier,
  UserAccount,
} from '../types/pcms';
import { canUserApproveStage, computeChecklistProgress, computeOverallRisk, WORKFLOW_STAGE_ORDER } from '../utils/workflow';
import { StatusText } from './ui/StatusBadge';
import { ProcessChangeRequisitionForm } from './forms/ProcessChangeRequisitionForm';
import { FeasibilityReportForChangeRequest } from './forms/FeasibilityReportForChangeRequest';
import { RiskAnalysisCheckSheet } from './forms/RiskAnalysisCheckSheet';
import { TimingPlan } from './forms/TimingPlan';
import { ChecklistForManagingAndTrackingChange } from './forms/ChecklistForManagingAndTrackingChange';
import { PtrInitiationForm } from './forms/PtrInitiationForm';
import { PpapInitiationFormCumProductionReport } from './forms/PpapInitiationFormCumProductionReport';

export type DetailsTabKey =
  | 'overview'
  | 'form1'
  | 'form2'
  | 'form3'
  | 'form4'
  | 'approval'
  | 'form5'
  | 'form6'
  | 'form7'
  | 'documents'
  | 'history';

interface ChangeRequestDetailsProps {
  record: ChangeRequestRecord;
  user: UserAccount;
  initialTab?: DetailsTabKey;
  onBack: () => void;
  onSaveForm: <K extends FormIdentifier>(
    pcrfId: string,
    formKey: K,
    data: ChangeRequestRecord[K],
  ) => Promise<void>;
  onDecision: (
    pcrfId: string,
    decision: 'APPROVE' | 'REJECT' | 'RETURN',
    comments: string,
  ) => Promise<void>;
  onOpenPrintModal: (formKey: FormIdentifier) => void;
}

const TABS: Array<{ key: DetailsTabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'form1', label: '1. PCRF' },
  { key: 'form2', label: '2. Feasibility' },
  { key: 'form3', label: '3. Risk Analysis' },
  { key: 'form4', label: '4. Timing Plan' },
  { key: 'approval', label: 'Approval' },
  { key: 'form5', label: '5. Checklist (4 Pg)' },
  { key: 'form6', label: '6. PTR' },
  { key: 'form7', label: '7. PPAP' },
  { key: 'documents', label: 'Documents' },
  { key: 'history', label: 'Activity History' },
];

export function ChangeRequestDetails({
  record,
  user,
  initialTab = 'overview',
  onBack,
  onSaveForm,
  onDecision,
  onOpenPrintModal,
}: ChangeRequestDetailsProps) {
  const [activeTab, setActiveTab] = useState<DetailsTabKey>(initialTab);
  const [saving, setSaving] = useState(false);
  const [decisionComments, setDecisionComments] = useState('');
  const [submittingDecision, setSubmittingDecision] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const canApproveCurrent = canUserApproveStage(user.role, record.currentStage);
  const currentStageMeta = WORKFLOW_STAGE_ORDER.find((s) => s.key === record.currentStage);
  const riskStats = computeOverallRisk(record.form3.riskRows);
  const checklistStats = computeChecklistProgress(record.form5.items);

  const stageToTabMap: Record<string, DetailsTabKey> = {
    PCRF: 'form1',
    FEASIBILITY: 'form2',
    RISK_ANALYSIS: 'form3',
    TIMING_PLAN: 'form4',
    INTERNAL_APPROVAL: 'approval',
    CHANGE_CHECKLIST: 'form5',
    PTR: 'form6',
    PPAP: 'form7',
    CLOSURE: 'overview',
  };

  const recommendedTab: DetailsTabKey = stageToTabMap[record.currentStage] || 'form1';
  const FORM_SEQUENCE: DetailsTabKey[] = ['form1', 'form2', 'form3', 'form4', 'form5', 'form6', 'form7'];
  const currentFormIdx = FORM_SEQUENCE.indexOf(activeTab);

  async function handleSave<K extends FormIdentifier>(key: K, val: ChangeRequestRecord[K]) {
    setSaving(true);
    try {
      await onSaveForm(record.id, key, val);
      setToast(`${key.toUpperCase()} saved & interconnected fields synced.`);
      setTimeout(() => setToast(null), 3500);
    } finally {
      setSaving(false);
    }
  }

  async function handleDecisionSubmit(decision: 'APPROVE' | 'REJECT' | 'RETURN') {
    setSubmittingDecision(true);
    try {
      await onDecision(record.id, decision, decisionComments);
      setDecisionComments('');
      setToast(`Workflow stage ${decision.toLowerCase()} recorded.`);
      setTimeout(() => setToast(null), 3500);
    } finally {
      setSubmittingDecision(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Top Action & Toast */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#666666] hover:text-[#151515] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Change Requests</span>
        </button>

        {toast && (
          <div className="px-3.5 py-1.5 rounded-lg bg-[#151515] text-white text-xs font-semibold">
            {toast}
          </div>
        )}
      </div>

      {/* Central PCRF Header Summary */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
              <span className="font-mono font-extrabold text-[#151515]">{record.pcrfNo}</span>
              {record.companyName ? (
                <>
                  <span>·</span>
                  <span className="font-semibold text-[#151515]">{record.companyName}</span>
                </>
              ) : null}
              <span>·</span>
              <span>{record.form1.customer}</span>
              <span>·</span>
              <span>{record.form1.department}</span>
              <span>·</span>
              <span className="font-semibold text-[#E87500]">{record.priority} Priority</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#151515]">{record.title}</h2>
            <p className="text-xs text-[#666666]">
              Part: <strong className="text-[#151515]">{record.form1.partName}</strong> (
              <span className="font-mono">{record.form1.partNo}</span>) · Classification:{' '}
              <strong className="text-[#151515]">
                {record.form1.changeType} · {record.form1.classifications.join(', ')} ·{' '}
                {record.form1.facilityScope}
              </strong>{' '}
              · Created By: <strong className="text-[#151515]">{record.createdBy}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="lg:text-right">
              <p className="text-[11px] text-[#666666] uppercase font-semibold">Current Stage</p>
              <p className="text-xs font-bold text-[#151515]">
                {currentStageMeta?.label || record.currentStage}
              </p>
              <StatusText status={record.overallStatus} />
            </div>
            <button
              type="button"
              onClick={() => onOpenPrintModal('form1')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#151515] hover:bg-[#242424] text-white text-xs font-bold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Forms</span>
            </button>
          </div>
        </div>

        {/* 9-Stage Interactive Workflow Timeline */}
        <div className="pt-4 border-t border-[#E6E6E6]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-2.5">
            {record.workflow.map((st, idx) => {
              const isCompleted = st.status === 'COMPLETED';
              const isCurrent = st.status === 'IN_PROGRESS';
              const isRejected = st.status === 'REJECTED';
              const isReturned = st.status === 'RETURNED';
              const targetTab = stageToTabMap[st.key] || 'overview';
              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setActiveTab(targetTab)}
                  title={`Open ${st.label}`}
                  className="flex flex-col text-left group cursor-pointer rounded-lg p-1.5 hover:bg-[#F7F7F7] transition-colors min-w-0"
                >
                  <div className="flex items-center gap-1.5 mb-1.5 w-full">
                    <span
                      className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums transition-transform group-hover:scale-105 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-[#F28C00] text-white'
                          : isRejected
                          ? 'bg-red-600 text-white'
                          : isReturned
                          ? 'bg-amber-600 text-white'
                          : 'bg-[#F7F7F7] text-[#666666] border border-[#E6E6E6]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div
                      className={`h-0.5 flex-1 ${
                        isCompleted ? 'bg-emerald-600' : 'bg-[#E6E6E6]'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-[#151515] group-hover:text-[#E87500] leading-tight">
                    {st.label}
                  </p>
                  <div className="mt-0.5">
                    <StatusText status={st.status} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Next Step Guidance Banner */}
      {record.overallStatus !== 'Closed' && record.overallStatus !== 'Rejected' && (
        <div className="bg-white border border-[#E6E6E6] rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs">
            <span className="font-bold uppercase tracking-wider text-[#E87500]">
              Active Stage: {currentStageMeta?.label || record.currentStage}
            </span>
            <p className="text-[#444444] mt-0.5">
              {canApproveCurrent
                ? 'Your role is authorized to review and sign off on this stage.'
                : 'Fill or review the active stage form below. Metadata auto-syncs across all 7 forms.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeTab !== recommendedTab && (
              <button
                type="button"
                onClick={() => setActiveTab(recommendedTab)}
                className="px-3.5 py-2 rounded-lg bg-[#151515] hover:bg-[#F28C00] text-white text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
              >
                Open Stage Form →
              </button>
            )}
            {canApproveCurrent && activeTab !== 'approval' && (
              <button
                type="button"
                onClick={() => setActiveTab('approval')}
                className="px-3.5 py-2 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-xs font-bold whitespace-nowrap cursor-pointer"
              >
                Review &amp; Approve Stage →
              </button>
            )}
          </div>
        </div>
      )}

      {/* 11-Tab Navigation */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              activeTab === t.key
                ? 'bg-[#F28C00] text-white'
                : 'text-[#666666] hover:text-[#151515] hover:bg-[#F7F7F7]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Body */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#151515] border-b border-[#E6E6E6] pb-2">
              Interconnected 7-Form Completion Status
            </h3>
            <div className="divide-y divide-[#E6E6E6]">
              {(
                [
                  ['form1', 'Form 1 — Process Change Requisition (PCRF)', 'QF/07/MRO-15', `${record.form1.particularsRows.length} particular(s)`],
                  ['form2', 'Form 2 — Feasibility Report', 'QF/07/MRO-02', record.form2.conclusion],
                  ['form3', 'Form 3 — Risk Analysis Check Sheet', 'QF/07/MKT-14', `Overall Risk: ${record.form3.overallRiskLevel} (${riskStats.evaluatedCount}/${record.form3.riskRows.length})`],
                  ['form4', 'Form 4 — Timing Plan (APQP Phase I)', 'QF/07/MKT-08', `Go Next Phase: ${record.form4.goForNextPhase}`],
                  ['form5', 'Form 5 — Change Management Checklist (4 Pages)', 'QF/07/MRO-03', `${checklistStats.percentComplete}% Complete`],
                  ['form6', 'Form 6 — PTR Initiation (1 / 2 / 3)', 'QF/07/MRO-16', `PTR1: ${record.form6.ptr1.sampleStatus} · PTR2: ${record.form6.ptr2.sampleStatus}`],
                  ['form7', 'Form 7 — PPAP Initiation & Production Report', 'QF/07/MRO-05', `Submission: ${record.form7.submissionStatus}`],
                ] as const
              ).map(([fKey, label, code, summary]) => (
                <div key={fKey} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#151515]">{label}</p>
                    <p className="text-xs text-[#666666]">
                      <span className="font-mono">{code}</span> · {summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenPrintModal(fKey)}
                      className="px-2.5 py-1.5 rounded border border-[#E6E6E6] hover:border-[#151515] text-xs font-semibold text-[#151515] cursor-pointer"
                    >
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab(fKey)}
                      className="px-3 py-1.5 rounded bg-[#151515] hover:bg-[#F28C00] text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Fill / Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#151515] border-b border-[#E6E6E6] pb-2">
              Reason &amp; Engineering Summary
            </h3>
            <p className="text-sm text-[#333333] leading-relaxed">{record.form1.reasonForChange}</p>
            <div className="space-y-2 pt-2 border-t border-[#E6E6E6] text-xs">
              <div className="flex justify-between">
                <span className="text-[#666666]">SOP Reflection</span>
                <span className="font-semibold">
                  {record.form1.changeReflectionInSOP
                    ? `Required (${record.form1.sopDocumentRef || 'Pending Ref'})`
                    : 'Not flagged'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Target Due Date</span>
                <span className="font-mono font-semibold">{record.dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#666666]">Last Updated</span>
                <span className="font-mono font-semibold">{record.updatedAt}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'form1' && (
        <ProcessChangeRequisitionForm
          data={record.form1}
          currentUser={user}
          saving={saving}
          onSave={(val) => handleSave('form1', val)}
          onPrintOfficial={() => onOpenPrintModal('form1')}
        />
      )}

      {activeTab === 'form2' && (
        <FeasibilityReportForChangeRequest
          data={record.form2}
          currentUser={user}
          saving={saving}
          onSave={(val) => handleSave('form2', val)}
          onPrintOfficial={() => onOpenPrintModal('form2')}
        />
      )}

      {activeTab === 'form3' && (
        <RiskAnalysisCheckSheet
          data={record.form3}
          currentUser={user}
          saving={saving}
          onSave={(val) => handleSave('form3', val)}
          onPrintOfficial={() => onOpenPrintModal('form3')}
        />
      )}

      {activeTab === 'form4' && (
        <TimingPlan
          data={record.form4}
          currentUser={user}
          saving={saving}
          onSave={(val) => handleSave('form4', val)}
          onPrintOfficial={() => onOpenPrintModal('form4')}
        />
      )}

      {activeTab === 'form5' && (
        <ChecklistForManagingAndTrackingChange
          data={record.form5}
          currentUser={user}
          saving={saving}
          onSave={(val) => handleSave('form5', val)}
          onPrintOfficial={() => onOpenPrintModal('form5')}
        />
      )}

      {activeTab === 'form6' && (
        <PtrInitiationForm
          data={record.form6}
          currentUser={user}
          saving={saving}
          onSave={(val) => handleSave('form6', val)}
          onPrintOfficial={() => onOpenPrintModal('form6')}
        />
      )}

      {activeTab === 'form7' && (
        <PpapInitiationFormCumProductionReport
          data={record.form7}
          currentUser={user}
          saving={saving}
          onSave={(val) => handleSave('form7', val)}
          onPrintOfficial={() => onOpenPrintModal('form7')}
        />
      )}

      {/* Sequential Form Wizard Bar */}
      {currentFormIdx !== -1 && (
        <div className="bg-white border border-[#E6E6E6] rounded-xl px-5 py-3 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentFormIdx === 0}
            onClick={() => setActiveTab(FORM_SEQUENCE[currentFormIdx - 1])}
            className="px-3.5 py-2 rounded-lg border border-[#E6E6E6] hover:border-[#151515] text-xs font-bold text-[#151515] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            ← Previous Form
          </button>
          <span className="text-xs font-semibold text-[#666666] tabular-nums">
            Form {currentFormIdx + 1} of {FORM_SEQUENCE.length}
          </span>
          <button
            type="button"
            onClick={() =>
              setActiveTab(
                currentFormIdx < FORM_SEQUENCE.length - 1
                  ? FORM_SEQUENCE[currentFormIdx + 1]
                  : 'approval',
              )
            }
            className="px-3.5 py-2 rounded-lg bg-[#151515] hover:bg-[#F28C00] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {currentFormIdx < FORM_SEQUENCE.length - 1 ? 'Next Form →' : 'Go to Approval Gate →'}
          </button>
        </div>
      )}

      {activeTab === 'approval' && (
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E6E6] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#151515]">
                Stage Approval Gate — {currentStageMeta?.label}
              </h3>
              <p className="text-xs text-[#666666]">
                Authorized decisions advance or return the change request across the 9-stage workflow.
              </p>
            </div>
            <StatusText status={record.overallStatus} />
          </div>

          {canApproveCurrent ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#151515] mb-1.5">
                  Approval / Review Comments &amp; Sign-Off Note
                </label>
                <textarea
                  rows={3}
                  value={decisionComments}
                  onChange={(e) => setDecisionComments(e.target.value)}
                  placeholder="Enter technical review remarks, conditions, or rejection/return justification..."
                  className="w-full px-3 py-2 text-sm border border-[#E6E6E6] rounded-lg focus:outline-none focus:border-[#F28C00]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={submittingDecision}
                  onClick={() => handleDecisionSubmit('APPROVE')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve &amp; Advance Stage</span>
                </button>
                <button
                  type="button"
                  disabled={submittingDecision}
                  onClick={() => handleDecisionSubmit('RETURN')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#151515] text-[#151515] hover:bg-[#F7F7F7] text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return for Correction</span>
                </button>
                <button
                  type="button"
                  disabled={submittingDecision}
                  onClick={() => handleDecisionSubmit('REJECT')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 text-xs font-bold cursor-pointer disabled:opacity-60"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Change</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#F7F7F7] border border-[#E6E6E6] text-xs text-[#666666]">
              Your current role (<strong>{user.role}</strong>) is read-only for the{' '}
              <strong>{currentStageMeta?.label}</strong> approval gate. Authorized approvers can sign
              off from this screen or the Approval Center.
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6E6E6] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#151515]">
                Official Printable Documents &amp; Engineering Records
              </h3>
              <p className="text-xs text-[#666666]">
                Every official consultancy form renders directly from live saved database records.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              [
                ['form1', 'QF/07/MRO-15', 'Process Change Requisition Form'],
                ['form2', 'QF/07/MRO-02', 'Feasibility Report for Change Request'],
                ['form3', 'QF/07/MKT-14', 'Risk Analysis Check Sheet'],
                ['form4', 'QF/07/MKT-08', 'Timing Plan (APQP Phase I)'],
                ['form5', 'QF/07/MRO-03', 'Checklist for Managing Change (4 Pages)'],
                ['form6', 'QF/07/MRO-16', 'PTR Initiation Form'],
                ['form7', 'QF/07/MRO-05', 'PPAP Initiation & Production Report'],
              ] as const
            ).map(([fKey, code, title]) => (
              <div
                key={fKey}
                className="p-4 border border-[#E6E6E6] rounded-lg flex flex-col justify-between gap-3"
              >
                <div>
                  <span className="font-mono text-xs font-bold text-[#E87500]">{code}</span>
                  <p className="text-sm font-bold text-[#151515] mt-0.5">{title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPrintModal(fKey)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#151515] hover:bg-[#F28C00] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Open Official Printable PDF</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#151515] border-b border-[#E6E6E6] pb-2">
            Activity &amp; Audit Trail
          </h3>
          <div className="divide-y divide-[#E6E6E6]">
            {record.activityHistory.map((entry) => (
              <div key={entry.id} className="py-3 flex items-start gap-3 text-xs">
                <Clock className="w-4 h-4 text-[#F28C00] shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#151515]">{entry.action}</span>
                    <span className="font-mono text-[#666666]">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[#666666] mt-0.5">
                    {entry.actorName} ({entry.actorRole}) · Stage: {entry.stage}
                  </p>
                  {entry.comments && <p className="text-[#151515] mt-1">{entry.comments}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
