import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  Cog,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  KeyRound,
  Mail,
  MapPin,
  Package,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { CreateCompanyAccountPayload } from '../api/client';
import type {
  ChangeRequestRecord,
  CompanyRecord,
  PartMasterRecord,
  UserAccount,
  UserRole,
} from '../types/pcms';
import { RoleDisplayLabel, StatusText } from './ui/StatusBadge';

const ALL_ROLES: UserRole[] = [
  'COMPANY_USER',
  'EMPLOYEE',
  'HOD',
  'HOF',
  'COF',
  'CFT',
  'CFT_LEADER',
  'PLANT_HEAD',
  'ADMIN',
];

interface CompanyViewPageProps {
  company: CompanyRecord;
  currentUser: UserAccount;
  users: UserAccount[];
  parts: PartMasterRecord[];
  pcrfs: ChangeRequestRecord[];
  onBack: () => void;
  onUpdateCompany: (id: string, payload: Partial<CompanyRecord>) => Promise<void>;
  onCreateCompanyAccount: (companyId: string, payload: CreateCompanyAccountPayload) => Promise<void>;
  onUpdateUser: (id: string, payload: Partial<UserAccount>) => Promise<void>;
  onChangeUserPassword: (id: string, password: string) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onCreatePart: (payload: Partial<PartMasterRecord>) => Promise<void>;
  onUpdatePart: (id: string, payload: Partial<PartMasterRecord>) => Promise<void>;
  onDeletePart: (id: string) => Promise<void>;
  onOpenPCRF: (pcrfId: string) => void;
  onCreatePCRFForCompany: () => void;
}

export function CompanyViewPage({
  company,
  currentUser,
  users,
  parts,
  pcrfs,
  onBack,
  onUpdateCompany,
  onCreateCompanyAccount,
  onUpdateUser,
  onChangeUserPassword,
  onDeleteUser,
  onCreatePart,
  onUpdatePart,
  onDeletePart,
  onOpenPCRF,
  onCreatePCRFForCompany,
}: CompanyViewPageProps) {
  const isAdmin = currentUser.role === 'ADMIN';
  const companyUsers = users.filter((u) => u.companyId === company.id);
  const companyParts = parts.filter((pt) => pt.companyId === company.id);
  const companyPcrfs = pcrfs.filter((p) => p.companyId === company.id);

  // Section filter
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'parts' | 'pcrfs'>('all');

  // Company edit state
  const [editingCompany, setEditingCompany] = useState(false);
  const [compName, setCompName] = useState(company.name);
  const [compUnit, setCompUnit] = useState(company.unitName);
  const [compFacility, setCompFacility] = useState<CompanyRecord['facilityType']>(company.facilityType);
  const [compLocation, setCompLocation] = useState(company.location);
  const [compGst, setCompGst] = useState(company.gstOrRegNo);
  const [compEmail, setCompEmail] = useState(company.contactEmail);
  const [compActive, setCompActive] = useState(company.active);
  const [compSaving, setCompSaving] = useState(false);
  const [compBanner, setCompBanner] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Add User state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('COMPANY_USER');
  const [newDept, setNewDept] = useState(company.unitName);
  const [userSaving, setUserSaving] = useState(false);
  const [userBanner, setUserBanner] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Modify User state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('COMPANY_USER');
  const [editUserDept, setEditUserDept] = useState('');
  const [editUserActive, setEditUserActive] = useState(true);

  // Change Password state
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Delete User inline confirmation
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  // Add / Edit Manufactured Part state
  const [showAddPart, setShowAddPart] = useState(false);
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [partDrawing, setPartDrawing] = useState('');
  const [partRev, setPartRev] = useState('Rev 01');
  const [partMaterial, setPartMaterial] = useState('');
  const [partProcess, setPartProcess] = useState('');
  const [partCustomer, setPartCustomer] = useState(company.name);
  const [partFacility, setPartFacility] = useState<PartMasterRecord['facility']>(
    company.facilityType === 'Foundry'
      ? 'Foundry'
      : company.facilityType === 'Foundry & Machine Shop'
      ? 'Foundry & Machine Shop'
      : 'Machine Shop',
  );
  const [partSpecs, setPartSpecs] = useState('');
  const [partSaving, setPartSaving] = useState(false);
  const [partBanner, setPartBanner] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [editPartData, setEditPartData] = useState<Partial<PartMasterRecord>>({});
  const [confirmDeletePartId, setConfirmDeletePartId] = useState<string | null>(null);

  async function handleSaveCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!compName.trim() || !compLocation.trim()) {
      setCompBanner({ type: 'error', text: 'Company Name and Plant Location are required.' });
      return;
    }
    setCompSaving(true);
    setCompBanner(null);
    try {
      await onUpdateCompany(company.id, {
        name: compName.trim(),
        unitName: compUnit.trim() || 'Machine Shop Unit',
        facilityType: compFacility,
        location: compLocation.trim(),
        gstOrRegNo: compGst.trim(),
        contactEmail: compEmail.trim(),
        active: compActive,
      });
      setCompBanner({ type: 'success', text: 'Company profile updated successfully.' });
      setEditingCompany(false);
    } catch (err) {
      setCompBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to update company details.',
      });
    } finally {
      setCompSaving(false);
    }
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim() || !newPassword.trim()) {
      setUserBanner({ type: 'error', text: 'Username, Full Name, and Password are required.' });
      return;
    }
    if (newPassword.trim().length < 4) {
      setUserBanner({ type: 'error', text: 'Password must be at least 4 characters long.' });
      return;
    }
    setUserSaving(true);
    setUserBanner(null);
    try {
      await onCreateCompanyAccount(company.id, {
        username: newUsername.trim(),
        name: newFullName.trim(),
        email: newEmail.trim() || undefined,
        password: newPassword.trim(),
        role: newRole,
        department: newDept.trim() || company.unitName,
      });
      setUserBanner({
        type: 'success',
        text: `Added user "${newUsername.trim()}" (${RoleDisplayLabel(newRole)}) under ${company.code}.`,
      });
      setNewUsername('');
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      setNewRole('COMPANY_USER');
      setShowAddUser(false);
    } catch (err) {
      setUserBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to add user.',
      });
    } finally {
      setUserSaving(false);
    }
  }

  function startEditUser(u: UserAccount) {
    setPasswordUserId(null);
    setConfirmDeleteUserId(null);
    setUserBanner(null);
    setEditingUserId(u.id);
    setEditUserName(u.name);
    setEditUserEmail(u.email);
    setEditUserRole(u.role);
    setEditUserDept(u.department);
    setEditUserActive(u.active);
  }

  async function handleSaveUserEdit(userId: string) {
    if (!editUserName.trim()) {
      setUserBanner({ type: 'error', text: 'User Full Name cannot be empty.' });
      return;
    }
    setUserSaving(true);
    setUserBanner(null);
    try {
      await onUpdateUser(userId, {
        name: editUserName.trim(),
        email: editUserEmail.trim(),
        role: editUserRole,
        department: editUserDept.trim() || company.unitName,
        active: editUserActive,
      });
      setUserBanner({ type: 'success', text: `Updated user "${editUserName.trim()}" successfully.` });
      setEditingUserId(null);
    } catch (err) {
      setUserBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to modify user.',
      });
    } finally {
      setUserSaving(false);
    }
  }

  function startPasswordReset(u: UserAccount) {
    setEditingUserId(null);
    setConfirmDeleteUserId(null);
    setUserBanner(null);
    setPasswordUserId(u.id);
    setResetPasswordVal('');
    setResetPasswordConfirm('');
    setShowResetPassword(false);
  }

  async function handleSavePassword(userId: string, label: string) {
    if (resetPasswordVal.trim().length < 4) {
      setUserBanner({ type: 'error', text: 'New password must be at least 4 characters long.' });
      return;
    }
    if (resetPasswordConfirm && resetPasswordVal !== resetPasswordConfirm) {
      setUserBanner({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    setUserSaving(true);
    setUserBanner(null);
    try {
      await onChangeUserPassword(userId, resetPasswordVal.trim());
      setUserBanner({
        type: 'success',
        text: `Password updated for "${label}". They can sign in with the new password immediately.`,
      });
      setPasswordUserId(null);
      setResetPasswordVal('');
      setResetPasswordConfirm('');
    } catch (err) {
      setUserBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to change password.',
      });
    } finally {
      setUserSaving(false);
    }
  }

  async function handleDeleteUserConfirm(u: UserAccount) {
    setUserSaving(true);
    setUserBanner(null);
    try {
      await onDeleteUser(u.id);
      setUserBanner({
        type: 'success',
        text: `Deleted user account "${u.username || u.employeeId}" (${u.name}).`,
      });
      setConfirmDeleteUserId(null);
    } catch (err) {
      setUserBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to delete user.',
      });
    } finally {
      setUserSaving(false);
    }
  }

  async function handleAddPart(e: React.FormEvent) {
    e.preventDefault();
    if (!partNumber.trim() || !partName.trim()) {
      setPartBanner({ type: 'error', text: 'Part Number and Part Name are required.' });
      return;
    }
    setPartSaving(true);
    setPartBanner(null);
    try {
      await onCreatePart({
        companyId: company.id,
        partNumber: partNumber.trim(),
        partName: partName.trim(),
        customer: partCustomer.trim() || company.name,
        facility: partFacility,
        currentRevision: partRev.trim() || 'Rev 01',
        drawingNumber: partDrawing.trim(),
        materialGrade: partMaterial.trim(),
        processType: partProcess.trim(),
        specifications: partSpecs.trim(),
      });
      setPartBanner({
        type: 'success',
        text: `Added manufactured part "${partNumber.trim().toUpperCase()} — ${partName.trim()}" for ${company.code}. It will reflect on PCRF & linked Forms 1–7.`,
      });
      setPartNumber('');
      setPartName('');
      setPartDrawing('');
      setPartRev('Rev 01');
      setPartMaterial('');
      setPartProcess('');
      setPartSpecs('');
      setShowAddPart(false);
    } catch (err) {
      setPartBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to add manufactured part.',
      });
    } finally {
      setPartSaving(false);
    }
  }

  function startEditPart(pt: PartMasterRecord) {
    setConfirmDeletePartId(null);
    setPartBanner(null);
    setEditingPartId(pt.id);
    setEditPartData({ ...pt });
  }

  async function handleSavePartEdit(partId: string) {
    if (!editPartData.partNumber?.trim() || !editPartData.partName?.trim()) {
      setPartBanner({ type: 'error', text: 'Part Number and Part Name are required.' });
      return;
    }
    setPartSaving(true);
    setPartBanner(null);
    try {
      await onUpdatePart(partId, {
        ...editPartData,
        companyId: company.id,
      });
      setPartBanner({
        type: 'success',
        text: `Updated manufactured part "${editPartData.partNumber.trim().toUpperCase()}".`,
      });
      setEditingPartId(null);
    } catch (err) {
      setPartBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to update manufactured part.',
      });
    } finally {
      setPartSaving(false);
    }
  }

  async function handleDeletePartConfirm(pt: PartMasterRecord) {
    setPartSaving(true);
    setPartBanner(null);
    try {
      await onDeletePart(pt.id);
      setPartBanner({
        type: 'success',
        text: `Deleted manufactured part "${pt.partNumber} — ${pt.partName}".`,
      });
      setConfirmDeletePartId(null);
    } catch (err) {
      setPartBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to delete manufactured part.',
      });
    } finally {
      setPartSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Page Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Companies list"
            className="w-10 h-10 rounded-lg border border-[#D5DAE1] bg-white hover:bg-[#F8F9FB] hover:border-[#121417] text-[#111318] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono font-extrabold text-[#D97700] uppercase tracking-wider">
                {company.code}
              </span>
              <span className="text-[#D5DAE1]">·</span>
              <span className="font-semibold text-[#5C6470]">{company.facilityType}</span>
              <span className="text-[#D5DAE1]">·</span>
              <span
                className={`font-bold ${
                  company.active ? 'text-emerald-700' : 'text-red-600'
                }`}
              >
                {company.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h2 className="text-2xl leading-8 font-extrabold text-[#111318] tracking-tight">
              {company.name}
            </h2>
            <p className="text-sm text-[#5C6470]">{company.unitName}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 shrink-0">
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setEditingCompany((v) => !v);
                setCompBanner(null);
              }}
              className="btn-secondary"
            >
              <Edit3 className="w-4 h-4" />
              <span>{editingCompany ? 'Close Editor' : 'Edit Company Details'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onCreatePCRFForCompany}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Raise PCRF for Company</span>
          </button>
        </div>
      </div>

      {/* Company Overview Details + Summary KPIs */}
      <section className="surface-card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E4E7EC]">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#F28C00]" />
            <h3 className="text-sm font-bold text-[#111318]">Company Profile &amp; Plant Details</h3>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-semibold text-[#5C6470]">
              Users: <strong className="font-mono tabular-nums text-[#111318]">{companyUsers.length}</strong>
            </span>
            <span className="font-semibold text-[#5C6470]">
              Manufactured Parts:{' '}
              <strong className="font-mono tabular-nums text-[#D97700]">{companyParts.length}</strong>
            </span>
            <span className="font-semibold text-[#5C6470]">
              Linked PCRFs:{' '}
              <strong className="font-mono tabular-nums text-[#111318]">{companyPcrfs.length}</strong>
            </span>
          </div>
        </div>

        {compBanner && (
          <div
            role={compBanner.type === 'error' ? 'alert' : 'status'}
            className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
              compBanner.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            {compBanner.text}
          </div>
        )}

        {editingCompany ? (
          <form onSubmit={handleSaveCompany} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label htmlFor="edit-comp-name" className="field-label">
                  Company Name *
                </label>
                <input
                  id="edit-comp-name"
                  type="text"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="edit-comp-unit" className="field-label">
                  Unit / Division Name
                </label>
                <input
                  id="edit-comp-unit"
                  type="text"
                  value={compUnit}
                  onChange={(e) => setCompUnit(e.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="edit-comp-facility" className="field-label">
                  Facility Type
                </label>
                <select
                  id="edit-comp-facility"
                  value={compFacility}
                  onChange={(e) => setCompFacility(e.target.value as CompanyRecord['facilityType'])}
                  className="field-input"
                >
                  <option value="Machine Shop">Machine Shop</option>
                  <option value="Foundry">Foundry</option>
                  <option value="Foundry & Machine Shop">Foundry &amp; Machine Shop</option>
                  <option value="Corporate">Corporate</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-comp-location" className="field-label">
                  Plant Location *
                </label>
                <input
                  id="edit-comp-location"
                  type="text"
                  value={compLocation}
                  onChange={(e) => setCompLocation(e.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="edit-comp-gst" className="field-label">
                  GST / Reg. No.
                </label>
                <input
                  id="edit-comp-gst"
                  type="text"
                  value={compGst}
                  onChange={(e) => setCompGst(e.target.value)}
                  className="field-input font-mono"
                />
              </div>
              <div>
                <label htmlFor="edit-comp-email" className="field-label">
                  Contact Email
                </label>
                <input
                  id="edit-comp-email"
                  type="email"
                  value={compEmail}
                  onChange={(e) => setCompEmail(e.target.value)}
                  className="field-input"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E4E7EC]">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#111318] cursor-pointer">
                <input
                  type="checkbox"
                  checked={compActive}
                  onChange={(e) => setCompActive(e.target.checked)}
                  className="w-4 h-4 accent-[#F28C00]"
                />
                <span>Company Active</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCompany(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={compSaving}
                  className="btn-dark hover:bg-[#F28C00]"
                >
                  <Save className="w-4 h-4" />
                  <span>{compSaving ? 'Saving...' : 'Save Company Details'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-[#F8F9FB] space-y-2">
              <dt className="text-[#5C6470] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#F28C00] shrink-0" /> Plant Location
              </dt>
              <dd className="font-bold text-[#111318]">{company.location}</dd>
            </div>
            <div className="p-4 rounded-lg bg-[#F8F9FB] space-y-2">
              <dt className="text-[#5C6470] flex items-center gap-2">
                <Cog className="w-4 h-4 text-[#F28C00] shrink-0" /> Facility Scope
              </dt>
              <dd className="font-bold text-[#111318]">{company.facilityType}</dd>
            </div>
            <div className="p-4 rounded-lg bg-[#F8F9FB] space-y-2">
              <dt className="text-[#5C6470] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#F28C00] shrink-0" /> GST / Reg. No.
              </dt>
              <dd className="font-mono font-bold text-[#111318]">
                {company.gstOrRegNo || 'Not specified'}
              </dd>
            </div>
            <div className="p-4 rounded-lg bg-[#F8F9FB] space-y-2">
              <dt className="text-[#5C6470] flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#F28C00] shrink-0" /> Contact Email
              </dt>
              <dd className="font-bold text-[#111318] truncate">
                {company.contactEmail || 'Not specified'}
              </dd>
            </div>
          </dl>
        )}
      </section>

      {/* Section Filter Tabs */}
      <div className="surface-card flex flex-wrap items-center gap-1 p-2 w-fit">
        {(
          [
            { key: 'all', label: 'All Sections' },
            { key: 'users', label: `Company Users (${companyUsers.length})` },
            { key: 'parts', label: `Manufactured Parts (${companyParts.length})` },
            { key: 'pcrfs', label: `Linked PCRFs (${companyPcrfs.length})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`h-8 px-4 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#121417] text-white'
                : 'text-[#5C6470] hover:text-[#111318] hover:bg-[#F8F9FB]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SECTION A: Company Users & Access Management */}
      {(activeTab === 'all' || activeTab === 'users') && (
        <section className="surface-card overflow-hidden">
          <div className="surface-header flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#FFF6EB] text-[#D97700] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#111318]">
                  Company Users &amp; Individual Access ({companyUsers.length})
                </h3>
                <p className="text-xs text-[#5C6470] mt-1">
                  Manage company representatives and plant accounts under {company.code}. Administrators can add, modify, reset passwords, or remove accounts.
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setShowAddUser((v) => !v);
                  setUserBanner(null);
                }}
                className="btn-dark hover:bg-[#F28C00] shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>{showAddUser ? 'Close Add User' : 'Add User to Company'}</span>
              </button>
            )}
          </div>

          {userBanner && (
            <div
              role={userBanner.type === 'error' ? 'alert' : 'status'}
              className={`mx-6 mt-4 px-4 py-2 rounded-lg border text-xs font-semibold ${
                userBanner.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              {userBanner.text}
            </div>
          )}

          {/* Add New User Form */}
          {isAdmin && showAddUser && (
            <form
              onSubmit={handleAddUser}
              className="p-6 bg-[#F8F9FB] border-b border-[#E4E7EC] space-y-6"
            >
              <p className="text-xs font-bold text-[#111318] uppercase tracking-wider">
                New Account under {company.code}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="cv-new-username" className="field-label">
                    Username / Login ID *
                  </label>
                  <input
                    id="cv-new-username"
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g., u1_rep"
                    className="field-input font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="cv-new-fullname" className="field-label">
                    Full Name *
                  </label>
                  <input
                    id="cv-new-fullname"
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g., K. Arvind"
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="cv-new-password" className="field-label">
                    Password (min 4 chars) *
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="cv-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Set login password"
                      className="field-input !pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showNewPassword ? 'Hide new user password' : 'Show new user password'}
                      onClick={() => setShowNewPassword((p) => !p)}
                      className="absolute right-2 w-8 h-8 flex items-center justify-center text-[#5C6470] hover:text-[#111318] cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="cv-new-role" className="field-label">
                    Role (JWT Access)
                  </label>
                  <select
                    id="cv-new-role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="field-input"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {RoleDisplayLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="cv-new-dept" className="field-label">
                    Department / Unit
                  </label>
                  <input
                    id="cv-new-dept"
                    type="text"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder={company.unitName}
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="cv-new-email" className="field-label">
                    Email (Optional)
                  </label>
                  <input
                    id="cv-new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="person@company.com"
                    className="field-input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userSaving}
                  className="btn-primary"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{userSaving ? 'Creating...' : 'Create User Account'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Company Users Table */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#5C6470] uppercase tracking-wider">
                  <th className="h-10 px-6">Username / ID</th>
                  <th className="h-10 px-4">Name &amp; Email</th>
                  <th className="h-10 px-4">Role</th>
                  <th className="h-10 px-4">Department</th>
                  <th className="h-10 px-4">Status</th>
                  {isAdmin && <th className="h-10 px-6 text-right">Admin Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC]">
                {companyUsers.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-12 px-6 text-center text-xs text-[#5C6470]">
                      No users assigned to {company.code} yet. Click &ldquo;Add User to Company&rdquo; above to create an account.
                    </td>
                  </tr>
                ) : (
                  companyUsers.map((u) => {
                    const loginLabel = u.username || u.employeeId;
                    const isEditingThis = editingUserId === u.id;
                    const isResettingThis = passwordUserId === u.id;
                    const isConfirmingDelete = confirmDeleteUserId === u.id;
                    const isSelf = u.id === currentUser.id;

                    return (
                      <React.Fragment key={u.id}>
                        <tr className="hover:bg-[#F8F9FB] transition-colors">
                          <td className="py-4 px-6 font-mono text-xs font-bold text-[#111318] whitespace-nowrap">
                            {loginLabel}
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-semibold text-[#111318]">{u.name}</p>
                            <p className="text-xs text-[#5C6470] mt-1">{u.email}</p>
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-[#D97700] whitespace-nowrap">
                            {RoleDisplayLabel(u.role)}
                          </td>
                          <td className="py-4 px-4 text-xs text-[#5C6470]">{u.department}</td>
                          <td className="py-4 px-4 text-xs font-semibold">
                            <span className={u.active ? 'text-emerald-700' : 'text-red-600'}>
                              {u.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  aria-label={`Modify user ${loginLabel}`}
                                  onClick={() =>
                                    isEditingThis ? setEditingUserId(null) : startEditUser(u)
                                  }
                                  className="btn-compact border border-[#D5DAE1] bg-white hover:border-[#121417] text-[#111318]"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Modify</span>
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Change password for ${loginLabel}`}
                                  onClick={() =>
                                    isResettingThis ? setPasswordUserId(null) : startPasswordReset(u)
                                  }
                                  className="btn-compact border border-[#D5DAE1] bg-white hover:border-[#F28C00] hover:text-[#D97700] text-[#111318]"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                  <span>Password</span>
                                </button>
                                {!isSelf && !isConfirmingDelete && (
                                  <button
                                    type="button"
                                    aria-label={`Delete user ${loginLabel}`}
                                    onClick={() => {
                                      setEditingUserId(null);
                                      setPasswordUserId(null);
                                      setConfirmDeleteUserId(u.id);
                                    }}
                                    className="btn-compact border border-red-200 bg-white text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                )}
                                {isConfirmingDelete && (
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={userSaving}
                                      aria-label={`Confirm delete user ${loginLabel}`}
                                      onClick={() => void handleDeleteUserConfirm(u)}
                                      className="btn-compact bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Confirm Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteUserId(null)}
                                      className="btn-compact border border-[#D5DAE1] bg-white text-[#5C6470]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>

                        {/* Inline Modify User Panel */}
                        {isAdmin && isEditingThis && (
                          <tr className="bg-[#FFF6EB]/60">
                            <td colSpan={6} className="p-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                                <div>
                                  <label htmlFor={`edit-u-name-${u.id}`} className="field-label">
                                    Full Name
                                  </label>
                                  <input
                                    id={`edit-u-name-${u.id}`}
                                    type="text"
                                    value={editUserName}
                                    onChange={(e) => setEditUserName(e.target.value)}
                                    className="field-input"
                                  />
                                </div>
                                <div>
                                  <label htmlFor={`edit-u-email-${u.id}`} className="field-label">
                                    Email
                                  </label>
                                  <input
                                    id={`edit-u-email-${u.id}`}
                                    type="email"
                                    value={editUserEmail}
                                    onChange={(e) => setEditUserEmail(e.target.value)}
                                    className="field-input"
                                  />
                                </div>
                                <div>
                                  <label htmlFor={`edit-u-role-${u.id}`} className="field-label">
                                    Role
                                  </label>
                                  <select
                                    id={`edit-u-role-${u.id}`}
                                    value={editUserRole}
                                    onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                                    className="field-input"
                                  >
                                    {ALL_ROLES.map((r) => (
                                      <option key={r} value={r}>
                                        {RoleDisplayLabel(r)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor={`edit-u-dept-${u.id}`} className="field-label">
                                    Department
                                  </label>
                                  <input
                                    id={`edit-u-dept-${u.id}`}
                                    type="text"
                                    value={editUserDept}
                                    onChange={(e) => setEditUserDept(e.target.value)}
                                    className="field-input"
                                  />
                                </div>
                                <div className="flex items-center justify-between gap-2 h-10">
                                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#111318] cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={editUserActive}
                                      onChange={(e) => setEditUserActive(e.target.checked)}
                                      className="w-4 h-4 accent-[#F28C00]"
                                    />
                                    <span>Active</span>
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={userSaving}
                                      onClick={() => void handleSaveUserEdit(u.id)}
                                      className="btn-compact bg-[#121417] hover:bg-[#F28C00] text-white"
                                    >
                                      <Check className="w-4 h-4" />
                                      <span>Save</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingUserId(null)}
                                      className="w-8 h-8 rounded-lg border border-[#D5DAE1] bg-white text-[#5C6470] hover:text-[#111318] flex items-center justify-center cursor-pointer"
                                      aria-label="Cancel user edit"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}

                        {/* Inline Change Password Panel */}
                        {isAdmin && isResettingThis && (
                          <tr className="bg-[#FFF6EB]/60">
                            <td colSpan={6} className="p-6">
                              <div className="flex flex-wrap items-end gap-4">
                                <div className="flex-1 min-w-[200px]">
                                  <label htmlFor={`reset-pw-${u.id}`} className="field-label">
                                    New Password for {loginLabel} (min 4 chars) *
                                  </label>
                                  <div className="relative flex items-center">
                                    <input
                                      id={`reset-pw-${u.id}`}
                                      type={showResetPassword ? 'text' : 'password'}
                                      value={resetPasswordVal}
                                      onChange={(e) => setResetPasswordVal(e.target.value)}
                                      placeholder="Enter new password"
                                      className="field-input !pr-10"
                                    />
                                    <button
                                      type="button"
                                      aria-label={showResetPassword ? 'Hide reset password' : 'Show reset password'}
                                      onClick={() => setShowResetPassword((p) => !p)}
                                      className="absolute right-2 w-8 h-8 flex items-center justify-center text-[#5C6470] hover:text-[#111318] cursor-pointer"
                                    >
                                      {showResetPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                      ) : (
                                        <Eye className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-[200px]">
                                  <label htmlFor={`reset-pw-confirm-${u.id}`} className="field-label">
                                    Confirm New Password
                                  </label>
                                  <input
                                    id={`reset-pw-confirm-${u.id}`}
                                    type={showResetPassword ? 'text' : 'password'}
                                    value={resetPasswordConfirm}
                                    onChange={(e) => setResetPasswordConfirm(e.target.value)}
                                    placeholder="Re-enter new password"
                                    className="field-input"
                                  />
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={userSaving}
                                    onClick={() => void handleSavePassword(u.id, loginLabel)}
                                    className="btn-primary"
                                  >
                                    <KeyRound className="w-4 h-4" />
                                    <span>Update Password</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPasswordUserId(null)}
                                    className="btn-secondary"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION B: Manufactured Parts for this Company (Reflected on Forms 1-7) */}
      {(activeTab === 'all' || activeTab === 'parts') && (
        <section className="surface-card overflow-hidden">
          <div className="surface-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#FFF6EB] text-[#D97700] flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#111318]">
                  Manufactured Parts for {company.code} ({companyParts.length})
                </h3>
                <p className="text-xs text-[#5C6470] mt-1">
                  Parts and technical specs defined here automatically appear when raising PCRFs for this company and populate Forms 1–7 (Drawing No., Revision, Material &amp; Process details).
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setShowAddPart((v) => !v);
                  setPartBanner(null);
                }}
                className="btn-primary self-start sm:self-center shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddPart ? 'Close Add Part' : 'Add Manufactured Part'}</span>
              </button>
            )}
          </div>

          {partBanner && (
            <div
              role={partBanner.type === 'error' ? 'alert' : 'status'}
              className={`mx-6 mt-4 px-4 py-2 rounded-lg border text-xs font-semibold ${
                partBanner.type === 'error'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
            >
              {partBanner.text}
            </div>
          )}

          {/* Add Manufactured Part Form */}
          {isAdmin && showAddPart && (
            <form
              onSubmit={handleAddPart}
              className="p-6 bg-[#F8F9FB] border-b border-[#E4E7EC] space-y-6"
            >
              <p className="text-xs font-bold text-[#111318] uppercase tracking-wider">
                Register Part Manufactured for {company.name}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="cv-part-no" className="field-label">
                    Part Number *
                  </label>
                  <input
                    id="cv-part-no"
                    type="text"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                    placeholder="e.g., PT-2001"
                    className="field-input font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="cv-part-name" className="field-label">
                    Part Name *
                  </label>
                  <input
                    id="cv-part-name"
                    type="text"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    placeholder="e.g., Steering Knuckle LH"
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="cv-part-drg" className="field-label">
                    Drawing Number
                  </label>
                  <input
                    id="cv-part-drg"
                    type="text"
                    value={partDrawing}
                    onChange={(e) => setPartDrawing(e.target.value)}
                    placeholder="e.g., DRG-901-A"
                    className="field-input font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="cv-part-rev" className="field-label">
                    Current Revision
                  </label>
                  <input
                    id="cv-part-rev"
                    type="text"
                    value={partRev}
                    onChange={(e) => setPartRev(e.target.value)}
                    placeholder="Rev 01"
                    className="field-input font-mono"
                  />
                </div>
                <div>
                  <label htmlFor="cv-part-material" className="field-label">
                    Material / Alloy Grade
                  </label>
                  <input
                    id="cv-part-material"
                    type="text"
                    value={partMaterial}
                    onChange={(e) => setPartMaterial(e.target.value)}
                    placeholder="e.g., SG500/7 Ductile Iron"
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="cv-part-process" className="field-label">
                    Manufacturing Process
                  </label>
                  <input
                    id="cv-part-process"
                    type="text"
                    value={partProcess}
                    onChange={(e) => setPartProcess(e.target.value)}
                    placeholder="e.g., VMC Bore & Turning"
                    className="field-input"
                  />
                </div>
                <div>
                  <label htmlFor="cv-part-facility" className="field-label">
                    Facility Scope
                  </label>
                  <select
                    id="cv-part-facility"
                    value={partFacility}
                    onChange={(e) => setPartFacility(e.target.value as PartMasterRecord['facility'])}
                    className="field-input"
                  >
                    <option value="Machine Shop">Machine Shop</option>
                    <option value="Foundry">Foundry</option>
                    <option value="Foundry & Machine Shop">Foundry &amp; Machine Shop</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cv-part-customer" className="field-label">
                    OEM / Customer Label (for Forms)
                  </label>
                  <input
                    id="cv-part-customer"
                    type="text"
                    value={partCustomer}
                    onChange={(e) => setPartCustomer(e.target.value)}
                    placeholder={company.name}
                    className="field-input"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-4">
                  <label htmlFor="cv-part-specs" className="field-label">
                    Key Technical Specifications / Critical Characteristics
                  </label>
                  <input
                    id="cv-part-specs"
                    type="text"
                    value={partSpecs}
                    onChange={(e) => setPartSpecs(e.target.value)}
                    placeholder="e.g., Kingpin Bore Ø42 ±0.015mm, Ra 1.6, Hardness 180-230 BHN"
                    className="field-input"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddPart(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={partSaving}
                  className="btn-dark hover:bg-[#F28C00]"
                >
                  <Plus className="w-4 h-4" />
                  <span>{partSaving ? 'Saving...' : 'Save Manufactured Part'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Manufactured Parts Table */}
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#5C6470] uppercase tracking-wider">
                  <th className="h-10 px-6">Part &amp; Drawing No.</th>
                  <th className="h-10 px-4">Part Name &amp; Customer</th>
                  <th className="h-10 px-4">Material &amp; Process</th>
                  <th className="h-10 px-4">Facility / Rev</th>
                  <th className="h-10 px-4">Specifications</th>
                  {isAdmin && <th className="h-10 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC]">
                {companyParts.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-12 px-6 text-center text-xs text-[#5C6470]">
                      No manufactured parts registered for {company.code} yet. Click &ldquo;Add Manufactured Part&rdquo; above to list the components produced for this company.
                    </td>
                  </tr>
                ) : (
                  companyParts.map((pt) => {
                    const isEditingThis = editingPartId === pt.id;
                    const isConfirmingDelete = confirmDeletePartId === pt.id;
                    return (
                      <React.Fragment key={pt.id}>
                        <tr className="hover:bg-[#F8F9FB] transition-colors">
                          <td className="py-4 px-6 whitespace-nowrap">
                            <p className="font-mono text-xs font-bold text-[#111318]">{pt.partNumber}</p>
                            {pt.drawingNumber && (
                              <p className="font-mono text-xs text-[#5C6470] mt-1">
                                Drg: {pt.drawingNumber}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-semibold text-[#111318]">{pt.partName}</p>
                            <p className="text-xs text-[#5C6470] mt-1">{pt.customer || company.name}</p>
                          </td>
                          <td className="py-4 px-4 text-xs text-[#111318]">
                            <p>{pt.materialGrade || '—'}</p>
                            {pt.processType && (
                              <p className="text-xs text-[#5C6470] mt-1">{pt.processType}</p>
                            )}
                          </td>
                          <td className="py-4 px-4 text-xs whitespace-nowrap">
                            <p className="font-medium text-[#111318]">{pt.facility}</p>
                            <p className="font-mono font-bold text-[#D97700] mt-1">{pt.currentRevision}</p>
                          </td>
                          <td className="py-4 px-4 text-xs text-[#5C6470] max-w-xs">
                            {pt.specifications || '—'}
                          </td>
                          {isAdmin && (
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  aria-label={`Edit part ${pt.partNumber}`}
                                  onClick={() =>
                                    isEditingThis ? setEditingPartId(null) : startEditPart(pt)
                                  }
                                  className="btn-compact border border-[#D5DAE1] bg-white hover:border-[#121417] text-[#111318]"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                {!isConfirmingDelete ? (
                                  <button
                                    type="button"
                                    aria-label={`Delete part ${pt.partNumber}`}
                                    onClick={() => {
                                      setEditingPartId(null);
                                      setConfirmDeletePartId(pt.id);
                                    }}
                                    className="btn-compact border border-red-200 bg-white text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                ) : (
                                  <div className="inline-flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={partSaving}
                                      aria-label={`Confirm delete part ${pt.partNumber}`}
                                      onClick={() => void handleDeletePartConfirm(pt)}
                                      className="btn-compact bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Confirm Delete
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeletePartId(null)}
                                      className="btn-compact border border-[#D5DAE1] bg-white text-[#5C6470]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>

                        {/* Inline Edit Part Row */}
                        {isAdmin && isEditingThis && (
                          <tr className="bg-[#FFF6EB]/60">
                            <td colSpan={6} className="p-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                  <label className="field-label">Part Number</label>
                                  <input
                                    type="text"
                                    value={editPartData.partNumber || ''}
                                    onChange={(e) =>
                                      setEditPartData((d) => ({ ...d, partNumber: e.target.value }))
                                    }
                                    className="field-input font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="field-label">Part Name</label>
                                  <input
                                    type="text"
                                    value={editPartData.partName || ''}
                                    onChange={(e) =>
                                      setEditPartData((d) => ({ ...d, partName: e.target.value }))
                                    }
                                    className="field-input"
                                  />
                                </div>
                                <div>
                                  <label className="field-label">Drawing No.</label>
                                  <input
                                    type="text"
                                    value={editPartData.drawingNumber || ''}
                                    onChange={(e) =>
                                      setEditPartData((d) => ({ ...d, drawingNumber: e.target.value }))
                                    }
                                    className="field-input font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="field-label">Revision</label>
                                  <input
                                    type="text"
                                    value={editPartData.currentRevision || ''}
                                    onChange={(e) =>
                                      setEditPartData((d) => ({ ...d, currentRevision: e.target.value }))
                                    }
                                    className="field-input font-mono"
                                  />
                                </div>
                                <div>
                                  <label className="field-label">Material Grade</label>
                                  <input
                                    type="text"
                                    value={editPartData.materialGrade || ''}
                                    onChange={(e) =>
                                      setEditPartData((d) => ({ ...d, materialGrade: e.target.value }))
                                    }
                                    className="field-input"
                                  />
                                </div>
                                <div>
                                  <label className="field-label">Process Type</label>
                                  <input
                                    type="text"
                                    value={editPartData.processType || ''}
                                    onChange={(e) =>
                                      setEditPartData((d) => ({ ...d, processType: e.target.value }))
                                    }
                                    className="field-input"
                                  />
                                </div>
                                <div className="lg:col-span-2">
                                  <label className="field-label">Specifications</label>
                                  <input
                                    type="text"
                                    value={editPartData.specifications || ''}
                                    onChange={(e) =>
                                      setEditPartData((d) => ({ ...d, specifications: e.target.value }))
                                    }
                                    className="field-input"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 mt-4">
                                <button
                                  type="button"
                                  onClick={() => setEditingPartId(null)}
                                  className="btn-secondary"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={partSaving}
                                  onClick={() => void handleSavePartEdit(pt.id)}
                                  className="btn-dark hover:bg-[#F28C00]"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>Save Part</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION C: Linked Change Requests (PCRFs) */}
      {(activeTab === 'all' || activeTab === 'pcrfs') && (
        <section className="surface-card overflow-hidden">
          <div className="surface-header flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#F28C00]" />
            <h3 className="text-sm font-bold text-[#111318]">
              Change Requests Linked to {company.code} ({companyPcrfs.length})
            </h3>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F8F9FB] border-b border-[#E4E7EC] text-[11px] font-semibold text-[#5C6470] uppercase tracking-wider">
                  <th className="h-10 px-6">PCRF No.</th>
                  <th className="h-10 px-4">Part Name &amp; No.</th>
                  <th className="h-10 px-4">Customer</th>
                  <th className="h-10 px-4">Stage</th>
                  <th className="h-10 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC]">
                {companyPcrfs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 px-6 text-center text-xs text-[#5C6470]">
                      No Change Requests raised for {company.code} yet.
                    </td>
                  </tr>
                ) : (
                  companyPcrfs.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => onOpenPCRF(p.id)}
                      className="hover:bg-[#FFF6EB]/50 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-6 font-mono text-xs font-bold text-[#D97700] whitespace-nowrap">
                        {p.pcrfNo}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-[#111318]">{p.form1.partName}</p>
                        <p className="font-mono text-xs text-[#5C6470] mt-1">{p.form1.partNo}</p>
                      </td>
                      <td className="py-4 px-4 text-xs text-[#5C6470]">{p.form1.customer}</td>
                      <td className="py-4 px-4 text-xs font-semibold text-[#111318]">
                        {p.currentStage}
                      </td>
                      <td className="py-4 px-6">
                        <StatusText status={p.overallStatus} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
