import type { UserAccount } from '../../frontend/src/types/pcms.ts';

const VALID_FACILITIES: Array<UserAccount['facility']> = [
  'Foundry',
  'Machine Shop',
  'Corporate',
  'Quality',
];

export interface SelfProfileUpdateInput {
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
}

export interface SanitizedProfileFields {
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
}

export function deriveAvatarInitials(name: string): string {
  const cleaned = (name || '').trim();
  if (!cleaned) return 'SA';
  const parts = cleaned
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'SA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function sanitizeProfileUpdate(
  existing: UserAccount,
  rawInput: Record<string, unknown>,
): { ok: true; fields: SanitizedProfileFields } | { ok: false; error: string } {
  const input = rawInput as SelfProfileUpdateInput;

  const nextName =
    input.name !== undefined ? String(input.name).trim() : existing.name;
  if (!nextName || nextName.length < 2) {
    return { ok: false, error: 'Full Name must be at least 2 characters long.' };
  }
  if (nextName.length > 150) {
    return { ok: false, error: 'Full Name cannot exceed 150 characters.' };
  }

  const nextEmail =
    input.email !== undefined ? String(input.email).trim() : existing.email;
  if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  const nextPhone =
    input.phone !== undefined ? String(input.phone).trim() : existing.phone || '';
  if (nextPhone.length > 32) {
    return { ok: false, error: 'Phone number cannot exceed 32 characters.' };
  }

  const nextDepartment =
    input.department !== undefined
      ? String(input.department).trim()
      : existing.department;
  if (!nextDepartment) {
    return { ok: false, error: 'Department cannot be empty.' };
  }

  const nextTitle =
    input.title !== undefined ? String(input.title).trim() : existing.title;
  if (!nextTitle) {
    return { ok: false, error: 'Designation / Job Title cannot be empty.' };
  }

  const nextFacility =
    input.facility !== undefined
      ? (String(input.facility) as UserAccount['facility'])
      : existing.facility;
  if (!VALID_FACILITIES.includes(nextFacility)) {
    return {
      ok: false,
      error: 'Facility must be Foundry, Machine Shop, Quality, or Corporate.',
    };
  }

  const nextPlantLocation =
    input.plantLocation !== undefined
      ? String(input.plantLocation).trim().slice(0, 150)
      : existing.plantLocation || '';

  const nextBio =
    input.bio !== undefined
      ? String(input.bio).trim().slice(0, 500)
      : existing.bio || '';

  const rawInitials =
    input.avatarInitials !== undefined
      ? String(input.avatarInitials)
          .replace(/[^a-zA-Z0-9]/g, '')
          .toUpperCase()
          .slice(0, 3)
      : existing.avatarInitials || '';
  const nextAvatarInitials = rawInitials || deriveAvatarInitials(nextName);

  const nextEmailNotif =
    typeof input.emailNotifications === 'boolean'
      ? input.emailNotifications
      : existing.emailNotifications ?? true;

  const nextInAppNotif =
    typeof input.inAppNotifications === 'boolean'
      ? input.inAppNotifications
      : existing.inAppNotifications ?? true;

  return {
    ok: true,
    fields: {
      name: nextName,
      email: nextEmail,
      phone: nextPhone,
      department: nextDepartment,
      title: nextTitle,
      facility: nextFacility,
      plantLocation: nextPlantLocation,
      bio: nextBio,
      avatarInitials: nextAvatarInitials,
      emailNotifications: nextEmailNotif,
      inAppNotifications: nextInAppNotif,
    },
  };
}

export function validateSelfPasswordChange(params: {
  currentPassword?: string;
  newPassword?: string;
}): { ok: true; currentPassword: string; newPassword: string } | { ok: false; error: string } {
  const current = (params.currentPassword || '').trim();
  const next = (params.newPassword || '').trim();

  if (!current) {
    return { ok: false, error: 'Current password is required.' };
  }
  if (next.length < 4) {
    return { ok: false, error: 'New password must be at least 4 characters long.' };
  }
  if (next === current) {
    return { ok: false, error: 'New password must be different from your current password.' };
  }
  return { ok: true, currentPassword: current, newPassword: next };
}
