import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canApproveStageForRole,
  extractBearerToken,
  hashPassword,
  hasRequiredRole,
  RBAC_ROLES,
  signJwtToken,
  verifyJwtToken,
  verifyPassword,
} from './jwtRbac.ts';

test('signJwtToken and verifyJwtToken produce valid HS256 JWTs with company & role claims', () => {
  const token = signJwtToken(
    {
      id: 'u-co-1',
      employeeId: 'PUNE_HOD',
      username: 'pune_hod',
      name: 'R. Sundaram',
      role: 'HOD',
      department: 'Machine Shop',
      companyId: 'comp-pune',
      companyCode: 'SACL-PUNE',
      companyName: 'Sakthi Auto Pune Forgings Ltd.',
    },
    { secret: 'test-secret', nowSeconds: 1000, expiresInSeconds: 3600 },
  );

  assert.equal(token.split('.').length, 3);
  const res = verifyJwtToken(token, { secret: 'test-secret', nowSeconds: 2000 });
  assert.equal(res.valid, true);
  if (res.valid) {
    assert.equal(res.payload.role, 'HOD');
    assert.equal(res.payload.employeeId, 'PUNE_HOD');
    assert.equal(res.payload.companyId, 'comp-pune');
    assert.equal(res.payload.companyCode, 'SACL-PUNE');
  }
});

test('verifyJwtToken rejects tampered signatures, wrong secrets, and expired tokens', () => {
  const token = signJwtToken(
    {
      id: 'u-emp',
      employeeId: 'EMP101',
      name: 'R. Karthik',
      role: 'EMPLOYEE',
      department: 'Machine Shop',
    },
    { secret: 'secret-a', nowSeconds: 1000, expiresInSeconds: 60 },
  );

  // Tamper payload to elevate role to ADMIN
  const [h, , s] = token.split('.');
  const fakePayload = Buffer.from(
    JSON.stringify({ id: 'u-emp', role: 'ADMIN', exp: 999999 }),
  ).toString('base64url');
  const tampered = verifyJwtToken(`${h}.${fakePayload}.${s}`, {
    secret: 'secret-a',
    nowSeconds: 1010,
  });
  assert.equal(tampered.valid, false);

  // Wrong secret
  const wrongSecret = verifyJwtToken(token, { secret: 'secret-b', nowSeconds: 1010 });
  assert.equal(wrongSecret.valid, false);

  // Expired
  const expired = verifyJwtToken(token, { secret: 'secret-a', nowSeconds: 1061 });
  assert.equal(expired.valid, false);
});

test('hashPassword and verifyPassword securely validate scrypt hashes', () => {
  const hash = hashPassword('Pune@2026');
  assert.ok(hash.startsWith('scrypt$'));
  assert.notEqual(hash, 'Pune@2026');
  assert.equal(verifyPassword('Pune@2026', hash), true);
  assert.equal(verifyPassword('wrong-pass', hash), false);
});

test('RBAC role helpers and Bearer token extraction enforce strict role boundaries', () => {
  assert.equal(extractBearerToken('Bearer abc.def.ghi'), 'abc.def.ghi');
  assert.equal(extractBearerToken('Basic xyz'), null);

  assert.equal(hasRequiredRole('ADMIN', RBAC_ROLES.ADMIN_ONLY), true);
  assert.equal(hasRequiredRole('HOD', RBAC_ROLES.ADMIN_ONLY), false);
  assert.equal(hasRequiredRole('EMPLOYEE', RBAC_ROLES.PCRF_CREATORS), true);
  assert.equal(hasRequiredRole('CFT', RBAC_ROLES.PCRF_CREATORS), false);
  assert.equal(canApproveStageForRole('PLANT_HEAD', 'INTERNAL_APPROVAL'), true);
  assert.equal(canApproveStageForRole('EMPLOYEE', 'INTERNAL_APPROVAL'), false);
  assert.equal(hasRequiredRole('COMPANY_USER', RBAC_ROLES.PCRF_CREATORS), true);
  assert.equal(hasRequiredRole('COMPANY_USER', RBAC_ROLES.ADMIN_ONLY), false);
  assert.equal(canApproveStageForRole('COMPANY_USER', 'PCRF'), false);
});

test('COMPANY_USER JWT token retains companyId and updated password hash validates cleanly', () => {
  const token = signJwtToken(
    {
      id: 'u-comp-rep',
      employeeId: 'U1_REP',
      username: 'u1_rep',
      name: 'K. Arvind',
      role: 'COMPANY_USER',
      department: 'Machine Shop Unit I',
      companyId: 'comp-u1',
      companyCode: 'SACL-U1',
      companyName: 'Sakthi Auto Component Limited (Machine Shop Unit I)',
    },
    { secret: 'test-secret', nowSeconds: 2000, expiresInSeconds: 3600 },
  );
  const res = verifyJwtToken(token, { secret: 'test-secret', nowSeconds: 2500 });
  assert.equal(res.valid, true);
  if (res.valid) {
    assert.equal(res.payload.role, 'COMPANY_USER');
    assert.equal(res.payload.companyId, 'comp-u1');
    assert.equal(res.payload.companyCode, 'SACL-U1');
  }

  const oldHash = hashPassword('pass1234');
  const newHash = hashPassword('newpass99');
  assert.equal(verifyPassword('pass1234', oldHash), true);
  assert.equal(verifyPassword('pass1234', newHash), false);
  assert.equal(verifyPassword('newpass99', newHash), true);
});
