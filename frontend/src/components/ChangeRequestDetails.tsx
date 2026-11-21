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
    <div className="space-y-6">
      {/* Top Action & Toast */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#5C6470] hover:text-[#111318] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Change Requests</span>
        </button>

        {toast && (
          <div className="px-4 py-2 rounded-lg bg-[#121417] text-white text-xs font-semibold">
            {toast}
          </div>
        )}
      </div>

      {/* Central PCRF Header Summary */}
      <div className="surface-card p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C6470]">
              <span className="font-mono font-extrabold text-[#111318]">{record.pcrfNo}</span>
              {record.companyName ? (
                <>
                  <span>·</span>
                  <span className="font-semibold text-[#111318]">{record.companyName}</span>
                </>
              ) : null}
              <span>·</span>
              <span>{record.form1.customer}</span>
              <span>·</span>
              <span>{record.form1.department}</span>
              <span>·</span>
              <span className="font-semibold text-[#D97700]">{record.priority} Priority</span>
            </div>
            <h2 className="text-2xl leading-8 font-extrabold text-[#111318] tracking-tight">
              {record.title}
            </h2>
            <p className="text-xs text-[#5C6470]">
              Part: <strong className="text-[#111318]">{record.form1.partName}</strong> (
              <span className="font-mono">{record.form1.partNo}</span>) · Classification:{' '}
              <strong className="text-[#111318]">
                {record.form1.changeType} · {record.form1.classifications.join(', ')} ·{' '}
                {record.form1.facilityScope}
              </strong>{' '}
              · Created By: <strong className="text-[#111318]">{record.createdBy}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 shrink-0">
            <div className="lg:text-right">
              <p className="text-[11px] text-[#5C6470] uppercase font-semibold tracking-wider">
                Current Stage
              </p>
              <p className="text-xs font-bold text-[#111318] mt-1">
                {currentStageMeta?.label || record.currentStage}
              </p>
              <StatusText status={record.overallStatus} />
            </div>
            <button
              type="button"
              onClick={() => onOpenPrintModal('form1')}
              className="btn-dark"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Forms</span>
            </button>
          </div>
        </div>

        {/* 9-Stage Interactive Workflow Timeline */}
        <div className="pt-6 border-t border-[#E4E7EC]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-9 gap-2">
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
                  className="flex flex-col text-left group cursor-pointer rounded-lg p-2 hover:bg-[#F8F9FB] transition-colors min-w-0"
                >
                  <div className="flex items-center gap-2 mb-2 w-full">
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
                          : 'bg-[#F4F5F7] text-[#5C6470] border border-[#E4E7EC]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div
                      className={`h-0.5 flex-1 ${
                        isCompleted ? 'bg-emerald-600' : 'bg-[#E4E7EC]'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-[#111318] group-hover:text-[#D97700] leading-4">
                    {st.label}
                  </p>
                  <div className="mt-1">
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
        <div className="surface-card px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs space-y-1">
            <span className="font-bold uppercase tracking-[0.08em] text-[#D97700]">
              Active Stage: {currentStageMeta?.label || record.currentStage}
            </span>
            <p className="text-[#344054]">
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
                className="btn-dark"
              >
                Open Stage Form →
              </button>
            )}
            {canApproveCurrent && activeTab !== 'approval' && (
              <button
                type="button"
                onClick={() => setActiveTab('approval')}
                className="btn-primary"
              >
                Review &amp; Approve Stage →
              </button>
            )}
          </div>
        </div>
      )}

      {/* 11-Tab Navigation (8pt Rhythm: p-2, gap-1, h-10 tabs) */}
      <div className="surface-card p-2 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`h-10 px-4 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              activeTab === t.key
                ? 'bg-[#F28C00] text-white'
                : 'text-[#5C6470] hover:text-[#111318] hover:bg-[#F8F9FB]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Body */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 surface-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#111318] border-b border-[#E4E7EC] pb-4">
              Interconnected 7-Form Completion Status
            </h3>
            <div className="divide-y divide-[#E4E7EC]">
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
                <div key={fKey} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-[#111318]">{label}</p>
                    <p className="text-xs text-[#5C6470]">
                      <span className="font-mono">{code}</span> · {summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenPrintModal(fKey)}
                      className="btn-compact border border-[#D5DAE1] bg-white hover:border-[#121417] text-[#111318]"
                    >
                      Print
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab(fKey)}
                      className="btn-compact bg-[#121417] hover:bg-[#F28C00] text-white"
                    >
                      Fill / Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="surface-card p-6 space-y-4">
            <h3 className="text-sm font-bold text-[#111318] border-b border-[#E4E7EC] pb-4">
              Reason &amp; Engineering Summary
            </h3>
            <p className="text-sm text-[#344054] leading-6">{record.form1.reasonForChange}</p>
            <div className="space-y-2 pt-4 border-t border-[#E4E7EC] text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-[#5C6470]">SOP Reflection</span>
                <span className="font-semibold text-[#111318]">
                  {record.form1.changeReflectionInSOP
                    ? `Required (${record.form1.sopDocumentRef || 'Pending Ref'})`
                    : 'Not flagged'}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#5C6470]">Target Due Date</span>
                <span className="font-mono font-semibold tabular-nums text-[#111318]">
                  {record.dueDate}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#5C6470]">Last Updated</span>
                <span className="font-mono font-semibold tabular-nums text-[#111318]">
                  {record.updatedAt}
                </span>
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
        <div className="surface-card px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentFormIdx === 0}
            onClick={() => setActiveTab(FORM_SEQUENCE[currentFormIdx - 1])}
            className="btn-secondary disabled:pointer-events-none"
          >
            ← Previous Form
          </button>
          <span className="text-xs font-semibold text-[#5C6470] tabular-nums">
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
            className="btn-dark hover:bg-[#F28C00]"
          >
            {currentFormIdx < FORM_SEQUENCE.length - 1 ? 'Next Form →' : 'Go to Approval Gate →'}
          </button>
        </div>
      )}

      {activeTab === 'approval' && (
        <div className="surface-card p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4E7EC] pb-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#111318]">
                Stage Approval Gate — {currentStageMeta?.label}
              </h3>
              <p className="text-xs text-[#5C6470]">
                Authorized decisions advance or return the change request across the 9-stage workflow.
              </p>
            </div>
            <StatusText status={record.overallStatus} />
          </div>

          {canApproveCurrent ? (
            <div className="space-y-4">
              <div>
                <label className="field-label">
                  Approval / Review Comments &amp; Sign-Off Note
                </label>
                <textarea
                  rows={3}
                  value={decisionComments}
                  onChange={(e) => setDecisionComments(e.target.value)}
                  placeholder="Enter technical review remarks, conditions, or rejection/return justification..."
                  className="field-textarea"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  disabled={submittingDecision}
                  onClick={() => handleDecisionSubmit('APPROVE')}
                  className="btn-primary"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve &amp; Advance Stage</span>
                </button>
                <button
                  type="button"
                  disabled={submittingDecision}
                  onClick={() => handleDecisionSubmit('RETURN')}
                  className="btn-secondary"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Return for Correction</span>
                </button>
                <button
                  type="button"
                  disabled={submittingDecision}
                  onClick={() => handleDecisionSubmit('REJECT')}
                  className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-red-600 text-red-600 hover:bg-red-50 text-[13px] font-semibold cursor-pointer disabled:opacity-55 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Change</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-[#F8F9FB] text-xs text-[#5C6470]">
              Your current role (<strong className="text-[#111318]">{user.role}</strong>) is read-only for the{' '}
              <strong className="text-[#111318]">{currentStageMeta?.label}</strong> approval gate. Authorized approvers can sign
              off from this screen or the Approval Center.
            </div>
          )}
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="surface-card p-6 space-y-6">
          <div className="border-b border-[#E4E7EC] pb-4 space-y-1">
            <h3 className="text-sm font-bold text-[#111318]">
              Official Printable Documents &amp; Engineering Records
            </h3>
            <p className="text-xs text-[#5C6470]">
              Every official consultancy form renders directly from live saved database records.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                className="p-4 bg-[#F8F9FB] rounded-lg flex flex-col justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold text-[#D97700]">{code}</span>
                  <p className="text-sm font-bold text-[#111318]">{title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPrintModal(fKey)}
                  className="btn-dark w-full hover:bg-[#F28C00]"
                >
                  <Printer className="w-4 h-4" />
                  <span>Open Official Printable PDF</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="surface-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#111318] border-b border-[#E4E7EC] pb-4">
            Activity &amp; Audit Trail
          </h3>
          <div className="divide-y divide-[#E4E7EC]">
            {record.activityHistory.map((entry) => (
              <div key={entry.id} className="py-4 flex items-start gap-4 text-xs">
                <Clock className="w-4 h-4 text-[#F28C00] shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-[#111318]">{entry.action}</span>
                    <span className="font-mono tabular-nums text-[#5C6470]">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[#5C6470]">
                    {entry.actorName} ({entry.actorRole}) · Stage: {entry.stage}
                  </p>
                  {entry.comments && <p className="text-[#111318]">{entry.comments}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
