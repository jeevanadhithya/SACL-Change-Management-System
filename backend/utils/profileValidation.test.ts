import test from 'node:test';
import assert from 'node:assert/strict';
import type { UserAccount } from '../../frontend/src/types/pcms.ts';
import {
  deriveAvatarInitials,
  sanitizeProfileUpdate,
  validateSelfPasswordChange,
} from './profileValidation.ts';

const sampleUser: UserAccount = {
  id: 'u-emp',
  employeeId: 'EMP101',
  username: 'EMP101',
  name: 'R. Karthik',
  email: 'karthik.r@sakthiauto.com',
  phone: '+91 98422 10101',
  role: 'EMPLOYEE',
  department: 'Machine Shop',
  title: 'Senior Process Engineer',
  facility: 'Machine Shop',
  plantLocation: 'Pollachi Plant I, Tamil Nadu',
  bio: 'CNC Machining & Process Control',
  avatarInitials: 'RK',
  emailNotifications: true,
  inAppNotifications: true,
  active: true,
};

test('deriveAvatarInitials generates clean 2-letter uppercase monograms', () => {
  assert.equal(deriveAvatarInitials('R. Karthik'), 'RK');
  assert.equal(deriveAvatarInitials('V. Balasubramanian'), 'VB');
  assert.equal(deriveAvatarInitials('M. Senthil Kumar'), 'MK');
  assert.equal(deriveAvatarInitials('Karthik'), 'KA');
});

test('sanitizeProfileUpdate validates inputs and strips privilege escalation fields', () => {
  const res = sanitizeProfileUpdate(sampleUser, {
    name: 'R. Karthik S.',
    email: 'karthik.lead@sakthiauto.com',
    phone: '+91 98422 99887',
    department: 'Machine Shop Unit I',
    title: 'Lead Process Engineer',
    facility: 'Machine Shop',
    plantLocation: 'Pollachi Unit I, TN',
    bio: 'Leads VMC & CNC boring process improvements.',
    avatarInitials: 'rks!',
    emailNotifications: false,
    inAppNotifications: true,
    // Attempted privilege escalation fields must not appear on sanitized output
    role: 'ADMIN',
    active: false,
    companyId: 'comp-hack',
    employeeId: 'ADM001',
  });

  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.fields.name, 'R. Karthik S.');
    assert.equal(res.fields.email, 'karthik.lead@sakthiauto.com');
    assert.equal(res.fields.avatarInitials, 'RKS');
    assert.equal(res.fields.emailNotifications, false);
    assert.equal('role' in res.fields, false);
    assert.equal('active' in res.fields, false);
    assert.equal('companyId' in res.fields, false);
  }
});

test('sanitizeProfileUpdate rejects invalid emails and empty names', () => {
  const badEmail = sanitizeProfileUpdate(sampleUser, { email: 'not-an-email' });
  assert.equal(badEmail.ok, false);

  const badName = sanitizeProfileUpdate(sampleUser, { name: 'A' });
  assert.equal(badName.ok, false);

  const badFacility = sanitizeProfileUpdate(sampleUser, { facility: 'InvalidPlant' });
  assert.equal(badFacility.ok, false);
});

test('validateSelfPasswordChange enforces current password, min length, and difference', () => {
  assert.equal(validateSelfPasswordChange({ currentPassword: '', newPassword: 'abcd' }).ok, false);
  assert.equal(validateSelfPasswordChange({ currentPassword: 'old1', newPassword: '123' }).ok, false);
  assert.equal(validateSelfPasswordChange({ currentPassword: 'same1', newPassword: 'same1' }).ok, false);

  const okRes = validateSelfPasswordChange({ currentPassword: 'password123', newPassword: 'newpass99' });
  assert.equal(okRes.ok, true);
});
