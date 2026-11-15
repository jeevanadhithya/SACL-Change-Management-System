import React, { useState } from 'react';
import { ArrowUpRight, Filter, Plus } from 'lucide-react';
import type { ChangeRequestRecord, CompanyRecord } from '../types/pcms';
import { StatusText } from './ui/StatusBadge';
import { WORKFLOW_STAGE_ORDER } from '../utils/workflow';

interface PCRFListPageProps {
  pcrfs: ChangeRequestRecord[];
  companies?: CompanyRecord[];
  searchQuery: string;
  onOpenPCRF: (id: string) => void;
  onCreateNew: () => void;
}

export function PCRFListPage({
  pcrfs,
  companies = [],
  searchQuery,
  onOpenPCRF,
  onCreateNew,
}: PCRFListPageProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [facilityFilter, setFacilityFilter] = useState<string>('ALL');
  const [companyFilter, setCompanyFilter] = useState<string>('ALL');

  const filtered = pcrfs.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.pcrfNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.form1.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.form1.partNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.form1.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.companyName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.overallStatus === statusFilter;
    const matchesFacility =
      facilityFilter === 'ALL' || p.form1.facilityScope.includes(facilityFilter);
    const matchesCompany =
      companyFilter === 'ALL' || p.companyId === companyFilter;
    return matchesSearch && matchesStatus && matchesFacility && matchesCompany;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#151515]">All Process Change Requests</h2>
          <p className="text-sm text-[#666666]">
            Select any PCRF to fill or inspect all 7 interconnected Sakthi Auto consultancy forms.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#F28C00] hover:bg-[#E87500] text-white text-sm font-bold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Change Request</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F7F7F7] rounded-lg overflow-x-auto no-scrollbar max-w-full">
          {['ALL', 'In Review', 'In Implementation', 'Returned', 'Closed', 'Rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === st
                  ? 'bg-[#151515] text-white'
                  : 'text-[#666666] hover:text-[#151515]'
              }`}
            >
              {st === 'ALL' ? 'All Requests' : st}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-[#666666]" />
          {companies.length > 0 && (
            <select
              aria-label="Filter by company or plant unit"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-[#E6E6E6] rounded-lg bg-white focus:outline-none focus:border-[#F28C00]"
            >
              <option value="ALL">All Companies / Units</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.unitName || c.name}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Filter by facility"
            value={facilityFilter}
            onChange={(e) => setFacilityFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-[#E6E6E6] rounded-lg bg-white focus:outline-none focus:border-[#F28C00]"
          >
            <option value="ALL">All Facilities</option>
            <option value="Foundry">Foundry</option>
            <option value="Machine Shop">Machine Shop</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E6E6E6] rounded-xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F7F7] border-b border-[#E6E6E6] text-[11px] font-bold text-[#666666] uppercase tracking-wider">
                <th className="py-3 px-4">PCRF No.</th>
                <th className="py-3 px-4">Part &amp; Customer</th>
                <th className="py-3 px-4">Type / Facility</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E6E6] text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#666666]">
                    No Change Requests match your filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const stageObj = WORKFLOW_STAGE_ORDER.find((s) => s.key === p.currentStage);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => onOpenPCRF(p.id)}
                      className="hover:bg-[#FFF4E5]/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#151515] whitespace-nowrap">
                        {p.pcrfNo}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-[#151515]">{p.form1.partName}</p>
                        <p className="text-xs text-[#666666]">
                          <span className="font-mono">{p.form1.partNo}</span> · {p.form1.customer}
                          {p.companyName ? ` · ${p.companyName}` : ''}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#151515]">
                        <span>{p.form1.changeType}</span>
                        <span className="text-[#666666]"> · {p.form1.facilityScope}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#666666]">{p.form1.department}</td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-[#151515]">
                        {stageObj?.label || p.currentStage}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusText status={p.overallStatus} />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-[#666666] tabular-nums whitespace-nowrap">
                        {p.dueDate}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenPCRF(p.id);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E6E6E6] hover:border-[#F28C00] hover:text-[#E87500] text-xs font-semibold text-[#151515] cursor-pointer"
                        >
                          <span>Open</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
