import React, { useState } from 'react';
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
  UserCircle,
  Users,
  BarChart3,
  History,
  Landmark,
  X,
} from 'lucide-react';
import type { NotificationItem, UserAccount, UserRole } from '../types/pcms';
import { RoleDisplayLabel } from './ui/StatusBadge';

export type NavSectionKey =
  | 'dashboard'
  | 'pcrfs'
  | 'create-pcrf'
  | 'approvals'
  | 'forms-hub'
  | 'tasks'
  | 'notifications'
  | 'reports'
  | 'documents'
  | 'users'
  | 'companies'
  | 'departments'
  | 'customers-parts'
  | 'audit-logs'
  | 'settings'
  | 'profile';

interface NavItemConfig {
  key: NavSectionKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  group: 'Core' | 'Engineering & Forms' | 'Administration';
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'EMPLOYEE', 'COMPANY_USER', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
    group: 'Core',
  },
  {
    key: 'pcrfs',
    label: 'Change Requests',
    icon: FileText,
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'EMPLOYEE', 'COMPANY_USER', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
    group: 'Core',
  },
  {
    key: 'create-pcrf',
    label: 'Create PCRF',
    icon: PlusCircle,
    roles: ['ADMIN', 'EMPLOYEE', 'COMPANY_USER', 'HOD', 'HOF', 'COF', 'CFT_LEADER'],
    group: 'Core',
  },
  {
    key: 'approvals',
    label: 'Approval Center',
    icon: CheckCircle2,
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
    group: 'Core',
  },
  {
    key: 'tasks',
    label: 'My Tasks',
    icon: ListChecks,
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'EMPLOYEE', 'COMPANY_USER', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
    group: 'Core',
  },
  {
    key: 'forms-hub',
    label: 'Consultancy Forms',
    icon: ClipboardCheck,
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'EMPLOYEE', 'COMPANY_USER', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
    group: 'Engineering & Forms',
  },
  {
    key: 'documents',
    label: 'Document Center',
    icon: FolderOpen,
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'EMPLOYEE', 'COMPANY_USER', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
    group: 'Engineering & Forms',
  },
  {
    key: 'reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'CFT_LEADER', 'PLANT_HEAD'],
    group: 'Engineering & Forms',
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: Bell,
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'EMPLOYEE', 'COMPANY_USER', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
    group: 'Engineering & Forms',
  },
  {
    key: 'profile',
    label: 'My Profile',
    icon: UserCircle,
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'EMPLOYEE', 'COMPANY_USER', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
    group: 'Engineering & Forms',
  },
  {
    key: 'users',
    label: 'Users & Roles',
    icon: Users,
    roles: ['ADMIN'],
    group: 'Administration',
  },
  {
    key: 'companies',
    label: 'Companies',
    icon: Landmark,
    roles: ['ADMIN'],
    group: 'Administration',
  },
  {
    key: 'departments',
    label: 'Departments & CFT',
    icon: Building2,
    roles: ['ADMIN', 'COF', 'PLANT_HEAD'],
    group: 'Administration',
  },
  {
    key: 'customers-parts',
    label: 'Customers & Parts',
    icon: Package,
    roles: ['ADMIN', 'CFT_LEADER', 'COF'],
    group: 'Administration',
  },
  {
    key: 'audit-logs',
    label: 'Audit Logs',
    icon: History,
    roles: ['ADMIN', 'PLANT_HEAD'],
    group: 'Administration',
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: Settings,
    roles: ['ADMIN'],
    group: 'Administration',
  },
];

interface AppShellProps {
  user: UserAccount;
  activeNav: NavSectionKey;
  breadcrumbs: string[];
  pageTitle: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectNav: (key: NavSectionKey) => void;
  onOpenPCRF: (pcrfId: string) => void;
  notifications: NotificationItem[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllRead: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AppShell({
  user,
  activeNav,
  breadcrumbs,
  pageTitle,
  searchQuery,
  onSearchChange,
  onSelectNav,
  onOpenPCRF,
  notifications,
  onMarkNotificationRead,
  onMarkAllRead,
  onLogout,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user.role));
  const groups: Array<'Core' | 'Engineering & Forms' | 'Administration'> = [
    'Core',
    'Engineering & Forms',
    'Administration',
  ];

  const roleNotifs = notifications.filter(
    (n) => user.role === 'ADMIN' || n.targetRoles.includes(user.role),
  );
  const unreadCount = roleNotifs.filter((n) => !n.read).length;

  function renderSidebarContent(isMobile = false) {
    const isNarrow = collapsed && !isMobile;
    return (
      <div className="flex flex-col h-full bg-[#121417] text-white select-none border-r border-white/[0.06]">
        {/* Logo & Brand (80px = 10 × 8pt) */}
        <div className="h-20 px-4 flex items-center justify-between gap-2 border-b border-white/[0.08] shrink-0">
          <button
            type="button"
            onClick={() => {
              onSelectNav('dashboard');
              setMobileOpen(false);
            }}
            className="flex items-center gap-4 min-w-0 text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shrink-0 p-1 shadow-xs">
              <img
                src="/assets/aistudio/SakthiLogo_37b22494.png"
                alt="Sakthi Auto Trident"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            {!isNarrow && (
              <div className="min-w-0">
                <p className="text-[13px] leading-4 font-extrabold tracking-[0.06em] text-white whitespace-nowrap">
                  SAKTHI AUTO
                </p>
                <p className="text-[10px] leading-4 font-bold tracking-[0.08em] text-neutral-400 uppercase whitespace-nowrap">
                  COMPONENT LIMITED
                </p>
                <p className="text-[11px] leading-4 font-semibold text-[#F28C00] whitespace-nowrap">
                  Change Management System
                </p>
              </div>
            )}
          </button>
          {!isMobile && (
            <button
              type="button"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setCollapsed((c) => !c)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
          {isMobile && (
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/[0.08]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links (16px horizontal padding, 24px vertical rhythm) */}
        <nav
          aria-label="Primary Sidebar"
          className="flex-1 overflow-y-auto no-scrollbar px-4 py-6 space-y-6"
        >
          {groups.map((group) => {
            const groupItems = visibleItems.filter((item) => item.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group}>
                {!isNarrow && (
                  <p className="px-4 mb-2 text-[11px] leading-4 font-semibold tracking-[0.08em] text-neutral-500 uppercase">
                    {group}
                  </p>
                )}
                <div className="space-y-1">
                  {groupItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNav === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          onSelectNav(item.key);
                          setMobileOpen(false);
                        }}
                        title={isNarrow ? item.label : undefined}
                        className={`w-full h-10 flex items-center gap-3 px-4 rounded-lg text-[13px] leading-5 font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          isActive
                            ? 'bg-[#F28C00] text-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.2)]'
                            : 'text-neutral-300 hover:text-white hover:bg-[#1D2025]'
                        } ${isNarrow ? 'justify-center px-0' : ''}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!isNarrow && <span className="truncate">{item.label}</span>}
                        {!isNarrow && item.key === 'notifications' && unreadCount > 0 && (
                          <span className="ml-auto text-[11px] leading-4 font-mono font-bold text-[#F28C00] bg-black/40 px-2 py-0.5 rounded tabular-nums">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Bottom User Profile & Logout (16px padding) */}
        <div className="p-4 border-t border-white/[0.08] bg-[#16191D] shrink-0">
          <div className={`flex items-center gap-2 ${isNarrow ? 'justify-center' : ''}`}>
            <button
              type="button"
              aria-label="Open My Profile"
              title="Customize your profile"
              onClick={() => {
                onSelectNav('profile');
                setMobileOpen(false);
              }}
              className={`flex items-center gap-3 min-w-0 flex-1 text-left rounded-lg p-1 -m-1 transition-colors cursor-pointer ${
                activeNav === 'profile' ? 'bg-white/10' : 'hover:bg-white/[0.06]'
              } ${isNarrow ? 'justify-center flex-none' : ''}`}
            >
              <div className="w-10 h-10 rounded-lg bg-[#23272F] border border-white/10 flex items-center justify-center text-xs font-bold text-[#F28C00] shrink-0 font-mono">
                {user.avatarInitials ||
                  user.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
              </div>
              {!isNarrow && (
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] leading-5 font-semibold text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] leading-4 text-neutral-400 truncate">
                    {user.username || user.employeeId} · {RoleDisplayLabel(user.role)}
                  </p>
                  {user.companyCode && (
                    <p className="text-[10px] leading-4 font-mono font-bold text-[#F28C00] truncate">
                      {user.companyCode}
                    </p>
                  )}
                </div>
              )}
            </button>
            {!isNarrow && (
              <button
                type="button"
                aria-label="Logout"
                onClick={onLogout}
                title="Sign out"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
          {isNarrow && (
            <button
              type="button"
              aria-label="Logout"
              onClick={onLogout}
              title="Sign out"
              className="mt-2 w-full h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F4F5F7] text-[#111318]">
      {/* Desktop Sidebar (272px = 34×8 / 72px = 9×8) */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 no-print ${
          collapsed ? 'w-[72px]' : 'w-[272px]'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderSidebarContent(false)}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar (64px = 8 × 8pt) */}
        <header className="h-16 bg-white/95 backdrop-blur-xs border-b border-[#E4E7EC] px-6 lg:px-8 flex items-center justify-between gap-6 sticky top-0 z-30 no-print">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-10 h-10 rounded-lg border border-[#D5DAE1] text-[#111318] hover:bg-[#F4F5F7] flex items-center justify-center shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-4 text-[#5C6470] truncate">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={`${crumb}-${idx}`}>
                    {idx > 0 && <span aria-hidden="true" className="mx-2 text-[#98A2B3]">/</span>}
                    <span className={idx === breadcrumbs.length - 1 ? 'text-[#111318] font-semibold' : ''}>
                      {crumb}
                    </span>
                  </React.Fragment>
                ))}
              </p>
              <h1 className="text-base leading-6 font-bold text-[#111318] truncate">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Global Search (40px height = 5 × 8pt, 288px width = 36 × 8pt) */}
            <div className="relative hidden md:flex items-center w-72">
              <Search className="w-4 h-4 text-[#8A94A6] absolute left-4 pointer-events-none" />
              <input
                type="search"
                aria-label="Search PCRF, part number, or customer"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search PCRF, part, customer..."
                className="w-full h-10 pl-10 pr-4 text-sm bg-[#F4F5F7] border border-[#E4E7EC] rounded-lg text-[#111318] placeholder:text-[#8A94A6] focus:outline-none focus:bg-white focus:border-[#F28C00] focus:ring-2 focus:ring-[#F28C00]/15 transition-colors"
              />
            </div>

            {/* Notifications Dropdown (40px × 40px) */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative w-10 h-10 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F8F9FB] hover:border-[#D5DAE1] text-[#111318] flex items-center justify-center transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#F28C00] text-white text-[10px] font-bold flex items-center justify-center tabular-nums shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E4E7EC] rounded-xl shadow-[0_12px_32px_rgba(16,24,40,0.12)] z-40 overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
                    <span className="text-sm font-bold text-[#111318]">Notifications</span>
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="text-xs font-semibold text-[#D97700] hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto no-scrollbar divide-y divide-[#E4E7EC]">
                    {roleNotifs.length === 0 ? (
                      <div className="px-6 py-8 text-center text-xs text-[#5C6470]">
                        No notifications yet.
                      </div>
                    ) : (
                      roleNotifs.slice(0, 6).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            onMarkNotificationRead(n.id);
                            onOpenPCRF(n.pcrfId);
                            setNotifOpen(false);
                          }}
                          className={`w-full text-left px-6 py-4 hover:bg-[#F8F9FB] transition-colors cursor-pointer ${
                            n.read ? 'bg-white' : 'bg-[#FFF6EB]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs leading-4 font-bold text-[#111318] truncate">
                              {n.title}
                            </span>
                            {!n.read && (
                              <span className="text-[10px] font-bold text-[#D97700] shrink-0">
                                NEW
                              </span>
                            )}
                          </div>
                          <p className="text-xs leading-5 text-[#5C6470] mt-1 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[11px] font-mono text-[#8A94A6] mt-1">{n.pcrfNo}</p>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="px-6 py-3 bg-[#F8F9FB] border-t border-[#E4E7EC] text-center">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectNav('notifications');
                        setNotifOpen(false);
                      }}
                      className="text-xs font-semibold text-[#111318] hover:text-[#D97700] cursor-pointer"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Help Button (40px × 40px) */}
            <button
              type="button"
              aria-label="Workflow Help"
              onClick={() => setHelpOpen(true)}
              className="w-10 h-10 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F8F9FB] hover:border-[#D5DAE1] text-[#111318] flex items-center justify-center transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Role & Company Indicator -> Opens My Profile */}
            <button
              type="button"
              onClick={() => onSelectNav('profile')}
              title="Open My Profile"
              className="hidden sm:flex items-center gap-2 pl-4 h-10 border-l border-[#E4E7EC] hover:opacity-80 transition-opacity text-left cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#F28C00] shrink-0" />
              <div>
                <span className="block text-xs leading-4 font-bold text-[#111318] whitespace-nowrap">
                  {RoleDisplayLabel(user.role)}
                </span>
                {user.companyCode && (
                  <span className="block text-[10px] leading-4 font-mono font-semibold text-[#5C6470] whitespace-nowrap">
                    {user.companyCode}
                  </span>
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Main Workspace Canvas (24px mobile/tablet, 32px desktop = 4 × 8pt) */}
        <main className="flex-1 min-w-0 overflow-x-hidden p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Help Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-6 no-print">
          <div className="bg-white rounded-xl border border-[#E4E7EC] max-w-lg w-full p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E4E7EC]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#F28C00]" />
                <h3 className="text-base font-bold text-[#111318]">
                  Sakthi Auto 7-Form Interconnected Workflow
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close help modal"
                onClick={() => setHelpOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8A94A6] hover:text-[#111318] hover:bg-[#F4F5F7] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4 text-sm leading-6 text-[#344054]">
              <p>
                Every Change Request links all seven official Sakthi Auto consultancy forms using
                common part, customer, and revision metadata:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-xs leading-5">
                <li><strong>QF/07/MRO-15</strong> — Process Change Requisition Form (PCRF)</li>
                <li><strong>QF/07/MRO-02</strong> — Feasibility Report for Change Request</li>
                <li><strong>QF/07/MKT-14</strong> — Risk Analysis Check Sheet (Man/Method/Machine/Material/QCD)</li>
                <li><strong>QF/07/MKT-08</strong> — Timing Plan (APQP Phase I Schedule)</li>
                <li><strong>QF/07/MRO-03</strong> — Checklist for Managing &amp; Tracking Change (4 Pages)</li>
                <li><strong>QF/07/MRO-16</strong> — PTR Initiation Form (PTR 1: 5 Nos → PTR 2: 25 Nos → PTR 3: 50 Nos)</li>
                <li><strong>QF/07/MRO-05</strong> — PPAP Initiation Form cum Production Report</li>
              </ol>
              <p className="text-xs leading-5 text-[#5C6470]">
                Click <strong>Print Official Form</strong> inside any form tab to view and print the
                exact consultancy PDF format populated with your entered data.
              </p>
            </div>
            <div className="pt-4 border-t border-[#E4E7EC] flex justify-end">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="btn-dark"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
