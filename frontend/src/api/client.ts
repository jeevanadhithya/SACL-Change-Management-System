import { buildApiUrl } from '../config/apiConfig';
import type {
  AuditLogItem,
  ChangeRequestRecord,
  CompanyRecord,
  CustomerRecord,
  DepartmentRecord,
  FormIdentifier,
  NotificationItem,
  PartMasterRecord,
  UserAccount,
  UserRole,
} from '../types/pcms';

const TOKEN_STORAGE_KEY = 'sacl_pcms_token';
const USER_STORAGE_KEY = 'sacl_pcms_user';

const FORM_ROUTE_MAP: Record<FormIdentifier, string> = {
  form1: 'process-change-requisition-form',
  form2: 'feasibility-report-for-change-request',
  form3: 'risk-analysis-check-sheet',
  form4: 'timing-plan',
  form5: 'checklist-for-managing-and-tracking-change',
  form6: 'ptr-initiation-form',
  form7: 'ppap-initiation-form-cum-production-report',
};

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  let actorRoleHeader: Record<string, string> = {};
  try {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (savedUser) {
      const parsed = JSON.parse(savedUser) as { role?: string };
      if (parsed.role) {
        actorRoleHeader = { 'x-user-role': parsed.role };
      }
    }
  } catch {
    // ignore malformed storage
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...actorRoleHeader,
  };

  const res = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> | undefined),
    },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || `Request failed (${res.status})`);
  }
  return payload as T;
}

export const api = {
  async login(employeeId: string, password: string) {
    const res = await apiJson<{ user: UserAccount; token?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ employeeId, password }),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },
  getUsers() {
    return apiJson<{ users: UserAccount[] }>('/api/users');
  },
  createUser(payload: Partial<UserAccount>) {
    return apiJson<{ user: UserAccount }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  getCompanies() {
    return apiJson<{ companies: CompanyRecord[] }>('/api/companies');
  },
  createCompany(payload: Partial<CompanyRecord>) {
    return apiJson<{ company: CompanyRecord }>('/api/companies', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateCompany(id: string, payload: Partial<CompanyRecord>) {
    return apiJson<{ company: CompanyRecord }>(`/api/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  getMasterData() {
    return apiJson<{
      companies: CompanyRecord[];
      departments: DepartmentRecord[];
      customers: CustomerRecord[];
      parts: PartMasterRecord[];
    }>('/api/master-data');
  },
  getPCRFs() {
    return apiJson<{ pcrfs: ChangeRequestRecord[] }>('/api/pcrfs');
  },
  getPCRF(id: string) {
    return apiJson<{ pcrf: ChangeRequestRecord }>(`/api/pcrfs/${id}`);
  },
  createPCRF(payload: Record<string, unknown>) {
    return apiJson<{ pcrf: ChangeRequestRecord }>('/api/pcrfs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  saveForm<K extends FormIdentifier>(
    pcrfId: string,
    formKey: K,
    data: ChangeRequestRecord[K],
    actorName: string,
    actorRole: UserRole,
  ) {
    const controllerSegment = FORM_ROUTE_MAP[formKey];
    return apiJson<{ pcrf: ChangeRequestRecord }>(`/api/pcrfs/${pcrfId}/${controllerSegment}`, {
      method: 'PUT',
      body: JSON.stringify({ data, actorName, actorRole }),
    });
  },
  submitDecision(
    pcrfId: string,
    decision: 'APPROVE' | 'REJECT' | 'RETURN',
    actorName: string,
    actorRole: UserRole,
    comments: string,
  ) {
    return apiJson<{ pcrf: ChangeRequestRecord }>(`/api/pcrfs/${pcrfId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, actorName, actorRole, comments }),
    });
  },
  getNotifications() {
    return apiJson<{ notifications: NotificationItem[] }>('/api/notifications');
  },
  markNotificationRead(id: string) {
    return apiJson<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: 'POST' });
  },
  markAllNotificationsRead() {
    return apiJson<{ ok: boolean }>('/api/notifications/read-all', { method: 'POST' });
  },
  getAuditLogs() {
    return apiJson<{ auditLogs: AuditLogItem[] }>('/api/audit-logs');
  },
};
