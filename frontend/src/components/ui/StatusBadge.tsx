import React from 'react';
import type { StageStatus } from '../../types/pcms';

export function getStatusColor(status: string): string {
  switch (status) {
    case 'COMPLETED':
    case 'Approved':
    case 'Closed':
    case 'FEASIBLE':
    case 'Feasible':
    case 'OK':
    case 'Acceptable':
    case 'Yes':
      return 'text-emerald-700';
    case 'IN_PROGRESS':
    case 'In Review':
    case 'In Implementation':
    case 'Critical':
    case 'HIGH':
    case 'H':
      return 'text-[#D97700]';
    case 'REJECTED':
    case 'Rejected':
    case 'NOT FEASIBLE':
    case 'Not Feasible':
    case 'Not OK':
    case 'Not Acceptable':
      return 'text-red-600';
    case 'RETURNED':
    case 'Returned':
    case 'High':
    case 'MEDIUM':
    case 'M':
      return 'text-amber-700';
    default:
      return 'text-[#5C6470]';
  }
}

export function StatusText({ status }: { status: StageStatus | string }) {
  const label =
    status === 'IN_PROGRESS'
      ? 'In Progress'
      : status === 'COMPLETED'
      ? 'Completed'
      : status === 'PENDING'
      ? 'Pending'
      : status === 'REJECTED'
      ? 'Rejected'
      : status === 'RETURNED'
      ? 'Returned'
      : status;

  return (
    <span className={`font-semibold text-xs whitespace-nowrap ${getStatusColor(status)}`}>
      {label}
    </span>
  );
}

export function RoleDisplayLabel(role: string): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrator';
    case 'HOF':
      return 'Head of Foundry (HOF)';
    case 'COF':
      return 'Chief of Facility (COF)';
    case 'HOD':
      return 'Head of Department (HOD)';
    case 'EMPLOYEE':
      return 'Employee / Engineer';
    case 'COMPANY_USER':
      return 'Company Representative';
    case 'CFT':
      return 'CFT Member';
    case 'CFT_LEADER':
      return 'CFT Leader';
    case 'PLANT_HEAD':
      return 'Plant Head';
    default:
      return role;
  }
}
