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
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
            <span className="font-mono font-bold text-[#151515]">QF/07/MKT-14</span>
            <span>·</span>
            <span>Rev.No.02 dt 13.02.2019</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1 text-[#E87500] font-semibold">
              <Link2 className="w-3.5 h-3.5" /> Linked to {form.partNo} ({form.customer})
            </span>
          </div>
          <h3 className="text-base font-bold text-[#151515] mt-0.5">
            Form 3 — Risk Analysis Check Sheet
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
            <span>{saving ? 'Saving...' : 'Save Risk Analysis'}</span>
          </button>
        </div>
      </div>

      {/* Live Risk Summary Bar */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div>
          <p className="text-xs text-[#666666]">Part / Customer</p>
          <p className="text-sm font-bold text-[#151515] truncate">{form.partName}</p>
          <p className="text-xs font-mono text-[#666666]">{form.partNo}</p>
        </div>
        <div>
          <p className="text-xs text-[#666666]">High Risk Items</p>
          <p className="text-xl font-extrabold text-red-600 tabular-nums">{stats.highCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#666666]">Medium Risk Items</p>
          <p className="text-xl font-extrabold text-[#E87500] tabular-nums">{stats.mediumCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#666666]">Low / NA Items</p>
          <p className="text-xl font-extrabold text-[#151515] tabular-nums">
            {stats.lowCount} / {stats.naCount}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#666666]">Computed Overall Risk</p>
          <p
            className={`text-xl font-extrabold tabular-nums ${
              form.overallRiskLevel === 'H'
                ? 'text-red-600'
                : form.overallRiskLevel === 'M'
                ? 'text-[#E87500]'
                : 'text-emerald-700'
            }`}
          >
            Level {form.overallRiskLevel}
          </p>
        </div>
      </div>

      {/* Interactive Risk Matrix */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E6E6E6] flex flex-wrap items-center justify-between gap-3 bg-[#F7F7F7]">
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#151515] text-white'
                    : 'bg-white text-[#666666] border border-[#E6E6E6] hover:text-[#151515]'
                }`}
              >
                {cat === 'ALL' ? `All (${form.riskRows.length})` : cat}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {stats.naCount > 0 && (
              <button
                type="button"
                onClick={markUnevaluatedLow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#151515] hover:text-[#E87500] cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Set Unevaluated (NA) as Low</span>
              </button>
            )}
            <button
              type="button"
              onClick={addCustomRiskRow}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#E87500] hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Risk Point
            </button>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F7F7F7] border-b border-[#E6E6E6] text-[11px] font-bold text-[#666666] uppercase">
                <th className="py-2.5 px-3 w-24">Category</th>
                <th className="py-2.5 px-3 w-48">Risk Points</th>
                <th className="py-2.5 px-3 w-24">AP / NAP</th>
                <th className="py-2.5 px-3 min-w-[180px]">Control Method</th>
                <th className="py-2.5 px-3 w-56">Risk Level (High / Low / Med / NA)</th>
                <th className="py-2.5 px-3 w-36">Effect on QCD</th>
                <th className="py-2.5 px-3 min-w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E6]">
              {visibleRows.map((row) => {
                const isHigh = row.riskLevel === 'HIGH';
                return (
                  <tr
                    key={row.id}
                    className={isHigh ? 'bg-red-50/70' : 'hover:bg-[#F7F7F7]/60'}
                  >
                    <td className="p-2.5 font-bold text-[#151515]">{row.category}</td>
                    <td className="p-2.5 font-medium text-[#151515]">
                      <div className="flex items-center gap-1.5">
                        {isHigh && <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
                        <input
                          type="text"
                          value={row.riskPoint}
                          onChange={(e) => updateRow(row.id, { riskPoint: e.target.value })}
                          className="w-full bg-transparent border-b border-transparent focus:border-[#F28C00] focus:outline-none"
                        />
                      </div>
                    </td>
                    <td className="p-2.5">
                      <select
                        value={row.applicability}
                        onChange={(e) =>
                          updateRow(row.id, { applicability: e.target.value as 'AP' | 'NAP' })
                        }
                        className="px-2 py-1 border border-[#E6E6E6] rounded bg-white font-semibold"
                      >
                        <option value="AP">AP</option>
                        <option value="NAP">NAP</option>
                      </select>
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={row.controlMethod}
                        onChange={(e) => updateRow(row.id, { controlMethod: e.target.value })}
                        placeholder="Control method..."
                        className="w-full px-2 py-1 border border-[#E6E6E6] rounded bg-white"
                      />
                    </td>
                    <td className="p-2.5">
                      <div className="inline-flex rounded-md border border-[#E6E6E6] overflow-hidden bg-white">
                        {(['HIGH', 'MEDIUM', 'LOW', 'NA'] as const).map((lvl) => {
                          const active = row.riskLevel === lvl;
                          const activeStyle =
                            lvl === 'HIGH'
                              ? 'bg-red-600 text-white'
                              : lvl === 'MEDIUM'
                              ? 'bg-[#F28C00] text-white'
                              : lvl === 'LOW'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[#151515] text-white';
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => updateRow(row.id, { riskLevel: lvl })}
                              className={`px-2 py-1 text-[11px] font-bold cursor-pointer ${
                                active ? activeStyle : 'text-[#666666] hover:bg-[#F7F7F7]'
                              }`}
                            >
                              {lvl === 'MEDIUM' ? 'MED' : lvl}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="p-2.5">
                      <select
                        value={row.effectOnQCD}
                        onChange={(e) => updateRow(row.id, { effectOnQCD: e.target.value })}
                        className="w-full px-2 py-1 border border-[#E6E6E6] rounded bg-white"
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
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={row.actions}
                        onChange={(e) => updateRow(row.id, { actions: e.target.value })}
                        placeholder="Mitigation action..."
                        className="w-full px-2 py-1 border border-[#E6E6E6] rounded bg-white"
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
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E6E6]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[#151515] mr-1">Risk Conclusion:</span>
            {(['Acceptable', 'Not Acceptable', 'Pending'] as const).map((conc) => (
              <button
                key={conc}
                type="button"
                onClick={() => setForm({ ...form, conclusion: conc })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                  form.conclusion === conc
                    ? conc === 'Acceptable'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : conc === 'Not Acceptable'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-[#151515] text-white border-[#151515]'
                    : 'bg-white text-[#666666] border-[#E6E6E6]'
                }`}
              >
                {conc}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#666666]">Overall Risk Level:</span>
            {(['H', 'L', 'M'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setForm({ ...form, overallRiskLevel: lvl })}
                className={`w-9 h-8 rounded-md text-xs font-extrabold border cursor-pointer ${
                  form.overallRiskLevel === lvl
                    ? 'bg-[#F28C00] text-white border-[#F28C00]'
                    : 'bg-white text-[#151515] border-[#E6E6E6]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {form.cftSignatures.map((sig) => (
            <div key={sig.slot} className="p-3 border border-[#E6E6E6] rounded-lg flex items-center gap-2">
              <span className="text-xs font-bold text-[#666666]">{sig.slot})</span>
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
                className="flex-1 px-2.5 py-1.5 text-xs border border-[#E6E6E6] rounded-md"
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
                  className="p-1.5 text-[#E87500] hover:bg-[#FFF4E5] rounded cursor-pointer"
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
