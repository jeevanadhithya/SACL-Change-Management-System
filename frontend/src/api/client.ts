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

let unauthorizedHandler: (() => void) | null = null;

const FORM_ROUTE_MAP: Record<FormIdentifier, string> = {
  form1: 'process-change-requisition-form',
  form2: 'feasibility-report-for-change-request',
  form3: 'risk-analysis-check-sheet',
  form4: 'timing-plan',
  form5: 'checklist-for-managing-and-tracking-change',
  form6: 'ptr-initiation-form',
  form7: 'ppap-initiation-form-cum-production-report',
};

export function setUnauthorizedHandler(fn: (() => void) | null) {
  unauthorizedHandler = fn;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export interface CreateCompanyAccountPayload {
  username: string;
  name: string;
  email?: string;
  password: string;
  role: UserRole;
  department?: string;
  title?: string;
}

export interface CreateCompanyPayload extends Partial<CompanyRecord> {
  initialAccount?: CreateCompanyAccountPayload;
}

export interface PortalAccountOption {
  id: string;
  employeeId: string;
  username: string;
  name: string;
  role: UserRole;
  companyCode?: string | null;
}

async function apiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    if (res.status === 401 && path !== '/api/auth/login') {
      clearAuthSession();
      if (unauthorizedHandler) {
        unauthorizedHandler();
      }
    }
    throw new Error(payload.error || `Request failed (${res.status})`);
  }
  return payload as T;
}

export const api = {
  getPortalAccounts() {
    return apiJson<{ accounts: PortalAccountOption[] }>('/api/auth/portal-accounts');
  },
  async login(employeeId: string, password: string) {
    const res = await apiJson<{ user: UserAccount; token?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ employeeId, username: employeeId, password }),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },
  me() {
    return apiJson<{ user: UserAccount }>('/api/auth/me');
  },
  async updateMyProfile(payload: {
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
    title?: string;
    facility?: UserAccount['facility'];
    plantLocation?: string;
    bio?: string;
    avatarInitials?: string;
    emailNotifications?: boolean;
    inAppNotifications?: boolean;
  }) {
    const res = await apiJson<{ user: UserAccount; token?: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (res.token) {
      setAuthToken(res.token);
    }
    return res;
  },
  changeMyPassword(currentPassword: string, newPassword: string) {
    return apiJson<{ ok: boolean; user: UserAccount }>('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  getUsers() {
    return apiJson<{ users: UserAccount[] }>('/api/users');
  },
  createUser(payload: Partial<UserAccount> & { password?: string }) {
    return apiJson<{ user: UserAccount }>('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateUser(id: string, payload: Partial<UserAccount>) {
    return apiJson<{ user: UserAccount }>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  changeUserPassword(id: string, password: string) {
    return apiJson<{ ok: boolean; user: UserAccount }>(`/api/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  },
  deleteUser(id: string) {
    return apiJson<{ ok: boolean; deletedId: string }>(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },
  getCompanies() {
    return apiJson<{ companies: CompanyRecord[] }>('/api/companies');
  },
  createCompany(payload: CreateCompanyPayload) {
    return apiJson<{ company: CompanyRecord; account?: UserAccount | null }>('/api/companies', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  createCompanyAccount(companyId: string, payload: CreateCompanyAccountPayload) {
    return apiJson<{ user: UserAccount }>(`/api/companies/${companyId}/accounts`, {
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
  createDepartment(payload: Partial<DepartmentRecord>) {
    return apiJson<{ department: DepartmentRecord }>('/api/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  createCustomer(payload: Partial<CustomerRecord>) {
    return apiJson<{ customer: CustomerRecord }>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  createPart(payload: Partial<PartMasterRecord>) {
    return apiJson<{ part: PartMasterRecord }>('/api/parts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updatePart(id: string, payload: Partial<PartMasterRecord>) {
    return apiJson<{ part: PartMasterRecord }>(`/api/parts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deletePart(id: string) {
    return apiJson<{ ok: boolean; deletedId: string }>(`/api/parts/${id}`, {
      method: 'DELETE',
    });
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
