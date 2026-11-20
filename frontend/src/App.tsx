import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  api,
  clearAuthSession,
  getAuthToken,
  setUnauthorizedHandler,
  type CreateCompanyAccountPayload,
  type CreateCompanyPayload,
} from './api/client';
import { AppShell, type NavSectionKey } from './components/AppShell';
import { ApprovalCenter } from './components/ApprovalCenter';
import { ChangeRequestDetails, type DetailsTabKey } from './components/ChangeRequestDetails';
import { CreatePCRFPage } from './components/CreatePCRFPage';
import { LoginPage } from './components/LoginPage';
import { PCRFListPage } from './components/PCRFListPage';
import { OfficialFormPrintModal } from './components/print/OfficialFormPrintModal';
import { RoleDashboard } from './components/RoleDashboard';
import {
  AuditLogsPage,
  CompaniesPage,
  ConsultancyFormsHub,
  CustomersPartsPage,
  DepartmentsPage,
  DocumentCenterPage,
  MyTasksPage,
  NotificationsPage,
  ReportsAnalyticsPage,
  SettingsPage,
  UsersRolesPage,
} from './components/SecondaryPages';
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
} from './types/pcms';

const STORAGE_KEY = 'sacl_pcms_user';

const PCRF_CREATOR_ROLES: UserRole[] = ['ADMIN', 'EMPLOYEE', 'HOD', 'HOF', 'COF', 'CFT_LEADER'];

export default function App() {
  const [user, setUser] = useState<UserAccount | null>(() => {
    try {
      const token = getAuthToken();
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!token || !saved) return null;
      return JSON.parse(saved) as UserAccount;
    } catch {
      return null;
    }
  });

  const [activeNav, setActiveNav] = useState<NavSectionKey>('dashboard');
  const [selectedPcrfId, setSelectedPcrfId] = useState<string | null>(null);
  const [detailsInitialTab, setDetailsInitialTab] = useState<DetailsTabKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [printPreview, setPrintPreview] = useState<{
    pcrfId: string;
    formKey: FormIdentifier;
  } | null>(null);

  const [pcrfs, setPcrfs] = useState<ChangeRequestRecord[]>([]);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [parts, setParts] = useState<PartMasterRecord[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const autostartAttemptedRef = useRef(false);
  const sessionValidatedRef = useRef(false);

  const handleLogout = useCallback(() => {
    clearAuthSession();
    setUser(null);
    setSelectedPcrfId(null);
    setActiveNav('dashboard');
    setUsers([]);
    setAuditLogs([]);
    setPcrfs([]);
    setErrorBanner(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(handleLogout);
    return () => setUnauthorizedHandler(null);
  }, [handleLogout]);

  // Verify existing JWT with /api/auth/me on mount, or handle ?autostart=1
  useEffect(() => {
    if (sessionValidatedRef.current) return;
    sessionValidatedRef.current = true;

    const token = getAuthToken();
    if (token) {
      api
        .me()
        .then(({ user: freshUser }) => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser));
          setUser(freshUser);
        })
        .catch(() => {
          handleLogout();
        });
      return;
    }

    if (autostartAttemptedRef.current) return;
    autostartAttemptedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' && !user) {
      api
        .login('ADM001', 'password123')
        .then(({ user: logged }) => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(logged));
          setUser(logged);
        })
        .catch(() => {});
    }
  }, [user, handleLogout]);

  const loadWorkspaceData = useCallback(async () => {
    if (!user || !getAuthToken()) return;
    setLoadingData(true);
    setErrorBanner(null);
    try {
      const canLoadUsers = user.role === 'ADMIN';
      const canLoadAudits = user.role === 'ADMIN' || user.role === 'PLANT_HEAD';

      const [pcrfRes, notifRes, masterRes, usersRes, auditRes] = await Promise.all([
        api.getPCRFs(),
        api.getNotifications(),
        api.getMasterData(),
        canLoadUsers ? api.getUsers() : Promise.resolve({ users: [] as UserAccount[] }),
        canLoadAudits ? api.getAuditLogs() : Promise.resolve({ auditLogs: [] as AuditLogItem[] }),
      ]);
      setPcrfs(pcrfRes.pcrfs);
      setNotifications(notifRes.notifications);
      setCompanies(masterRes.companies || []);
      setDepartments(masterRes.departments);
      setCustomers(masterRes.customers);
      setParts(masterRes.parts);
      setUsers(usersRes.users);
      setAuditLogs(auditRes.auditLogs);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Failed to load workspace data');
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    void loadWorkspaceData();
  }, [loadWorkspaceData]);

  function handleLoginSuccess(loggedUser: UserAccount) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedUser));
    setUser(loggedUser);
    setActiveNav('dashboard');
    setSelectedPcrfId(null);
  }

  function handleSelectNav(nav: NavSectionKey) {
    setSelectedPcrfId(null);
    setActiveNav(nav);
  }

  function handleOpenCreatePCRF() {
    setSelectedPcrfId(null);
    setActiveNav('create-pcrf');
  }

  function handleOpenPCRF(pcrfId: string, tab: DetailsTabKey = 'overview') {
    setSelectedPcrfId(pcrfId);
    setDetailsInitialTab(tab);
  }

  async function handleCreatePCRF(payload: Record<string, unknown>) {
    const { pcrf } = await api.createPCRF(payload);
    setPcrfs((prev) => [pcrf, ...prev]);
    await loadWorkspaceData();
    setActiveNav('pcrfs');
    handleOpenPCRF(pcrf.id, 'form1');
  }

  async function handleSaveForm<K extends FormIdentifier>(
    pcrfId: string,
    formKey: K,
    data: ChangeRequestRecord[K],
  ) {
    if (!user) return;
    try {
      const { pcrf } = await api.saveForm(pcrfId, formKey, data, user.name, user.role);
      setPcrfs((prev) => prev.map((item) => (item.id === pcrf.id ? pcrf : item)));
      setErrorBanner(null);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : 'Unable to save form');
      throw err;
    }
  }

  async function handleDecision(
    pcrfId: string,
    decision: 'APPROVE' | 'REJECT' | 'RETURN',
    comments: string,
  ) {
    if (!user) return;
    const { pcrf } = await api.submitDecision(pcrfId, decision, user.name, user.role, comments);
    setPcrfs((prev) => prev.map((item) => (item.id === pcrf.id ? pcrf : item)));
    await loadWorkspaceData();
  }

  async function handleMarkNotificationRead(id: string) {
    await api.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  async function handleMarkAllRead() {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function handleCreateUser(payload: Partial<UserAccount> & { password?: string }) {
    const { user: created } = await api.createUser(payload);
    setUsers((prev) => [...prev, created]);
  }

  async function handleCreateCompany(payload: CreateCompanyPayload) {
    const { company, account } = await api.createCompany(payload);
    setCompanies((prev) => [company, ...prev]);
    if (account) {
      setUsers((prev) => [...prev, account]);
    }
  }

  async function handleCreateCompanyAccount(
    companyId: string,
    payload: CreateCompanyAccountPayload,
  ) {
    const { user: created } = await api.createCompanyAccount(companyId, payload);
    setUsers((prev) => [...prev, created]);
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const selectedPcrf = selectedPcrfId
    ? pcrfs.find((p) => p.id === selectedPcrfId) || null
    : null;

  const printRecord = printPreview
    ? pcrfs.find((p) => p.id === printPreview.pcrfId) || null
    : null;

  const canCreatePCRF = PCRF_CREATOR_ROLES.includes(user.role);

  const navMeta: Record<NavSectionKey, { title: string; crumbs: string[] }> = {
    dashboard: { title: 'Dashboard', crumbs: ['Sakthi Auto Component Limited', 'Dashboard'] },
    pcrfs: { title: 'Change Requests', crumbs: ['Sakthi Auto Component Limited', 'Change Requests'] },
    'create-pcrf': { title: 'Create PCRF', crumbs: ['Sakthi Auto Component Limited', 'Create PCRF'] },
    approvals: { title: 'Approval Center', crumbs: ['Sakthi Auto Component Limited', 'Approval Center'] },
    'forms-hub': { title: 'Consultancy Forms', crumbs: ['Engineering', '7 Official Forms'] },
    tasks: { title: 'My Tasks', crumbs: ['Sakthi Auto Component Limited', 'My Tasks'] },
    notifications: { title: 'Notifications', crumbs: ['Sakthi Auto Component Limited', 'Notifications'] },
    reports: { title: 'Reports & Analytics', crumbs: ['Engineering', 'Reports'] },
    documents: { title: 'Document Center', crumbs: ['Engineering', 'Documents'] },
    users: { title: 'Users & Roles', crumbs: ['Administration', 'Users & Roles'] },
    companies: { title: 'Companies', crumbs: ['Administration', 'Companies'] },
    departments: { title: 'Departments & CFT', crumbs: ['Administration', 'Departments'] },
    'customers-parts': { title: 'Customers & Parts', crumbs: ['Administration', 'Masters'] },
    'audit-logs': { title: 'Audit Logs', crumbs: ['Administration', 'Audit Logs'] },
    settings: { title: 'Settings', crumbs: ['Administration', 'Settings'] },
  };

  const currentMeta = selectedPcrf
    ? {
        title: `${selectedPcrf.pcrfNo} — ${selectedPcrf.form1.partName}`,
        crumbs: ['Change Requests', selectedPcrf.pcrfNo],
      }
    : navMeta[activeNav];

  return (
    <>
      <div className={printRecord && printPreview ? 'no-print' : undefined}>
        <AppShell
          user={user}
          activeNav={activeNav}
          breadcrumbs={currentMeta.crumbs}
          pageTitle={currentMeta.title}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q.trim() && activeNav !== 'pcrfs' && !selectedPcrf) {
              setActiveNav('pcrfs');
            }
          }}
          onSelectNav={handleSelectNav}
          onOpenPCRF={(id) => handleOpenPCRF(id, 'overview')}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllRead={handleMarkAllRead}
          onLogout={handleLogout}
        >
          {errorBanner && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between">
              <span>{errorBanner}</span>
              <button
                type="button"
                onClick={() => setErrorBanner(null)}
                className="underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {loadingData && pcrfs.length === 0 ? (
            <div className="bg-white border border-[#E6E6E6] rounded-xl p-8 space-y-4">
              <div className="h-6 w-48 bg-[#F7F7F7] rounded animate-pulse" />
              <div className="h-24 w-full bg-[#F7F7F7] rounded animate-pulse" />
            </div>
          ) : selectedPcrf ? (
            <ChangeRequestDetails
              key={`${selectedPcrf.id}-${detailsInitialTab}`}
              record={selectedPcrf}
              user={user}
              initialTab={detailsInitialTab}
              onBack={() => setSelectedPcrfId(null)}
              onSaveForm={handleSaveForm}
              onDecision={handleDecision}
              onOpenPrintModal={(formKey) =>
                setPrintPreview({ pcrfId: selectedPcrf.id, formKey })
              }
            />
          ) : (
            <>
              {activeNav === 'dashboard' && (
                <RoleDashboard
                  user={user}
                  pcrfs={pcrfs}
                  companies={companies}
                  canCreatePCRF={canCreatePCRF}
                  onCreateCompany={user.role === 'ADMIN' ? handleCreateCompany : undefined}
                  onOpenPCRF={(id) => handleOpenPCRF(id, 'overview')}
                  onCreateNew={handleOpenCreatePCRF}
                  onNavigate={handleSelectNav}
                />
              )}

              {activeNav === 'pcrfs' && (
                <PCRFListPage
                  pcrfs={pcrfs}
                  companies={companies}
                  searchQuery={searchQuery}
                  canCreatePCRF={canCreatePCRF}
                  onOpenPCRF={(id) => handleOpenPCRF(id, 'overview')}
                  onCreateNew={handleOpenCreatePCRF}
                />
              )}

              {activeNav === 'create-pcrf' &&
                (canCreatePCRF ? (
                  <CreatePCRFPage
                    user={user}
                    companies={companies}
                    departments={departments}
                    customers={customers}
                    parts={parts}
                    onCancel={() => setActiveNav('pcrfs')}
                    onCreate={handleCreatePCRF}
                  />
                ) : (
                  <div className="bg-white border border-[#E6E6E6] rounded-xl p-8 text-center space-y-2">
                    <h2 className="text-lg font-bold text-[#151515]">Role Permission Required</h2>
                    <p className="text-sm text-[#666666]">
                      Your current role ({user.role}) does not have permission to initiate new PCRFs.
                    </p>
                  </div>
                ))}

              {activeNav === 'approvals' && (
                <ApprovalCenter
                  user={user}
                  pcrfs={pcrfs}
                  onOpenPCRF={(id) => handleOpenPCRF(id, 'approval')}
                  onDecision={handleDecision}
                />
              )}

              {activeNav === 'forms-hub' && (
                <ConsultancyFormsHub
                  pcrfs={pcrfs}
                  onOpenPCRFTab={(pcrfId, tab) => handleOpenPCRF(pcrfId, tab)}
                  onPrintForm={(pcrfId, formKey) => setPrintPreview({ pcrfId, formKey })}
                />
              )}

              {activeNav === 'tasks' && (
                <MyTasksPage
                  pcrfs={pcrfs}
                  user={user}
                  onOpenPCRF={(id) => handleOpenPCRF(id, 'overview')}
                />
              )}

              {activeNav === 'notifications' && (
                <NotificationsPage
                  notifications={notifications}
                  onMarkRead={handleMarkNotificationRead}
                  onMarkAllRead={handleMarkAllRead}
                  onOpenPCRF={(id) => handleOpenPCRF(id, 'overview')}
                />
              )}

              {activeNav === 'documents' && (
                <DocumentCenterPage
                  pcrfs={pcrfs}
                  onPrintForm={(pcrfId, formKey) => setPrintPreview({ pcrfId, formKey })}
                />
              )}

              {activeNav === 'reports' && <ReportsAnalyticsPage pcrfs={pcrfs} />}

              {activeNav === 'users' && user.role === 'ADMIN' && (
                <UsersRolesPage
                  users={users}
                  companies={companies}
                  onCreateUser={handleCreateUser}
                />
              )}

              {activeNav === 'companies' && (
                <CompaniesPage
                  companies={companies}
                  users={users}
                  currentUser={user}
                  onCreateCompany={handleCreateCompany}
                  onCreateCompanyAccount={handleCreateCompanyAccount}
                />
              )}

              {activeNav === 'departments' && <DepartmentsPage departments={departments} />}

              {activeNav === 'customers-parts' && (
                <CustomersPartsPage customers={customers} parts={parts} />
              )}

              {activeNav === 'audit-logs' &&
                (user.role === 'ADMIN' || user.role === 'PLANT_HEAD') && (
                  <AuditLogsPage auditLogs={auditLogs} />
                )}

              {activeNav === 'settings' && user.role === 'ADMIN' && <SettingsPage />}
            </>
          )}
        </AppShell>
      </div>

      {printRecord && printPreview && (
        <OfficialFormPrintModal
          record={printRecord}
          initialForm={printPreview.formKey}
          onClose={() => setPrintPreview(null)}
        />
      )}
    </>
  );
}
