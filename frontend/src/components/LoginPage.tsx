import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  User,
} from 'lucide-react';
import { api, type PortalAccountOption } from '../api/client';
import type { UserAccount, UserRole } from '../types/pcms';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
}

const SHORT_ROLE_LABELS: Record<UserRole, string> = {
  EMPLOYEE: 'Employee',
  HOD: 'HOD',
  HOF: 'HOF',
  COF: 'COF',
  CFT: 'CFT Member',
  CFT_LEADER: 'CFT Leader',
  PLANT_HEAD: 'Plant Head',
  ADMIN: 'Admin',
  COMPANY_USER: 'Company Rep',
};

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live database-backed Role-Based Portal Access list
  const [rolePanelOpen, setRolePanelOpen] = useState(true);
  const [portalAccounts, setPortalAccounts] = useState<PortalAccountOption[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);

  async function loadPortalAccounts() {
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const { accounts } = await api.getPortalAccounts();
      setPortalAccounts(accounts || []);
    } catch (err) {
      setAccountsError(
        err instanceof Error ? err.message : 'Unable to load database accounts.',
      );
      setPortalAccounts([]);
    } finally {
      setAccountsLoading(false);
    }
  }

  useEffect(() => {
    void loadPortalAccounts();
  }, []);

  async function performLogin(empId: string, pass: string) {
    setError(null);
    setLoading(true);
    try {
      const { user } = await api.login(empId, pass);
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId.trim() || !password.trim()) {
      setError('Please enter both Username / Employee ID and Password.');
      return;
    }
    void performLogin(employeeId, password);
  }

  function handleSelectPortalAccount(account: PortalAccountOption) {
    const loginId = account.username || account.employeeId;
    setEmployeeId(loginId);
    if (!password) {
      setPassword('password123');
    }
    setError(null);
  }

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* Left Brand Panel */}
      <section
        aria-label="Sakthi Auto Brand Panel"
        className="lg:w-1/2 w-full min-h-[256px] lg:min-h-screen flex flex-col items-center justify-center px-8 py-12 relative overflow-hidden bg-[#121417]"
        style={{
          backgroundColor: '#121417',
          backgroundImage:
            'radial-gradient(circle at 18% 16%, rgba(242, 140, 0, 0.22) 0%, rgba(29, 32, 37, 0.96) 46%, #121417 100%)',
        }}
      >
        <div className="flex flex-col items-center text-center max-w-md z-10">
          <div className="bg-white rounded-2xl px-8 py-6 shadow-2xl mb-8 flex items-center justify-center">
            <img
              src="/assets/aistudio/logo_981ee04d.png"
              alt="Sakthi Auto Component Limited Logo"
              className="h-16 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <h1 className="text-white text-3xl sm:text-4xl font-extrabold tracking-[0.18em] uppercase leading-10">
            SAKTHI AUTO
          </h1>
          <p className="text-[#F28C00] text-sm sm:text-base font-bold tracking-[0.22em] uppercase mt-2">
            COMPONENT LIMITED
          </p>
          <p className="text-neutral-400 text-sm font-medium mt-4">
            SACL - Internal Portal
          </p>

          <div
            aria-hidden="true"
            className="w-16 h-1 rounded-full bg-[#F28C00] mt-8"
            style={{ boxShadow: '0 0 18px rgba(242, 140, 0, 0.85)' }}
          />
        </div>
      </section>

      {/* Right Login Panel */}
      <section
        aria-label="Account Sign In"
        className="lg:w-1/2 w-full flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-12 bg-white overflow-y-auto"
      >
        <div className="w-full max-w-[464px]">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-[0.02em] text-[#111318] leading-8">
              WELCOME BACK
            </h2>
            <p className="text-xs font-semibold tracking-[0.14em] text-[#5C6470] uppercase mt-2">
              SIGN IN WITH USERNAME OR EMPLOYEE ID
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-6 px-4 py-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-employee-id"
                className="block text-xs font-bold tracking-[0.08em] text-[#1D2025] uppercase mb-2"
              >
                USERNAME / EMPLOYEE ID
              </label>
              <div className="relative flex items-center">
                <User
                  aria-hidden="true"
                  className="w-4 h-4 text-[#8A94A6] absolute left-4 pointer-events-none"
                />
                <input
                  id="login-employee-id"
                  name="employeeId"
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter Username or Employee ID"
                  autoComplete="username"
                  className="w-full h-12 pl-10 pr-4 bg-white border border-[#D5DAE1] rounded-xl text-sm text-[#111318] placeholder:text-[#8A94A6] hover:border-[#98A2B3] focus:outline-none focus:border-[#F28C00] focus:ring-2 focus:ring-[#F28C00]/15 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold tracking-[0.08em] text-[#1D2025] uppercase mb-2"
              >
                PASSWORD
              </label>
              <div className="relative flex items-center">
                <Lock
                  aria-hidden="true"
                  className="w-4 h-4 text-[#8A94A6] absolute left-4 pointer-events-none"
                />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-12 pl-10 pr-12 bg-white border border-[#D5DAE1] rounded-xl text-sm text-[#111318] placeholder:text-[#8A94A6] hover:border-[#98A2B3] focus:outline-none focus:border-[#F28C00] focus:ring-2 focus:ring-[#F28C00]/15 transition-colors"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 w-8 h-8 rounded-lg flex items-center justify-center text-[#8A94A6] hover:text-[#111318] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 px-6 rounded-xl bg-[#F28C00] hover:bg-[#D97700] disabled:opacity-55 text-white font-bold text-sm tracking-[0.1em] uppercase flex items-center justify-center gap-2 transition-colors shadow-[0_1px_2px_rgba(16,24,40,0.08)] cursor-pointer"
              >
                <span>{loading ? 'SIGNING IN...' : 'SECURE LOGIN'}</span>
                <ArrowRight aria-hidden="true" className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Database-Backed Role-Based Portal Access */}
          <div className="mt-8 pt-6 border-t border-[#E4E7EC]">
            <button
              type="button"
              aria-expanded={rolePanelOpen}
              onClick={() => setRolePanelOpen((open) => !open)}
              className="w-full h-8 flex items-center justify-between text-left text-sm font-semibold text-[#344054] hover:text-[#111318] transition-colors cursor-pointer"
            >
              <span>Role-Based Portal Access</span>
              {rolePanelOpen ? (
                <ChevronUp className="w-4 h-4 text-[#5C6470]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#5C6470]" />
              )}
            </button>

            {rolePanelOpen && (
              <div className="mt-4 space-y-4">
                <p className="text-xs leading-4 text-[#5C6470]">
                  Select a Sakthi Auto role to sign in (Default password:{' '}
                  <span className="font-mono font-semibold text-[#111318]">password123</span>):
                </p>

                {accountsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Array.from({ length: 8 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-16 rounded-xl border border-[#E4E7EC] bg-[#F4F5F7] animate-pulse"
                      />
                    ))}
                  </div>
                ) : accountsError ? (
                  <div className="px-4 py-4 rounded-xl border border-red-200 bg-red-50 flex items-center justify-between gap-2">
                    <span className="text-xs text-red-700 font-medium">{accountsError}</span>
                    <button
                      type="button"
                      onClick={() => void loadPortalAccounts()}
                      className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:underline shrink-0 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                  </div>
                ) : portalAccounts.length === 0 ? (
                  <p className="text-xs text-[#5C6470] p-4 text-center border border-[#E4E7EC] rounded-xl bg-[#F8F9FB]">
                    No active database accounts found. Run the SQL database setup script first.
                  </p>
                ) : (
                  <div
                    role="list"
                    aria-label="Database portal accounts"
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[304px] overflow-y-auto no-scrollbar"
                  >
                    {portalAccounts.map((acc) => {
                      const loginCode = acc.username || acc.employeeId;
                      const isSelected =
                        employeeId.trim().toUpperCase() === loginCode.toUpperCase();
                      const roleLabel = SHORT_ROLE_LABELS[acc.role] || acc.role;

                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleSelectPortalAccount(acc)}
                          className={`w-full min-h-[64px] text-left px-4 py-2 rounded-xl border flex flex-col justify-center transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-[#F28C00] bg-[#FFF6EB]/70 ring-1 ring-[#F28C00]/30'
                              : 'border-[#E4E7EC] bg-white hover:border-[#F28C00]/70 hover:bg-[#F8F9FB]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[13px] leading-5 font-bold text-[#111318] truncate">
                              {roleLabel}
                            </span>
                            <span className="text-xs leading-4 font-mono font-semibold text-[#D97700] shrink-0">
                              {loginCode}
                            </span>
                          </div>
                          <p className="text-xs leading-4 text-[#5C6470] truncate mt-1">
                            {acc.name}
                            {acc.companyCode ? ` · ${acc.companyCode}` : ''}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
