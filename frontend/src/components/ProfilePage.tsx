import React, { useEffect, useState } from 'react';
import {
  Building2,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  User,
} from 'lucide-react';
import type { UserAccount } from '../types/pcms';
import { RoleDisplayLabel } from './ui/StatusBadge';

interface ProfilePageProps {
  user: UserAccount;
  onUpdateProfile: (payload: {
    name: string;
    email: string;
    phone: string;
    department: string;
    title: string;
    facility: UserAccount['facility'];
    plantLocation: string;
    bio: string;
    avatarInitials: string;
    emailNotifications: boolean;
    inAppNotifications: boolean;
  }) => Promise<UserAccount>;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const FACILITIES: Array<UserAccount['facility']> = [
  'Machine Shop',
  'Foundry',
  'Quality',
  'Corporate',
];

function computeInitials(name: string, custom?: string): string {
  const cleanedCustom = (custom || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3);
  if (cleanedCustom) return cleanedCustom;
  const parts = (name || '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'SA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ProfilePage({ user, onUpdateProfile, onChangePassword }: ProfilePageProps) {
  // Editable personal & work profile state
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '');
  const [title, setTitle] = useState(user.title);
  const [department, setDepartment] = useState(user.department);
  const [facility, setFacility] = useState<UserAccount['facility']>(user.facility);
  const [plantLocation, setPlantLocation] = useState(user.plantLocation || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarInitials, setAvatarInitials] = useState(
    user.avatarInitials || computeInitials(user.name),
  );
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications ?? true);
  const [inAppNotifications, setInAppNotifications] = useState(user.inAppNotifications ?? true);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileBanner, setProfileBanner] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  // Self-service password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordBanner, setPasswordBanner] = useState<{
    type: 'error' | 'success';
    text: string;
  } | null>(null);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setTitle(user.title);
    setDepartment(user.department);
    setFacility(user.facility);
    setPlantLocation(user.plantLocation || '');
    setBio(user.bio || '');
    setAvatarInitials(user.avatarInitials || computeInitials(user.name));
    setEmailNotifications(user.emailNotifications ?? true);
    setInAppNotifications(user.inAppNotifications ?? true);
  }, [user]);

  const previewInitials = computeInitials(name, avatarInitials);

  function handleResetForm() {
    setName(user.name);
    setEmail(user.email);
    setPhone(user.phone || '');
    setTitle(user.title);
    setDepartment(user.department);
    setFacility(user.facility);
    setPlantLocation(user.plantLocation || '');
    setBio(user.bio || '');
    setAvatarInitials(user.avatarInitials || computeInitials(user.name));
    setEmailNotifications(user.emailNotifications ?? true);
    setInAppNotifications(user.inAppNotifications ?? true);
    setProfileBanner(null);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileBanner(null);

    if (name.trim().length < 2) {
      setProfileBanner({ type: 'error', text: 'Full Name must be at least 2 characters long.' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setProfileBanner({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (!department.trim() || !title.trim()) {
      setProfileBanner({
        type: 'error',
        text: 'Department and Designation / Job Title are required.',
      });
      return;
    }

    setProfileSaving(true);
    try {
      await onUpdateProfile({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        department: department.trim(),
        title: title.trim(),
        facility,
        plantLocation: plantLocation.trim(),
        bio: bio.trim(),
        avatarInitials: avatarInitials.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3),
        emailNotifications,
        inAppNotifications,
      });
      setProfileBanner({
        type: 'success',
        text: 'Your profile details have been updated and saved to the database.',
      });
    } catch (err) {
      setProfileBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save profile details.',
      });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordBanner(null);

    if (!currentPassword.trim()) {
      setPasswordBanner({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.trim().length < 4) {
      setPasswordBanner({
        type: 'error',
        text: 'New password must be at least 4 characters long.',
      });
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setPasswordBanner({
        type: 'error',
        text: 'New password and confirmation do not match.',
      });
      return;
    }
    if (newPassword.trim() === currentPassword.trim()) {
      setPasswordBanner({
        type: 'error',
        text: 'New password must be different from your current password.',
      });
      return;
    }

    setPasswordSaving(true);
    try {
      await onChangePassword(currentPassword.trim(), newPassword.trim());
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordBanner({
        type: 'success',
        text: 'Password updated successfully. Use your new password on your next sign-in.',
      });
    } catch (err) {
      setPasswordBanner({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to update password.',
      });
    } finally {
      setPasswordSaving(false);
    }
  }

  const formattedUpdatedAt = user.updatedAt
    ? new Date(user.updatedAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Not updated yet';

  return (
    <div className="space-y-6">
      {/* Top Profile Identity Header */}
      <section className="surface-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div
              aria-label="Profile initials preview"
              className="w-16 h-16 rounded-xl bg-[#121417] text-[#F28C00] flex items-center justify-center text-xl font-extrabold tracking-wide shrink-0 font-mono"
            >
              {previewInitials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C6470]">
                <span className="font-mono font-bold text-[#D97700]">
                  {user.username || user.employeeId}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#111318]">{RoleDisplayLabel(user.role)}</span>
                <span aria-hidden="true">·</span>
                <span>{user.facility}</span>
                {user.companyCode && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono font-semibold text-[#111318]">
                      {user.companyCode}
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-xl leading-7 font-extrabold text-[#111318] mt-1 truncate">
                {name || user.name}
              </h2>
              <p className="text-xs text-[#5C6470] mt-1 truncate">
                {title || user.title} — {department || user.department}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs text-[#5C6470]">
                <span className="inline-flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#8A94A6]" />
                  <span>{email || user.email}</span>
                </span>
                {phone && (
                  <span className="inline-flex items-center gap-2 font-mono tabular-nums">
                    <Phone className="w-4 h-4 text-[#8A94A6]" />
                    <span>{phone}</span>
                  </span>
                )}
                {plantLocation && (
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#8A94A6]" />
                    <span>{plantLocation}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col md:items-end gap-x-6 gap-y-2 pt-4 md:pt-0 border-t md:border-t-0 border-[#E4E7EC] shrink-0 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#5C6470]">Account Status:</span>
              <span className="font-bold text-emerald-700">
                {user.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#5C6470]">Last Updated:</span>
              <span className="font-mono tabular-nums text-[#111318]">{formattedUpdatedAt}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two-Column Customization Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left 2 Columns: Personal & Work Details Customization */}
        <section className="xl:col-span-2 surface-card overflow-hidden">
          <div className="surface-header flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#FFF6EB] text-[#D97700] flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#111318]">Personal &amp; Work Profile</h3>
                <p className="text-xs text-[#5C6470] mt-1">
                  Customize your display name, contact information, plant location, and workflow preferences.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
            {profileBanner && (
              <div
                role={profileBanner.type === 'error' ? 'alert' : 'status'}
                className={`px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
                  profileBanner.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {profileBanner.type === 'success' && <Check className="w-4 h-4 shrink-0" />}
                <span>{profileBanner.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="profile-full-name" className="field-label">
                  Full Name *
                </label>
                <input
                  id="profile-full-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="profile-email" className="field-label">
                  Work Email Address *
                </label>
                <input
                  id="profile-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@sakthiauto.com"
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="profile-phone" className="field-label">
                  Phone / Mobile Number
                </label>
                <input
                  id="profile-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98422 00000"
                  className="field-input font-mono tabular-nums"
                />
              </div>

              <div>
                <label htmlFor="profile-initials" className="field-label">
                  Avatar Monogram Initials (up to 3 chars)
                </label>
                <input
                  id="profile-initials"
                  type="text"
                  maxLength={3}
                  value={avatarInitials}
                  onChange={(e) =>
                    setAvatarInitials(
                      e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 3),
                    )
                  }
                  placeholder="e.g., RK"
                  className="field-input font-mono uppercase"
                />
              </div>

              <div>
                <label htmlFor="profile-title" className="field-label">
                  Designation / Job Title *
                </label>
                <input
                  id="profile-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Senior Process Engineer"
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="profile-department" className="field-label">
                  Department *
                </label>
                <input
                  id="profile-department"
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., Machine Shop"
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="profile-facility" className="field-label">
                  Primary Facility
                </label>
                <select
                  id="profile-facility"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value as UserAccount['facility'])}
                  className="field-input"
                >
                  {FACILITIES.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="profile-location" className="field-label">
                  Plant / Office Location
                </label>
                <input
                  id="profile-location"
                  type="text"
                  value={plantLocation}
                  onChange={(e) => setPlantLocation(e.target.value)}
                  placeholder="e.g., Pollachi Machine Shop Unit I, TN"
                  className="field-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="profile-bio" className="field-label">
                Role Scope &amp; Engineering Notes
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Describe your manufacturing area, CFT responsibilities, or approval scope..."
                className="field-textarea resize-none"
              />
              <p className="text-[11px] text-[#5C6470] mt-2 text-right font-mono tabular-nums">
                {bio.length} / 500
              </p>
            </div>

            {/* Notification Preferences */}
            <div className="pt-6 border-t border-[#E4E7EC] space-y-4">
              <p className="text-xs font-bold text-[#111318]">Notification Preferences</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  htmlFor="pref-email-notif"
                  className="flex items-start gap-4 p-4 rounded-lg bg-[#F8F9FB] cursor-pointer"
                >
                  <input
                    id="pref-email-notif"
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="mt-1 accent-[#F28C00] w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="block text-xs font-bold text-[#111318]">
                      Email Workflow Alerts
                    </span>
                    <span className="block text-[11px] text-[#5C6470] mt-1 leading-4">
                      Receive summaries when PCRFs or stage sign-offs require your review.
                    </span>
                  </div>
                </label>

                <label
                  htmlFor="pref-inapp-notif"
                  className="flex items-start gap-4 p-4 rounded-lg bg-[#F8F9FB] cursor-pointer"
                >
                  <input
                    id="pref-inapp-notif"
                    type="checkbox"
                    checked={inAppNotifications}
                    onChange={(e) => setInAppNotifications(e.target.checked)}
                    className="mt-1 accent-[#F28C00] w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="block text-xs font-bold text-[#111318]">
                      In-App Portal Notifications
                    </span>
                    <span className="block text-[11px] text-[#5C6470] mt-1 leading-4">
                      Display live stage handoffs, returns, and PPAP updates in the portal bell.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E4E7EC] flex flex-wrap items-center justify-end gap-4">
              <button
                type="button"
                onClick={handleResetForm}
                disabled={profileSaving}
                className="btn-secondary"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Changes</span>
              </button>
              <button
                type="submit"
                disabled={profileSaving}
                className="btn-primary"
              >
                <Save className="w-4 h-4" />
                <span>{profileSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Right Column: Security & Read-Only RBAC Identity */}
        <div className="space-y-6">
          {/* Self-Service Change Password Card */}
          <section className="surface-card overflow-hidden">
            <div className="surface-header flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#F28C00] shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-[#111318]">Change My Password</h3>
                  <p className="text-xs text-[#5C6470] mt-1">
                    Verify your current password before setting a new one.
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label={showPasswords ? 'Hide password fields' : 'Show password fields'}
                onClick={() => setShowPasswords((v) => !v)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#5C6470] hover:text-[#111318] hover:bg-[#F4F5F7] cursor-pointer shrink-0"
              >
                {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <form onSubmit={handleSavePassword} className="p-6 space-y-4">
              {passwordBanner && (
                <div
                  role={passwordBanner.type === 'error' ? 'alert' : 'status'}
                  className={`px-4 py-2 rounded-lg border text-xs font-semibold ${
                    passwordBanner.type === 'error'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}
                >
                  {passwordBanner.text}
                </div>
              )}

              <div>
                <label htmlFor="profile-current-password" className="field-label">
                  Current Password *
                </label>
                <input
                  id="profile-current-password"
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="profile-new-password" className="field-label">
                  New Password * (min 4 chars)
                </label>
                <input
                  id="profile-new-password"
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="field-input"
                />
              </div>

              <div>
                <label htmlFor="profile-confirm-password" className="field-label">
                  Confirm New Password *
                </label>
                <input
                  id="profile-confirm-password"
                  type={showPasswords ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="field-input"
                />
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full btn-dark"
              >
                <KeyRound className="w-4 h-4" />
                <span>{passwordSaving ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </form>
          </section>

          {/* Read-Only Account & RBAC Scope Card */}
          <section className="surface-card overflow-hidden">
            <div className="surface-header flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#F28C00] shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-[#111318]">Account Access Scope</h3>
                <p className="text-xs text-[#5C6470] mt-1">Managed by System Administrator</p>
              </div>
            </div>
            <dl className="divide-y divide-[#E4E7EC] text-xs">
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <dt className="text-[#5C6470]">Employee ID</dt>
                <dd className="font-mono font-bold text-[#111318]">{user.employeeId}</dd>
              </div>
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <dt className="text-[#5C6470]">Login Username</dt>
                <dd className="font-mono font-semibold text-[#111318]">
                  {user.username || user.employeeId}
                </dd>
              </div>
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <dt className="text-[#5C6470]">JWT Access Role</dt>
                <dd className="font-bold text-[#D97700]">{RoleDisplayLabel(user.role)}</dd>
              </div>
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <dt className="text-[#5C6470] inline-flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#8A94A6]" />
                  <span>Assigned Company</span>
                </dt>
                <dd className="font-semibold text-[#111318] text-right truncate max-w-[180px]">
                  {user.companyName || 'Sakthi Auto Corporate'}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
