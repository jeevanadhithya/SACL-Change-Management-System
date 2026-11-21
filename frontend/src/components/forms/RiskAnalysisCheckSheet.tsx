import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCheck, Link2, PenLine, Plus, Printer, Save } from 'lucide-react';
import type {
  Form3RiskAnalysis,
  RiskCategoryName,
  RiskPointRow,
  UserAccount,
} from '../../types/pcms';
import { computeOverallRisk } from '../../utils/workflow';

interface RiskAnalysisCheckSheetProps {
  data: Form3RiskAnalysis;
  currentUser?: UserAccount;
  saving: boolean;
  onSave: (updated: Form3RiskAnalysis) => Promise<void>;
  onPrintOfficial: () => void;
}

const CATEGORIES: Array<'ALL' | RiskCategoryName> = [
  'ALL',
  'Man',
  'Method',
  'Machine',
  'Material',
  'Cost',
  'Quality',
  'Delivery',
];

export function RiskAnalysisCheckSheet({
  data,
  currentUser,
  saving,
  onSave,
  onPrintOfficial,
}: RiskAnalysisCheckSheetProps) {
  const [form, setForm] = useState<Form3RiskAnalysis>(data);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | RiskCategoryName>('ALL');

  useEffect(() => {
    setForm(data);
  }, [data]);

  const stats = computeOverallRisk(form.riskRows);
  const visibleRows =
    categoryFilter === 'ALL'
      ? form.riskRows
      : form.riskRows.filter((r) => r.category === categoryFilter);

  function updateRow(id: string, patch: Partial<RiskPointRow>) {
    setForm((prev) => {
      const updatedRows = prev.riskRows.map((r) => (r.id === id ? { ...r, ...patch } : r));
      const nextStats = computeOverallRisk(updatedRows);
      return {
        ...prev,
        riskRows: updatedRows,
        overallRiskLevel: nextStats.overallRiskLevel,
      };
    });
  }

  function markUnevaluatedLow() {
    setForm((prev) => {
      const updatedRows = prev.riskRows.map((r) =>
        r.riskLevel === 'NA' ? { ...r, riskLevel: 'LOW' as const } : r,
      );
      const nextStats = computeOverallRisk(updatedRows);
      return {
        ...prev,
        riskRows: updatedRows,
        overallRiskLevel: nextStats.overallRiskLevel,
      };
    });
  }

  function addCustomRiskRow() {
    const newRow: RiskPointRow = {
      id: `risk-custom-${Date.now()}`,
      category: (categoryFilter === 'ALL' ? 'Method' : categoryFilter) as RiskCategoryName,
      riskPoint: 'Additional CFT Risk Point',
      applicability: 'AP',
      controlMethod: '',
      riskLevel: 'LOW',
      effectOnQCD: '',
      actions: '',
    };
    setForm((prev) => ({ ...prev, riskRows: [...prev.riskRows, newRow] }));
  }

  return (
    <div className="space-y-6">
      <div className="surface-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C6470]">
            <span className="font-mono font-bold text-[#111318]">QF/07/MKT-14</span>
            <span>·</span>
            <span>Rev.No.02 dt 13.02.2019</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#D97700] font-semibold">
              <Link2 className="w-3.5 h-3.5" /> Linked to {form.partNo} ({form.customer})
            </span>
          </div>
          <h3 className="text-base font-bold text-[#111318]">
            Form 3 — Risk Analysis Check Sheet
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
            <span>{saving ? 'Saving...' : 'Save Risk Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Live Risk Summary Bar */}
      <div className="surface-card p-6 grid grid-cols-2 sm:grid-cols-5 gap-6">
        <div className="space-y-1">
          <p className="text-xs text-[#5C6470]">Part / Customer</p>
          <p className="text-sm font-bold text-[#111318] truncate">{form.partName}</p>
          <p className="text-xs font-mono text-[#5C6470]">{form.partNo}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-[#5C6470]">High Risk Items</p>
          <p className="text-2xl font-bold text-red-600 tabular-nums leading-8">{stats.highCount}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-[#5C6470]">Medium Risk Items</p>
          <p className="text-2xl font-bold text-[#D97700] tabular-nums leading-8">{stats.mediumCount}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-[#5C6470]">Low / NA Items</p>
          <p className="text-2xl font-bold text-[#111318] tabular-nums leading-8">
            {stats.lowCount} / {stats.naCount}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-[#5C6470]">Computed Overall Risk</p>
          <p
            className={`text-2xl font-bold tabular-nums leading-8 ${
              form.overallRiskLevel === 'H'
                ? 'text-red-600'
                : form.overallRiskLevel === 'M'
                ? 'text-[#D97700]'
                : 'text-emerald-700'
            }`}
          >
            Level {form.overallRiskLevel}
          </p>
        </div>
      </div>

      {/* Interactive Risk Matrix */}
      <div className="surface-card overflow-hidden">
        <div className="surface-header flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[#111318] text-white'
                    : 'bg-white text-[#5C6470] border border-[#E4E7EC] hover:text-[#111318]'
                }`}
              >
                {cat === 'ALL' ? `All (${form.riskRows.length})` : cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {stats.naCount > 0 && (
              <button
                type="button"
                onClick={markUnevaluatedLow}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111318] hover:text-[#D97700] cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Set Unevaluated (NA) as Low</span>
              </button>
            )}
            <button
              type="button"
              onClick={addCustomRiskRow}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#D97700] hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Risk Point
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-bold text-[#5C6470] uppercase tracking-wider">
                <th className="h-10 px-4 w-24">Category</th>
                <th className="h-10 px-3 w-48">Risk Points</th>
                <th className="h-10 px-3 w-24">AP / NAP</th>
                <th className="h-10 px-3 min-w-[180px]">Control Method</th>
                <th className="h-10 px-3 w-56">Risk Level (High / Low / Med / NA)</th>
                <th className="h-10 px-3 w-36">Effect on QCD</th>
                <th className="h-10 px-4 min-w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC]">
              {visibleRows.map((row) => {
                const isHigh = row.riskLevel === 'HIGH';
                return (
                  <tr
                    key={row.id}
                    className={isHigh ? 'bg-red-50/70' : 'hover:bg-[#F8F9FB] transition-colors'}
                  >
                    <td className="py-3 px-4 font-bold text-[#111318]">{row.category}</td>
                    <td className="py-3 px-3 font-medium text-[#111318]">
                      <div className="flex items-center gap-1.5">
                        {isHigh && <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                        <input
                          type="text"
                          value={row.riskPoint}
                          onChange={(e) => updateRow(row.id, { riskPoint: e.target.value })}
                          className="w-full h-8 bg-transparent border-b border-transparent focus:border-[#F28C00] focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={row.applicability}
                        onChange={(e) =>
                          updateRow(row.id, { applicability: e.target.value as 'AP' | 'NAP' })
                        }
                        className="h-8 px-2 border border-[#E4E7EC] rounded-md bg-white font-semibold"
                      >
                        <option value="AP">AP</option>
                        <option value="NAP">NAP</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={row.controlMethod}
                        onChange={(e) => updateRow(row.id, { controlMethod: e.target.value })}
                        placeholder="Control method..."
                        className="w-full h-8 px-2 border border-[#E4E7EC] rounded-md bg-white focus:outline-none focus:border-[#F28C00]"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="inline-flex rounded-md border border-[#E4E7EC] overflow-hidden bg-white">
                        {(['HIGH', 'MEDIUM', 'LOW', 'NA'] as const).map((lvl) => {
                          const active = row.riskLevel === lvl;
                          const activeStyle =
                            lvl === 'HIGH'
                              ? 'bg-red-600 text-white'
                              : lvl === 'MEDIUM'
                              ? 'bg-[#F28C00] text-white'
                              : lvl === 'LOW'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#111318] text-white';
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => updateRow(row.id, { riskLevel: lvl })}
                              className={`h-8 px-2 text-[11px] font-bold cursor-pointer ${
                                active ? activeStyle : 'text-[#5C6470] hover:bg-[#F8F9FB]'
                              }`}
                            >
                              {lvl === 'MEDIUM' ? 'MED' : lvl}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={row.effectOnQCD}
                        onChange={(e) => updateRow(row.id, { effectOnQCD: e.target.value })}
                        className="w-full h-8 px-2 border border-[#E4E7EC] rounded-md bg-white"
                      >
                        <option value="">Select QCD</option>
                        <option value="Quality">Quality</option>
                        <option value="Cost">Cost</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Quality / Cost">Quality / Cost</option>
                        <option value="Quality / Delivery">Quality / Delivery</option>
                        <option value="None">None</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={row.actions}
                        onChange={(e) => updateRow(row.id, { actions: e.target.value })}
                        placeholder="Mitigation action..."
                        className="w-full h-8 px-2 border border-[#E4E7EC] rounded-md bg-white focus:outline-none focus:border-[#F28C00]"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Conclusion & 6 CFT Signatures */}
      <div className="surface-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E4E7EC]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#111318] mr-2">Risk Conclusion:</span>
            {(['Acceptable', 'Not Acceptable', 'Pending'] as const).map((conc) => (
              <button
                key={conc}
                type="button"
                onClick={() => setForm({ ...form, conclusion: conc })}
                className={`h-8 px-4 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                  form.conclusion === conc
                    ? conc === 'Acceptable'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : conc === 'Not Acceptable'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-[#111318] text-white border-[#111318]'
                    : 'bg-white text-[#5C6470] border-[#E4E7EC] hover:border-[#111318]'
                }`}
              >
                {conc}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5C6470]">Overall Risk Level:</span>
            {(['H', 'L', 'M'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setForm({ ...form, overallRiskLevel: lvl })}
                className={`w-10 h-8 rounded-lg text-xs font-bold border cursor-pointer transition-colors ${
                  form.overallRiskLevel === lvl
                    ? 'bg-[#F28C00] text-white border-[#F28C00]'
                    : 'bg-white text-[#111318] border-[#E4E7EC] hover:border-[#111318]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {form.cftSignatures.map((sig) => (
            <div key={sig.slot} className="p-4 bg-[#F8F9FB] rounded-lg flex items-center gap-2">
              <span className="text-xs font-bold text-[#5C6470] tabular-nums">{sig.slot})</span>
              <input
                type="text"
                value={sig.name}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    cftSignatures: prev.cftSignatures.map((s) =>
                      s.slot === sig.slot ? { ...s, name: e.target.value, signed: Boolean(e.target.value) } : s,
                    ),
                  }))
                }
                placeholder={`${sig.department} Member Sign`}
                className="field-input flex-1 !h-8 !text-xs"
              />
              {currentUser && (
                <button
                  type="button"
                  title="Sign as Me"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      cftSignatures: prev.cftSignatures.map((s) =>
                        s.slot === sig.slot
                          ? { ...s, name: currentUser.name, signed: true, date: new Date().toISOString().slice(0, 10) }
                          : s,
                      ),
                    }))
                  }
                  className="w-8 h-8 inline-flex items-center justify-center text-[#D97700] hover:bg-[#FFF5E8] rounded-md cursor-pointer shrink-0"
                >
                  <PenLine className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
