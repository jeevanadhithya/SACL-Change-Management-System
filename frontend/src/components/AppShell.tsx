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
  | 'settings';

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
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'EMPLOYEE', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
    group: 'Core',
  },
  {
    key: 'pcrfs',
    label: 'Change Requests',
    icon: FileText,
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'EMPLOYEE', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
    group: 'Core',
  },
  {
    key: 'create-pcrf',
    label: 'Create PCRF',
    icon: PlusCircle,
    roles: ['ADMIN', 'EMPLOYEE', 'HOD', 'HOF', 'COF', 'CFT_LEADER'],
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
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'EMPLOYEE', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
    group: 'Core',
  },
  {
    key: 'forms-hub',
    label: 'Consultancy Forms',
    icon: ClipboardCheck,
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'EMPLOYEE', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
    group: 'Engineering & Forms',
  },
  {
    key: 'documents',
    label: 'Document Center',
    icon: FolderOpen,
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'EMPLOYEE', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
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
    roles: ['ADMIN', 'HOF', 'COF', 'HOD', 'EMPLOYEE', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'],
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
      <div className="flex flex-col h-full bg-[#151515] text-white select-none">
        {/* Logo & Brand */}
        <div className="min-h-[76px] px-4 py-3 flex items-center justify-between gap-2 border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => {
              onSelectNav('dashboard');
              setMobileOpen(false);
            }}
            className="flex items-center gap-3 min-w-0 text-left cursor-pointer"
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
              <div className="min-w-0 leading-tight">
                <p className="text-[13px] font-extrabold tracking-wide text-white whitespace-nowrap">
                  SAKTHI AUTO
                </p>
                <p className="text-[10px] font-bold tracking-[0.06em] text-neutral-300 uppercase whitespace-nowrap">
                  COMPONENT LIMITED
                </p>
                <p className="text-[10.5px] font-semibold text-[#F28C00] mt-0.5 whitespace-nowrap">
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
              className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
              className="p-1.5 rounded-md text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav
          aria-label="Primary Sidebar"
          className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-3.5"
        >
          {groups.map((group) => {
            const groupItems = visibleItems.filter((item) => item.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group}>
                {!isNarrow && (
                  <p className="px-3 mb-1.5 text-[11px] font-semibold tracking-wider text-neutral-500 uppercase">
                    {group}
                  </p>
                )}
                <div className="space-y-0.5">
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
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          isActive
                            ? 'bg-[#F28C00] text-white font-semibold'
                            : 'text-neutral-300 hover:text-white hover:bg-[#242424]'
                        } ${isNarrow ? 'justify-center px-2' : ''}`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {!isNarrow && <span className="truncate">{item.label}</span>}
                        {!isNarrow && item.key === 'notifications' && unreadCount > 0 && (
                          <span className="ml-auto text-[11px] font-mono font-bold text-[#F28C00] bg-black/40 px-1.5 py-0.5 rounded">
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

        {/* Bottom User Profile & Logout */}
        <div className="p-3 border-t border-white/10 bg-[#1B1B1B] shrink-0">
          <div className={`flex items-center gap-3 ${isNarrow ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-lg bg-[#242424] border border-white/15 flex items-center justify-center text-xs font-bold text-[#F28C00] shrink-0">
              {user.name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            {!isNarrow && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10.5px] text-neutral-400 leading-tight">
                  {user.employeeId} · {RoleDisplayLabel(user.role)}
                </p>
              </div>
            )}
            {!isNarrow && (
              <button
                type="button"
                aria-label="Logout"
                onClick={onLogout}
                title="Sign out"
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
              className="mt-2 w-full flex justify-center p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F7F7F7] text-[#151515]">
      {/* Desktop Sidebar */}
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
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#E6E6E6] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-[#E6E6E6] text-[#151515] hover:bg-[#F7F7F7]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-[#666666] truncate">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={`${crumb}-${idx}`}>
                    {idx > 0 && <span aria-hidden="true">/</span>}
                    <span className={idx === breadcrumbs.length - 1 ? 'text-[#151515] font-medium' : ''}>
                      {crumb}
                    </span>
                  </React.Fragment>
                ))}
              </div>
              <h1 className="text-base sm:text-lg font-bold text-[#151515] truncate leading-tight">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Global Search */}
            <div className="relative hidden md:flex items-center w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
              <input
                type="search"
                aria-label="Search PCRF, part number, or customer"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search PCRF, part, customer..."
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-[#F7F7F7] border border-[#E6E6E6] rounded-lg focus:outline-none focus:bg-white focus:border-[#F28C00]"
              />
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 rounded-lg border border-[#E6E6E6] bg-white hover:bg-[#F7F7F7] text-[#151515] transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F28C00] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E6E6E6] rounded-xl shadow-lg z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E6E6E6] flex items-center justify-between">
                    <span className="text-sm font-bold text-[#151515]">Notifications</span>
                    <button
                      type="button"
                      onClick={onMarkAllRead}
                      className="text-xs font-semibold text-[#E87500] hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto no-scrollbar divide-y divide-[#E6E6E6]">
                    {roleNotifs.slice(0, 6).map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          onMarkNotificationRead(n.id);
                          onOpenPCRF(n.pcrfId);
                          setNotifOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-[#F7F7F7] transition-colors cursor-pointer ${
                          n.read ? 'bg-white' : 'bg-[#FFF4E5]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#151515] truncate">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="text-[10px] font-bold text-[#E87500] shrink-0">
                              NEW
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#666666] mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] font-mono text-neutral-400 mt-1">{n.pcrfNo}</p>
                      </button>
                    ))}
                  </div>
                  <div className="px-4 py-2.5 bg-[#F7F7F7] border-t border-[#E6E6E6] text-center">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectNav('notifications');
                        setNotifOpen(false);
                      }}
                      className="text-xs font-semibold text-[#151515] hover:text-[#E87500] cursor-pointer"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Help Button */}
            <button
              type="button"
              aria-label="Workflow Help"
              onClick={() => setHelpOpen(true)}
              className="p-2 rounded-lg border border-[#E6E6E6] bg-white hover:bg-[#F7F7F7] text-[#151515] transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Role Indicator */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#E6E6E6]">
              <ShieldCheck className="w-4 h-4 text-[#F28C00]" />
              <span className="text-xs font-bold text-[#151515] whitespace-nowrap">
                {RoleDisplayLabel(user.role)}
              </span>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Help Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl border border-[#E6E6E6] max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6E6E6]">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#F28C00]" />
                <h3 className="text-base font-bold text-[#151515]">
                  Sakthi Auto 7-Form Interconnected Workflow
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close help modal"
                onClick={() => setHelpOpen(false)}
                className="p-1 text-neutral-400 hover:text-[#151515]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3 text-sm text-[#444444]">
              <p>
                Every Change Request links all seven official Sakthi Auto consultancy forms using
                common part, customer, and revision metadata:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-xs">
                <li><strong>QF/07/MRO-15</strong> — Process Change Requisition Form (PCRF)</li>
                <li><strong>QF/07/MRO-02</strong> — Feasibility Report for Change Request</li>
                <li><strong>QF/07/MKT-14</strong> — Risk Analysis Check Sheet (Man/Method/Machine/Material/QCD)</li>
                <li><strong>QF/07/MKT-08</strong> — Timing Plan (APQP Phase I Schedule)</li>
                <li><strong>QF/07/MRO-03</strong> — Checklist for Managing & Tracking Change (4 Pages)</li>
                <li><strong>QF/07/MRO-16</strong> — PTR Initiation Form (PTR 1: 5 Nos → PTR 2: 25 Nos → PTR 3: 50 Nos)</li>
                <li><strong>QF/07/MRO-05</strong> — PPAP Initiation Form cum Production Report</li>
              </ol>
              <p className="text-xs text-[#666666]">
                Click <strong>Print Official Form</strong> inside any form tab to view and print the
                exact consultancy PDF format populated with your entered data.
              </p>
            </div>
            <div className="pt-3 border-t border-[#E6E6E6] flex justify-end">
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#151515] text-white text-xs font-semibold hover:bg-[#242424] cursor-pointer"
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
