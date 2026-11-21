import React, { useState } from 'react';
import { ArrowUpRight, Filter, Plus } from 'lucide-react';
import type { ChangeRequestRecord, CompanyRecord } from '../types/pcms';
import { StatusText } from './ui/StatusBadge';
import { WORKFLOW_STAGE_ORDER } from '../utils/workflow';

interface PCRFListPageProps {
  pcrfs: ChangeRequestRecord[];
  companies?: CompanyRecord[];
  searchQuery: string;
  canCreatePCRF?: boolean;
  onOpenPCRF: (id: string) => void;
  onCreateNew: () => void;
}

export function PCRFListPage({
  pcrfs,
  companies = [],
  searchQuery,
  canCreatePCRF = true,
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl leading-8 font-extrabold text-[#111318] tracking-tight">
            All Process Change Requests
          </h2>
          <p className="text-sm text-[#5C6470]">
            Select any PCRF to fill or inspect all 7 interconnected Sakthi Auto consultancy forms.
          </p>
        </div>
        {canCreatePCRF && (
          <button
            type="button"
            onClick={onCreateNew}
            className="btn-primary shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Change Request</span>
          </button>
        )}
      </div>

      {/* Filter Bar (8pt Grid: p-4, gap-4, h-10 controls) */}
      <div className="surface-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F4F5F7] rounded-lg overflow-x-auto no-scrollbar max-w-full">
          {['ALL', 'In Review', 'In Implementation', 'Returned', 'Closed', 'Rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`h-8 px-4 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === st
                  ? 'bg-[#121417] text-white'
                  : 'text-[#5C6470] hover:text-[#111318]'
              }`}
            >
              {st === 'ALL' ? 'All Requests' : st}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-[#5C6470] shrink-0" />
          {companies.length > 0 && (
            <select
              aria-label="Filter by company or plant unit"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="h-10 px-4 text-xs font-semibold text-[#111318] border border-[#D5DAE1] rounded-lg bg-white focus:outline-none focus:border-[#F28C00]"
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
            className="h-10 px-4 text-xs font-semibold text-[#111318] border border-[#D5DAE1] rounded-lg bg-white focus:outline-none focus:border-[#F28C00]"
          >
            <option value="ALL">All Facilities</option>
            <option value="Foundry">Foundry</option>
            <option value="Machine Shop">Machine Shop</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#5C6470] uppercase tracking-wider">
                <th className="h-10 px-6">PCRF No.</th>
                <th className="h-10 px-4">Part &amp; Customer</th>
                <th className="h-10 px-4">Type / Facility</th>
                <th className="h-10 px-4">Department</th>
                <th className="h-10 px-4">Current Stage</th>
                <th className="h-10 px-4">Status</th>
                <th className="h-10 px-4">Due Date</th>
                <th className="h-10 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-6 text-center text-xs text-[#5C6470]">
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
                      className="hover:bg-[#FFF6EB]/50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-mono text-xs font-bold text-[#111318] whitespace-nowrap">
                        {p.pcrfNo}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-[#111318]">{p.form1.partName}</p>
                        <p className="text-xs text-[#5C6470] mt-1">
                          <span className="font-mono">{p.form1.partNo}</span> · {p.form1.customer}
                          {p.companyName ? ` · ${p.companyName}` : ''}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-xs text-[#111318]">
                        <span>{p.form1.changeType}</span>
                        <span className="text-[#5C6470]"> · {p.form1.facilityScope}</span>
                      </td>
                      <td className="py-4 px-4 text-xs text-[#5C6470]">{p.form1.department}</td>
                      <td className="py-4 px-4 text-xs font-semibold text-[#111318]">
                        {stageObj?.label || p.currentStage}
                      </td>
                      <td className="py-4 px-4">
                        <StatusText status={p.overallStatus} />
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-[#5C6470] tabular-nums whitespace-nowrap">
                        {p.dueDate}
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
                          <span>Open</span>
                          <ArrowUpRight className="w-4 h-4" />
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
