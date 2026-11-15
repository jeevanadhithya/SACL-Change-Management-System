import React, { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Eye, EyeOff, Lock, User } from 'lucide-react';
import { api } from '../api/client';
import type { UserAccount } from '../types/pcms';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
}

const QUICK_ACCOUNTS = [
  { employeeId: 'EMP101', label: 'Employee', name: 'R. Karthik' },
  { employeeId: 'HOD201', label: 'HOD', name: 'S. Muruganandam' },
  { employeeId: 'HOF301', label: 'HOF', name: 'K. Natarajan' },
  { employeeId: 'COF302', label: 'COF', name: 'M. Senthil Kumar' },
  { employeeId: 'CFT401', label: 'CFT Member', name: 'P. Anitha' },
  { employeeId: 'CFTL01', label: 'CFT Leader', name: 'D. Prakash Raj' },
  { employeeId: 'PH001', label: 'Plant Head', name: 'N. Chandrasekhar' },
  { employeeId: 'ADM001', label: 'Admin', name: 'V. Balasubramanian' },
];

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRoleAccess, setShowRoleAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError('Please enter both Employee ID and Password.');
      return;
    }
    void performLogin(employeeId, password);
  }

  function handleQuickLogin(empId: string) {
    setEmployeeId(empId);
    setPassword('password123');
    void performLogin(empId, 'password123');
  }

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-white">
      {/* Left Brand Panel — Sakthi Auto Portal Reference */}
      <section
        aria-label="Sakthi Auto Brand Panel"
        className="lg:w-1/2 w-full min-h-[280px] lg:min-h-screen flex flex-col items-center justify-center px-8 py-12 relative overflow-hidden bg-[#151515]"
        style={{
          backgroundColor: '#151515',
          backgroundImage:
            'radial-gradient(circle at 18% 16%, rgba(242, 140, 0, 0.22) 0%, rgba(36, 36, 36, 0.96) 46%, #151515 100%)',
        }}
      >
        <div className="flex flex-col items-center text-center max-w-md z-10">
          <div className="bg-white rounded-2xl px-8 py-5 shadow-2xl mb-8 flex items-center justify-center">
            <img
              src="/assets/aistudio/logo_981ee04d.png"
              alt="Sakthi Auto Component Limited Logo"
              className="h-14 sm:h-16 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <h1 className="text-white text-3xl sm:text-4xl font-extrabold tracking-[0.18em] uppercase">
            SAKTHI AUTO
          </h1>
          <p className="text-[#F28C00] text-sm sm:text-base font-bold tracking-[0.22em] uppercase mt-2">
            COMPONENT LIMITED
          </p>
          <p className="text-neutral-400 text-sm font-medium mt-3">
            SACL - Internal Portal
          </p>

          <div
            aria-hidden="true"
            className="w-16 h-1 rounded-full bg-[#F28C00] mt-7"
            style={{ boxShadow: '0 0 18px rgba(242, 140, 0, 0.85)' }}
          />
        </div>
      </section>

      {/* Right Login Panel */}
      <section
        aria-label="Account Sign In"
        className="lg:w-1/2 w-full flex-1 flex flex-col items-center justify-center px-6 sm:px-12 py-12 bg-white"
      >
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#151515]">
              WELCOME BACK
            </h2>
            <p className="text-xs font-semibold tracking-[0.14em] text-neutral-500 uppercase mt-1.5">
              SIGN IN TO YOUR ACCOUNT
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="login-employee-id"
                className="block text-xs font-bold tracking-[0.08em] text-[#242424] uppercase mb-2"
              >
                EMPLOYEE ID
              </label>
              <div className="relative flex items-center">
                <User
                  aria-hidden="true"
                  className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none"
                />
                <input
                  id="login-employee-id"
                  name="employeeId"
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Enter your Employee ID"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#E6E6E6] rounded-xl text-sm text-[#151515] placeholder:text-neutral-400 focus:outline-none focus:border-[#F28C00] focus:ring-2 focus:ring-[#F28C00]/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold tracking-[0.08em] text-[#242424] uppercase mb-2"
              >
                PASSWORD
              </label>
              <div className="relative flex items-center">
                <Lock
                  aria-hidden="true"
                  className="w-4 h-4 text-neutral-400 absolute left-3.5 pointer-events-none"
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
                  className="w-full pl-10 pr-11 py-3 bg-white border border-[#E6E6E6] rounded-xl text-sm text-[#151515] placeholder:text-neutral-400 focus:outline-none focus:border-[#F28C00] focus:ring-2 focus:ring-[#F28C00]/20 transition-colors"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 p-1.5 text-neutral-400 hover:text-[#151515] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-[#F28C00] hover:bg-[#E87500] disabled:opacity-60 text-white font-bold text-sm tracking-[0.1em] uppercase flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <span>{loading ? 'SIGNING IN...' : 'SECURE LOGIN'}</span>
              <ArrowRight aria-hidden="true" className="w-4 h-4" />
            </button>
          </form>

          {/* Clean Expandable Role Access Switcher */}
          <div className="mt-7 pt-5 border-t border-[#E6E6E6]">
            <button
              type="button"
              aria-expanded={showRoleAccess}
              onClick={() => setShowRoleAccess((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[#666666] hover:text-[#151515] py-1 cursor-pointer"
            >
              <span>Role-Based Portal Access</span>
              {showRoleAccess ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showRoleAccess && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-neutral-500">
                  Select a Sakthi Auto role to sign in (Default password:{' '}
                  <span className="font-mono text-[#151515]">password123</span>):
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.employeeId}
                      type="button"
                      onClick={() => handleQuickLogin(acc.employeeId)}
                      className="text-left px-3 py-2 rounded-lg border border-[#E6E6E6] hover:border-[#F28C00] hover:bg-[#FFF4E5]/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-[#151515] truncate">{acc.label}</span>
                        <span className="text-[11px] font-mono text-[#E87500]">{acc.employeeId}</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate">{acc.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
