import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import type {
  ChangeRequestRecord,
  CompanyRecord,
  FormIdentifier,
  UserAccount,
  UserRole,
} from '../frontend/src/types/pcms.ts';
import {
  applyWorkflowDecision,
  canAdvancePTRStage,
  canUserApproveStage,
  syncInterconnectedFields,
} from '../frontend/src/utils/workflow.ts';
import {
  buildSeedDatabase,
  createBlankChangeRequest,
  type DatabaseSchema,
} from './previewSeedData.ts';
import {
  extractBearerToken,
  hashPassword,
  hasRequiredRole,
  RBAC_ROLES,
  signJwtToken,
  verifyJwtToken,
  verifyPassword,
  type JwtPayload,
} from './utils/jwtRbac.ts';
import {
  sanitizeProfileUpdate,
  validateSelfPasswordChange,
} from './utils/profileValidation.ts';

interface AuthenticatedRequest extends express.Request {
  authUser?: JwtPayload;
}

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sacl-db.json');

function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = buildSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    const initial = buildSeedDatabase();
    return {
      companies: Array.isArray(parsed.companies) ? parsed.companies : [],
      users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : initial.users,
      departments: Array.isArray(parsed.departments) ? parsed.departments : [],
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      parts: Array.isArray(parsed.parts) ? parsed.parts : [],
      pcrfs: Array.isArray(parsed.pcrfs) ? parsed.pcrfs : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
    };
  } catch {
    const initial = buildSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function saveDatabase(db: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function enrichUser(user: UserAccount, companies: CompanyRecord[]): Omit<UserAccount, 'password'> {
  const { password: _removed, ...rest } = user;
  const linkedCompany = rest.companyId
    ? companies.find((c) => c.id === rest.companyId)
    : undefined;
  return {
    ...rest,
    companyId: linkedCompany?.id ?? rest.companyId ?? null,
    companyCode: linkedCompany?.code ?? rest.companyCode ?? null,
    companyName: linkedCompany
      ? `${linkedCompany.name} (${linkedCompany.unitName})`
      : rest.companyName ?? null,
  };
}

function mapFacilityFromCompany(
  facilityType?: CompanyRecord['facilityType'],
): UserAccount['facility'] {
  if (facilityType === 'Foundry') return 'Foundry';
  if (facilityType === 'Corporate') return 'Corporate';
  return 'Machine Shop';
}

function requireJwtAuth(
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction,
) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: 'Authentication token is required. Please sign in.' });
    return;
  }
  const verified = verifyJwtToken(token);
  if (!verified.valid) {
    res.status(401).json({ error: verified.error });
    return;
  }
  req.authUser = verified.payload;
  next();
}

function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }
    if (!hasRequiredRole(req.authUser.role, allowedRoles)) {
      res.status(403).json({
        error: `Access denied. Role ${req.authUser.role} is not authorized for this action.`,
      });
      return;
    }
    next();
  };
}

function createCompanyAccountInDb(
  db: DatabaseSchema,
  company: CompanyRecord | null,
  payload: {
    username?: string;
    employeeId?: string;
    name?: string;
    email?: string;
    password?: string;
    role?: UserRole;
    department?: string;
    title?: string;
    facility?: UserAccount['facility'];
  },
): { ok: true; user: UserAccount } | { ok: false; error: string } {
  const rawLogin = (payload.username || payload.employeeId || '').trim();
  const fullName = (payload.name || '').trim();
  const rawPassword = (payload.password || '').trim();

  if (!rawLogin || !fullName) {
    return { ok: false, error: 'Username / Employee ID and Full Name are required.' };
  }
  if (!rawPassword || rawPassword.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters long.' };
  }

  const normalizedLogin = rawLogin.toUpperCase();
  const duplicate = db.users.some(
    (u) =>
      u.employeeId.toUpperCase() === normalizedLogin ||
      (u.username && u.username.toUpperCase() === normalizedLogin),
  );
  if (duplicate) {
    return { ok: false, error: `Username / Employee ID "${rawLogin}" is already registered.` };
  }

  const validRoles = RBAC_ROLES.ALL_AUTHENTICATED;
  const defaultRole: UserRole = company ? 'COMPANY_USER' : 'EMPLOYEE';
  const role: UserRole = payload.role && validRoles.includes(payload.role) ? payload.role : defaultRole;

  const newUser: UserAccount = {
    id: `u-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    employeeId: normalizedLogin,
    username: rawLogin,
    name: fullName,
    email:
      payload.email?.trim() ||
      `${rawLogin.toLowerCase().replace(/[^a-z0-9._-]/g, '')}@sakthiauto.com`,
    role,
    department: payload.department?.trim() || (company ? company.unitName : 'Machine Shop'),
    title: payload.title?.trim() || (company ? `${company.code} ${role}` : 'Engineer'),
    facility: payload.facility || mapFacilityFromCompany(company?.facilityType),
    companyId: company?.id ?? null,
    companyCode: company?.code ?? null,
    companyName: company ? `${company.name} (${company.unitName})` : null,
    active: true,
    password: hashPassword(rawPassword),
  };

  db.users.push(newUser);
  return { ok: true, user: newUser };
}

function handleSaveForm(
  req: AuthenticatedRequest,
  res: express.Response,
  formKey: FormIdentifier,
) {
  const db = loadDatabase();
  const idx = db.pcrfs.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Change request not found.' });
    return;
  }

  const { data } = req.body as {
    data: ChangeRequestRecord[FormIdentifier];
  };

  if (formKey === 'form6') {
    const ptrData = data as ChangeRequestRecord['form6'];
    const ptr2Attempted =
      ptrData.ptr2.productionRunDate !== '' || ptrData.ptr2.sampleStatus !== 'Pending';
    if (ptr2Attempted) {
      const gate2 = canAdvancePTRStage(ptrData, 'ptr2');
      if (!gate2.allowed) {
        res.status(400).json({ error: gate2.reason });
        return;
      }
    }
    const ptr3Attempted =
      ptrData.ptr3.productionRunDate !== '' || ptrData.ptr3.sampleStatus !== 'Pending';
    if (ptr3Attempted) {
      const gate3 = canAdvancePTRStage(ptrData, 'ptr3');
      if (!gate3.allowed) {
        res.status(400).json({ error: gate3.reason });
        return;
      }
    }
  }

  const actorName = req.authUser?.name || 'System User';
  const actorRole = req.authUser?.role || 'CFT';

  const existing = db.pcrfs[idx];
  let updated: ChangeRequestRecord = {
    ...existing,
    [formKey]: data,
    updatedAt: new Date().toISOString().slice(0, 10),
  };

  if (formKey === 'form1') {
    updated = syncInterconnectedFields(updated);
  }

  updated.activityHistory = [
    {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorName,
      actorRole,
      action: `Updated ${formKey.toUpperCase()} data`,
      stage: existing.currentStage,
    },
    ...updated.activityHistory,
  ];

  db.pcrfs[idx] = updated;
  saveDatabase(db);
  res.json({ pcrf: updated });
}

async function startServer() {
  delete process.env.REACT_APP_API_URL;
  delete process.env.VITE_API_URL;

  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'sakthi-auto-pcms', auth: 'JWT-HS256-RBAC' });
  });

  // Public Database Accounts Directory for Role-Based Portal Access on Login Screen
  // Returns strictly safe display metadata (never passwords/hashes) directly from live DB
  app.get('/api/auth/portal-accounts', (_req, res) => {
    const db = loadDatabase();
    const roleOrder: Record<UserRole, number> = {
      EMPLOYEE: 1,
      HOD: 2,
      HOF: 3,
      COF: 4,
      CFT: 5,
      CFT_LEADER: 6,
      PLANT_HEAD: 7,
      ADMIN: 8,
      COMPANY_USER: 9,
    };

    const accounts = db.users
      .filter((u) => u.active)
      .sort((a, b) => {
        const rankDiff = (roleOrder[a.role] ?? 99) - (roleOrder[b.role] ?? 99);
        if (rankDiff !== 0) return rankDiff;
        return (a.username || a.employeeId).localeCompare(b.username || b.employeeId);
      })
      .map((u) => {
        const company = u.companyId ? db.companies.find((c) => c.id === u.companyId) : null;
        return {
          id: u.id,
          employeeId: u.employeeId,
          username: u.username || u.employeeId,
          name: u.name,
          role: u.role,
          companyCode: company?.code ?? u.companyCode ?? null,
        };
      });

    res.json({ accounts });
  });

  // Public Authentication: Login by Employee ID or Company Username + Password -> HS256 JWT
  app.post('/api/auth/login', (req, res) => {
    const { employeeId, username, password } = req.body as {
      employeeId?: string;
      username?: string;
      password?: string;
    };
    const identifier = (employeeId || username || '').trim();
    if (!identifier || !password) {
      res.status(400).json({ error: 'Username / Employee ID and Password are required.' });
      return;
    }

    const db = loadDatabase();
    const normalized = identifier.toUpperCase();
    const user = db.users.find(
      (u) =>
        u.active &&
        (u.employeeId.toUpperCase() === normalized ||
          (u.username && u.username.toUpperCase() === normalized)),
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid Username / Employee ID or inactive account.' });
      return;
    }

    if (!verifyPassword(password, user.password)) {
      res.status(401).json({ error: 'Incorrect password. Please try again.' });
      return;
    }

    const safeUser = enrichUser(user, db.companies);
    const token = signJwtToken(safeUser);
    res.json({ user: safeUser, token });
  });

  // Validate active JWT session & return fresh user + role + company context
  app.get('/api/auth/me', requireJwtAuth, (req: AuthenticatedRequest, res) => {
    const db = loadDatabase();
    const found = db.users.find((u) => u.id === req.authUser?.id && u.active);
    if (!found) {
      res.status(401).json({ error: 'Account no longer active. Please sign in again.' });
      return;
    }
    res.json({ user: enrichUser(found, db.companies), claims: req.authUser });
  });

  // Self-service Profile Customization: Any authenticated user can update ONLY their own profile fields
  app.put('/api/auth/profile', requireJwtAuth, (req: AuthenticatedRequest, res) => {
    const db = loadDatabase();
    const idx = db.users.findIndex((u) => u.id === req.authUser?.id && u.active);
    if (idx === -1) {
      res.status(404).json({ error: 'Active user profile not found.' });
      return;
    }

    const existing = db.users[idx];
    const validated = sanitizeProfileUpdate(existing, (req.body || {}) as Record<string, unknown>);
    if (!validated.ok) {
      res.status(400).json({ error: validated.error });
      return;
    }

    const nowIso = new Date().toISOString();
    const updated: UserAccount = {
      ...existing,
      ...validated.fields,
      updatedAt: nowIso,
    };

    db.users[idx] = updated;
    db.auditLogs.unshift({
      id: `al-${Date.now()}`,
      timestamp: nowIso,
      actorId: updated.employeeId,
      actorName: updated.name,
      actorRole: updated.role,
      entityType: 'UserProfile',
      entityId: updated.employeeId,
      action: 'UPDATED_OWN_PROFILE',
      details: `${updated.name} (${updated.employeeId}) updated personal profile details.`,
    });

    saveDatabase(db);
    const safeUser = enrichUser(updated, db.companies);
    const freshToken = signJwtToken(safeUser);
    res.json({ user: safeUser, token: freshToken });
  });

  // Self-service Password Change: Requires verifying current password
  app.put('/api/auth/password', requireJwtAuth, (req: AuthenticatedRequest, res) => {
    const db = loadDatabase();
    const idx = db.users.findIndex((u) => u.id === req.authUser?.id && u.active);
    if (idx === -1) {
      res.status(404).json({ error: 'Active user account not found.' });
      return;
    }

    const { currentPassword, newPassword } = (req.body || {}) as {
      currentPassword?: string;
      newPassword?: string;
    };
    const check = validateSelfPasswordChange({ currentPassword, newPassword });
    if (!check.ok) {
      res.status(400).json({ error: check.error });
      return;
    }

    const existing = db.users[idx];
    if (!verifyPassword(check.currentPassword, existing.password)) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const nowIso = new Date().toISOString();
    db.users[idx] = {
      ...existing,
      password: hashPassword(check.newPassword),
      updatedAt: nowIso,
    };

    db.auditLogs.unshift({
      id: `al-${Date.now()}`,
      timestamp: nowIso,
      actorId: existing.employeeId,
      actorName: existing.name,
      actorRole: existing.role,
      entityType: 'UserProfile',
      entityId: existing.employeeId,
      action: 'CHANGED_OWN_PASSWORD',
      details: `${existing.name} (${existing.employeeId}) changed their account password.`,
    });

    saveDatabase(db);
    res.json({ ok: true, user: enrichUser(db.users[idx], db.companies) });
  });

  // Users CRUD — Admin only for listing/creating/toggling accounts
  app.get('/api/users', requireJwtAuth, requireRoles('ADMIN'), (_req, res) => {
    const db = loadDatabase();
    const safeUsers = db.users.map((u) => enrichUser(u, db.companies));
    res.json({ users: safeUsers });
  });

  app.post('/api/users', requireJwtAuth, requireRoles('ADMIN'), (req: AuthenticatedRequest, res) => {
    const db = loadDatabase();
    const payload = req.body as {
      username?: string;
      employeeId?: string;
      name?: string;
      email?: string;
      password?: string;
      role?: UserRole;
      department?: string;
      title?: string;
      facility?: UserAccount['facility'];
      companyId?: string | null;
    };

    const company = payload.companyId
      ? db.companies.find((c) => c.id === payload.companyId) || null
      : null;

    const result = createCompanyAccountInDb(db, company, {
      ...payload,
      password: payload.password || 'password123',
    });
    if (!result.ok) {
      res.status(400).json({ error: result.error });
      return;
    }

    db.auditLogs.unshift({
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: req.authUser?.employeeId || 'ADMIN',
      actorName: req.authUser?.name || 'Administrator',
      actorRole: req.authUser?.role || 'ADMIN',
      entityType: 'User',
      entityId: result.user.employeeId,
      action: 'CREATED_USER_ACCOUNT',
      details: `Created ${result.user.role} account "${result.user.username || result.user.employeeId}"${
        company ? ` for ${company.code} (${company.name})` : ''
      }.`,
    });

    saveDatabase(db);
    res.status(201).json({ user: enrichUser(result.user, db.companies) });
  });

  // Admin: Update existing user details (name, email, role, department, title, facility, active, companyId)
  app.put('/api/users/:id', requireJwtAuth, requireRoles('ADMIN'), (req: AuthenticatedRequest, res) => {
    const db = loadDatabase();
    const idx = db.users.findIndex((u) => u.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const existing = db.users[idx];
    const body = req.body as Partial<UserAccount>;

    if (body.role && !RBAC_ROLES.ALL_AUTHENTICATED.includes(body.role)) {
      res.status(400).json({ error: `Invalid role "${body.role}".` });
      return;
    }

    // Prevent admin from deactivating or demoting themselves
    if (existing.id === req.authUser?.id) {
      if (body.active === false) {
        res.status(400).json({ error: 'You cannot deactivate your own active Administrator account.' });
        return;
      }
      if (body.role && body.role !== 'ADMIN') {
        res.status(400).json({ error: 'You cannot remove Administrator role from your own account.' });
        return;
      }
    }

    const nextCompanyId =
      body.companyId !== undefined ? body.companyId || null : existing.companyId ?? null;
    const linkedCompany = nextCompanyId
      ? db.companies.find((c) => c.id === nextCompanyId) || null
      : null;

    const updated: UserAccount = {
      ...existing,
      name: body.name !== undefined && body.name.trim() ? body.name.trim() : existing.name,
      email: body.email !== undefined ? body.email.trim() : existing.email,
      role: body.role || existing.role,
      department:
        body.department !== undefined && body.department.trim()
          ? body.department.trim()
          : existing.department,
      title: body.title !== undefined && body.title.trim() ? body.title.trim() : existing.title,
      facility: body.facility || existing.facility,
      active: typeof body.active === 'boolean' ? body.active : existing.active,
      companyId: nextCompanyId,
      companyCode: linkedCompany?.code ?? null,
      companyName: linkedCompany ? `${linkedCompany.name} (${linkedCompany.unitName})` : null,
    };

    db.users[idx] = updated;
    db.auditLogs.unshift({
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: req.authUser?.employeeId || 'ADMIN',
      actorName: req.authUser?.name || 'Administrator',
      actorRole: req.authUser?.role || 'ADMIN',
      entityType: 'User',
      entityId: updated.employeeId,
      action: 'UPDATED_USER_ACCOUNT',
      details: `Updated account "${updated.username || updated.employeeId}" (${updated.role}, active=${updated.active}).`,
    });

    saveDatabase(db);
    res.json({ user: enrichUser(updated, db.companies) });
  });

  // Admin: Change user password (re-hashed via scrypt)
  app.put(
    '/api/users/:id/password',
    requireJwtAuth,
    requireRoles('ADMIN'),
    (req: AuthenticatedRequest, res) => {
      const db = loadDatabase();
      const idx = db.users.findIndex((u) => u.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }

      const { password } = req.body as { password?: string };
      const cleanPassword = (password || '').trim();
      if (cleanPassword.length < 4) {
        res.status(400).json({ error: 'New password must be at least 4 characters long.' });
        return;
      }

      db.users[idx] = {
        ...db.users[idx],
        password: hashPassword(cleanPassword),
      };

      db.auditLogs.unshift({
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: req.authUser?.employeeId || 'ADMIN',
        actorName: req.authUser?.name || 'Administrator',
        actorRole: req.authUser?.role || 'ADMIN',
        entityType: 'User',
        entityId: db.users[idx].employeeId,
        action: 'CHANGED_USER_PASSWORD',
        details: `Administrator updated password for account "${db.users[idx].username || db.users[idx].employeeId}".`,
      });

      saveDatabase(db);
      res.json({ ok: true, user: enrichUser(db.users[idx], db.companies) });
    },
  );

  // Admin: Delete user account (blocks self-deletion)
  app.delete(
    '/api/users/:id',
    requireJwtAuth,
    requireRoles('ADMIN'),
    (req: AuthenticatedRequest, res) => {
      const db = loadDatabase();
      const idx = db.users.findIndex((u) => u.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'User account not found.' });
        return;
      }
      if (db.users[idx].id === req.authUser?.id) {
        res.status(400).json({ error: 'You cannot delete your own currently signed-in account.' });
        return;
      }

      const [removed] = db.users.splice(idx, 1);
      db.auditLogs.unshift({
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: req.authUser?.employeeId || 'ADMIN',
        actorName: req.authUser?.name || 'Administrator',
        actorRole: req.authUser?.role || 'ADMIN',
        entityType: 'User',
        entityId: removed.employeeId,
        action: 'DELETED_USER_ACCOUNT',
        details: `Deleted account "${removed.username || removed.employeeId}" (${removed.name}, ${removed.role}).`,
      });

      saveDatabase(db);
      res.json({ ok: true, deletedId: removed.id });
    },
  );

  // Companies CRUD — Read for authenticated users, Mutations strictly ADMIN JWT only
  app.get('/api/companies', requireJwtAuth, (_req, res) => {
    const db = loadDatabase();
    res.json({ companies: db.companies });
  });

  app.post('/api/companies', requireJwtAuth, requireRoles('ADMIN'), (req: AuthenticatedRequest, res) => {
    const db = loadDatabase();
    const body = req.body as Partial<CompanyRecord> & {
      initialAccount?: {
        username?: string;
        name?: string;
        email?: string;
        password?: string;
        role?: UserRole;
        department?: string;
      };
    };

    if (!body.code?.trim() || !body.name?.trim() || !body.location?.trim()) {
      res.status(400).json({ error: 'Company Code, Name, and Location are required.' });
      return;
    }
    const normalizedCode = body.code.trim().toUpperCase();
    if (db.companies.some((c) => c.code.toUpperCase() === normalizedCode)) {
      res.status(400).json({ error: `Company code ${normalizedCode} already exists.` });
      return;
    }

    // Validate optional initial company account BEFORE saving the company
    if (body.initialAccount && (body.initialAccount.username || body.initialAccount.password)) {
      const login = (body.initialAccount.username || '').trim().toUpperCase();
      if (!login || !(body.initialAccount.name || '').trim()) {
        res.status(400).json({
          error: 'Individual Company Account requires Username and Account Holder Name.',
        });
        return;
      }
      if (!body.initialAccount.password || body.initialAccount.password.trim().length < 4) {
        res.status(400).json({
          error: 'Individual Company Account password must be at least 4 characters.',
        });
        return;
      }
      if (
        db.users.some(
          (u) =>
            u.employeeId.toUpperCase() === login ||
            (u.username && u.username.toUpperCase() === login),
        )
      ) {
        res.status(400).json({
          error: `Username "${body.initialAccount.username}" is already registered.`,
        });
        return;
      }
    }

    const created: CompanyRecord = {
      id: `comp-${Date.now()}`,
      code: normalizedCode,
      name: body.name.trim(),
      unitName: body.unitName?.trim() || 'Machine Shop Unit',
      facilityType: body.facilityType || 'Machine Shop',
      location: body.location.trim(),
      gstOrRegNo: body.gstOrRegNo?.trim() || '',
      contactEmail: body.contactEmail?.trim() || '',
      active: true,
    };
    db.companies.unshift(created);

    let createdAccount: Omit<UserAccount, 'password'> | null = null;
    if (body.initialAccount && body.initialAccount.username?.trim()) {
      const accRes = createCompanyAccountInDb(db, created, body.initialAccount);
      if (accRes.ok) {
        createdAccount = enrichUser(accRes.user, db.companies);
      }
    }

    db.auditLogs.unshift({
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: req.authUser?.employeeId || 'ADMIN',
      actorName: req.authUser?.name || 'Administrator',
      actorRole: req.authUser?.role || 'ADMIN',
      entityType: 'Company',
      entityId: created.code,
      action: 'ADDED_COMPANY',
      details: `Added company ${created.name} (${created.unitName}) at ${created.location}${
        createdAccount
          ? ` with individual login account "${createdAccount.username || createdAccount.employeeId}" (${createdAccount.role})`
          : ''
      }.`,
    });

    saveDatabase(db);
    res.status(201).json({ company: created, account: createdAccount });
  });

  app.put('/api/companies/:id', requireJwtAuth, requireRoles('ADMIN'), (req, res) => {
    const db = loadDatabase();
    const idx = db.companies.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Company not found.' });
      return;
    }
    db.companies[idx] = { ...db.companies[idx], ...(req.body as Partial<CompanyRecord>) };
    saveDatabase(db);
    res.json({ company: db.companies[idx] });
  });

  // Create an individual login account directly for a specific added company (Admin JWT only)
  app.post(
    '/api/companies/:id/accounts',
    requireJwtAuth,
    requireRoles('ADMIN'),
    (req: AuthenticatedRequest, res) => {
      const db = loadDatabase();
      const company = db.companies.find((c) => c.id === req.params.id);
      if (!company) {
        res.status(404).json({ error: 'Company not found.' });
        return;
      }

      const accRes = createCompanyAccountInDb(db, company, req.body);
      if (!accRes.ok) {
        res.status(400).json({ error: accRes.error });
        return;
      }

      db.auditLogs.unshift({
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: req.authUser?.employeeId || 'ADMIN',
        actorName: req.authUser?.name || 'Administrator',
        actorRole: req.authUser?.role || 'ADMIN',
        entityType: 'CompanyAccount',
        entityId: accRes.user.employeeId,
        action: 'CREATED_COMPANY_ACCOUNT',
        details: `Provisioned individual account "${accRes.user.username || accRes.user.employeeId}" (${accRes.user.role}) for ${company.code} — ${company.name}.`,
      });

      saveDatabase(db);
      res.status(201).json({ user: enrichUser(accRes.user, db.companies) });
    },
  );

  // Master Data & Domain Endpoints (Authenticated JWT required)
  app.get('/api/master-data', requireJwtAuth, (_req, res) => {
    const db = loadDatabase();
    res.json({
      companies: db.companies,
      departments: db.departments,
      customers: db.customers,
      parts: db.parts,
    });
  });

  app.get('/api/departments', requireJwtAuth, (_req, res) => {
    const db = loadDatabase();
    res.json({ departments: db.departments });
  });

  app.post(
    '/api/departments',
    requireJwtAuth,
    requireRoles('ADMIN', 'COF', 'PLANT_HEAD'),
    (req: AuthenticatedRequest, res) => {
      const db = loadDatabase();
      const { code, name, facility, hodName, memberCount } = req.body as {
        code?: string;
        name?: string;
        facility?: 'Foundry' | 'Machine Shop' | 'Quality' | 'Corporate';
        hodName?: string;
        memberCount?: number;
      };
      if (!code?.trim() || !name?.trim()) {
        res.status(400).json({ error: 'Department Code and Name are required.' });
        return;
      }
      const normCode = code.trim().toUpperCase();
      if (db.departments.some((d) => d.code.toUpperCase() === normCode)) {
        res.status(409).json({ error: `Department code ${normCode} already exists.` });
        return;
      }
      const department = {
        id: `dept-${Date.now()}`,
        code: normCode,
        name: name.trim(),
        facility: facility || 'Machine Shop',
        hodName: hodName?.trim() || '',
        memberCount: Number(memberCount) || 1,
      };
      db.departments.push(department);
      db.auditLogs.unshift({
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: req.authUser?.employeeId || 'SYSTEM',
        actorName: req.authUser?.name || 'System User',
        actorRole: req.authUser?.role || 'ADMIN',
        entityType: 'Department',
        entityId: department.code,
        action: 'DEPARTMENT_CREATED',
        details: `Added department ${department.code} — ${department.name}.`,
      });
      saveDatabase(db);
      res.status(201).json({ department });
    },
  );

  app.get('/api/customers', requireJwtAuth, (_req, res) => {
    const db = loadDatabase();
    res.json({ customers: db.customers });
  });

  app.post(
    '/api/customers',
    requireJwtAuth,
    requireRoles('ADMIN', 'CFT_LEADER', 'COF'),
    (req: AuthenticatedRequest, res) => {
      const db = loadDatabase();
      const { code, name, location, contactPerson } = req.body as {
        code?: string;
        name?: string;
        location?: string;
        contactPerson?: string;
      };
      if (!code?.trim() || !name?.trim()) {
        res.status(400).json({ error: 'Customer Code and Name are required.' });
        return;
      }
      const normCode = code.trim().toUpperCase();
      if (db.customers.some((c) => c.code.toUpperCase() === normCode)) {
        res.status(409).json({ error: `Customer code ${normCode} already exists.` });
        return;
      }
      const customer = {
        id: `cust-${Date.now()}`,
        code: normCode,
        name: name.trim(),
        location: location?.trim() || '',
        contactPerson: contactPerson?.trim() || '',
      };
      db.customers.push(customer);
      db.auditLogs.unshift({
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: req.authUser?.employeeId || 'SYSTEM',
        actorName: req.authUser?.name || 'System User',
        actorRole: req.authUser?.role || 'ADMIN',
        entityType: 'Customer',
        entityId: customer.code,
        action: 'CUSTOMER_CREATED',
        details: `Added OEM customer ${customer.code} — ${customer.name}.`,
      });
      saveDatabase(db);
      res.status(201).json({ customer });
    },
  );

  app.get('/api/parts', requireJwtAuth, (_req, res) => {
    const db = loadDatabase();
    res.json({ parts: db.parts });
  });

  app.post(
    '/api/parts',
    requireJwtAuth,
    requireRoles('ADMIN', 'CFT_LEADER', 'COF'),
    (req: AuthenticatedRequest, res) => {
      const db = loadDatabase();
      const {
        companyId,
        partNumber,
        partName,
        customer,
        facility,
        currentRevision,
        drawingNumber,
        materialGrade,
        processType,
        specifications,
      } = req.body as {
        companyId?: string | null;
        partNumber?: string;
        partName?: string;
        customer?: string;
        facility?: 'Foundry' | 'Machine Shop' | 'Foundry & Machine Shop';
        currentRevision?: string;
        drawingNumber?: string;
        materialGrade?: string;
        processType?: string;
        specifications?: string;
      };
      if (!partNumber?.trim() || !partName?.trim()) {
        res.status(400).json({ error: 'Part Number and Part Name are required.' });
        return;
      }
      const normNo = partNumber.trim().toUpperCase();
      if (db.parts.some((p) => p.partNumber.toUpperCase() === normNo)) {
        res.status(409).json({ error: `Part Number ${normNo} already exists.` });
        return;
      }
      const linkedCompany = companyId
        ? db.companies.find((c) => c.id === companyId) || null
        : null;
      const part = {
        id: `part-${Date.now()}`,
        companyId: linkedCompany?.id ?? null,
        partNumber: normNo,
        partName: partName.trim(),
        customer: customer?.trim() || linkedCompany?.name || '',
        facility: facility || 'Machine Shop',
        currentRevision: currentRevision?.trim() || 'Rev 01',
        drawingNumber: drawingNumber?.trim() || '',
        materialGrade: materialGrade?.trim() || '',
        processType: processType?.trim() || '',
        specifications: specifications?.trim() || '',
      };
      db.parts.push(part);
      db.auditLogs.unshift({
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: req.authUser?.employeeId || 'SYSTEM',
        actorName: req.authUser?.name || 'System User',
        actorRole: req.authUser?.role || 'ADMIN',
        entityType: 'PartMaster',
        entityId: part.partNumber,
        action: 'PART_CREATED',
        details: `Added manufactured part ${part.partNumber} — ${part.partName}${
          linkedCompany ? ` for ${linkedCompany.code}` : ''
        }.`,
      });
      saveDatabase(db);
      res.status(201).json({ part });
    },
  );

  app.put(
    '/api/parts/:id',
    requireJwtAuth,
    requireRoles('ADMIN', 'CFT_LEADER', 'COF'),
    (req: AuthenticatedRequest, res) => {
      const db = loadDatabase();
      const idx = db.parts.findIndex((p) => p.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Part record not found.' });
        return;
      }
      const body = req.body as Partial<DatabaseSchema['parts'][number]>;
      const nextPartNumber = body.partNumber?.trim()
        ? body.partNumber.trim().toUpperCase()
        : db.parts[idx].partNumber;

      if (
        nextPartNumber !== db.parts[idx].partNumber &&
        db.parts.some((p) => p.id !== req.params.id && p.partNumber.toUpperCase() === nextPartNumber)
      ) {
        res.status(409).json({ error: `Part Number ${nextPartNumber} already exists.` });
        return;
      }

      const updated = {
        ...db.parts[idx],
        companyId: body.companyId !== undefined ? body.companyId || null : db.parts[idx].companyId ?? null,
        partNumber: nextPartNumber,
        partName: body.partName?.trim() || db.parts[idx].partName,
        customer: body.customer !== undefined ? body.customer.trim() : db.parts[idx].customer,
        facility: body.facility || db.parts[idx].facility,
        currentRevision:
          body.currentRevision !== undefined
            ? body.currentRevision.trim() || 'Rev 01'
            : db.parts[idx].currentRevision,
        drawingNumber:
          body.drawingNumber !== undefined ? body.drawingNumber.trim() : db.parts[idx].drawingNumber || '',
        materialGrade:
          body.materialGrade !== undefined ? body.materialGrade.trim() : db.parts[idx].materialGrade || '',
        processType:
          body.processType !== undefined ? body.processType.trim() : db.parts[idx].processType || '',
        specifications:
          body.specifications !== undefined ? body.specifications.trim() : db.parts[idx].specifications || '',
      };

      db.parts[idx] = updated;
      db.auditLogs.unshift({
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: req.authUser?.employeeId || 'SYSTEM',
        actorName: req.authUser?.name || 'System User',
        actorRole: req.authUser?.role || 'ADMIN',
        entityType: 'PartMaster',
        entityId: updated.partNumber,
        action: 'PART_UPDATED',
        details: `Updated manufactured part ${updated.partNumber} — ${updated.partName}.`,
      });
      saveDatabase(db);
      res.json({ part: updated });
    },
  );

  app.delete(
    '/api/parts/:id',
    requireJwtAuth,
    requireRoles('ADMIN', 'CFT_LEADER', 'COF'),
    (req: AuthenticatedRequest, res) => {
      const db = loadDatabase();
      const idx = db.parts.findIndex((p) => p.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ error: 'Part record not found.' });
        return;
      }
      const [removed] = db.parts.splice(idx, 1);
      db.auditLogs.unshift({
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: req.authUser?.employeeId || 'SYSTEM',
        actorName: req.authUser?.name || 'System User',
        actorRole: req.authUser?.role || 'ADMIN',
        entityType: 'PartMaster',
        entityId: removed.partNumber,
        action: 'PART_DELETED',
        details: `Deleted part ${removed.partNumber} — ${removed.partName}.`,
      });
      saveDatabase(db);
      res.json({ ok: true, deletedId: removed.id });
    },
  );

  app.get('/api/analytics', requireJwtAuth, (_req, res) => {
    const db = loadDatabase();
    res.json({
      total: db.pcrfs.length,
      closed: db.pcrfs.filter((p) => p.overallStatus === 'Closed').length,
      inReview: db.pcrfs.filter((p) => p.overallStatus === 'In Review').length,
    });
  });

  // PCRFs (Authenticated JWT required; COMPANY_USER scoped to their company; Creation role-checked via JWT)
  app.get('/api/pcrfs', requireJwtAuth, (req: AuthenticatedRequest, res) => {
    const db = loadDatabase();
    if (req.authUser?.role === 'COMPANY_USER' && req.authUser.companyId) {
      const scoped = db.pcrfs.filter(
        (p) =>
          p.companyId === req.authUser!.companyId ||
          p.createdByEmployeeId === req.authUser!.employeeId,
      );
      res.json({ pcrfs: scoped });
      return;
    }
    res.json({ pcrfs: db.pcrfs });
  });

  app.get('/api/pcrfs/:id', requireJwtAuth, (req: AuthenticatedRequest, res) => {
    const db = loadDatabase();
    const pcrf = db.pcrfs.find((p) => p.id === req.params.id || p.pcrfNo === req.params.id);
    if (!pcrf) {
      res.status(404).json({ error: 'Change request not found.' });
      return;
    }
    if (
      req.authUser?.role === 'COMPANY_USER' &&
      req.authUser.companyId &&
      pcrf.companyId !== req.authUser.companyId &&
      pcrf.createdByEmployeeId !== req.authUser.employeeId
    ) {
      res.status(403).json({ error: 'Access denied to another company change request.' });
      return;
    }
    res.json({ pcrf });
  });

  app.post(
    '/api/pcrfs',
    requireJwtAuth,
    requireRoles(...RBAC_ROLES.PCRF_CREATORS),
    (req: AuthenticatedRequest, res) => {
      const db = loadDatabase();
      const body = req.body as {
        companyId?: string;
        companyName?: string;
        title?: string;
        priority?: 'Critical' | 'High' | 'Normal';
        department?: string;
        customer?: string;
        partName?: string;
        partNo?: string;
        changeType?: 'Product' | 'Process';
        facilityScope?: 'Foundry' | 'Machine Shop' | 'Foundry & Machine Shop';
        classifications?: Array<'Man' | 'Machine' | 'Material' | 'Method'>;
        reasonForChange?: string;
        particulars?: string;
        currentStatus?: string;
        changeRequired?: string;
        dueDate?: string;
        currentRevision?: string;
        drawingNumber?: string;
        materialGrade?: string;
        processType?: string;
        specifications?: string;
      };

      if (!body.customer || !body.partName || !body.partNo || !body.reasonForChange) {
        res.status(400).json({ error: 'Customer, Part Name, Part No, and Reason are required.' });
        return;
      }

      const requestedCompanyId =
        req.authUser?.role === 'COMPANY_USER' && req.authUser.companyId
          ? req.authUser.companyId
          : body.companyId || req.authUser?.companyId || undefined;
      const company = requestedCompanyId
        ? db.companies.find((c) => c.id === requestedCompanyId)
        : undefined;
      const matchedPart = db.parts.find(
        (pt) => pt.partNumber.toUpperCase() === body.partNo!.trim().toUpperCase(),
      );
      const nextSeq = 1 + db.pcrfs.length;
      const year = new Date().getFullYear();
      const pcrfNo = `PCRF-${year}-${String(nextSeq).padStart(3, '0')}`;
      const actorName = req.authUser!.name;
      const actorEmpId = req.authUser!.employeeId;
      const actorRole = req.authUser!.role;

      const newRecord = createBlankChangeRequest({
        id: `pcrf-${Date.now()}`,
        pcrfNo,
        companyId: company?.id,
        companyName: body.companyName || (company ? `${company.name} — ${company.unitName}` : undefined),
        title: body.title || `${body.partName} — ${body.particulars || body.changeType || 'Process'} Change`,
        priority: body.priority || 'Normal',
        createdBy: actorName,
        createdByEmployeeId: actorEmpId,
        actorRole,
        department: body.department || req.authUser?.department || 'Machine Shop',
        customer: body.customer,
        partName: body.partName,
        partNo: body.partNo,
        changeType: body.changeType || 'Process',
        facilityScope: body.facilityScope || 'Machine Shop',
        classifications: body.classifications?.length ? body.classifications : ['Method'],
        reasonForChange: body.reasonForChange,
        particulars: body.particulars || 'Process Parameter Modification',
        currentStatus: body.currentStatus || 'Current baseline',
        changeRequired: body.changeRequired || body.reasonForChange,
        dueDate: body.dueDate || '2027-01-15',
        currentRevision: body.currentRevision || matchedPart?.currentRevision,
        drawingNumber: body.drawingNumber || matchedPart?.drawingNumber,
        materialGrade: body.materialGrade || matchedPart?.materialGrade,
        processType: body.processType || matchedPart?.processType,
        specifications: body.specifications || matchedPart?.specifications,
      });

      db.pcrfs.unshift(newRecord);
      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        type: 'New Change Request',
        title: `New Change Request Raised — ${pcrfNo}`,
        message: `${actorName} submitted ${newRecord.title} for ${newRecord.form1.customer}.`,
        pcrfId: newRecord.id,
        pcrfNo,
        targetRoles: ['HOD', 'HOF', 'COF', 'CFT_LEADER', 'ADMIN'],
        createdAt: new Date().toISOString(),
        read: false,
      });
      db.auditLogs.unshift({
        id: `al-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actorId: actorEmpId,
        actorName,
        actorRole,
        entityType: 'PCRF',
        entityId: pcrfNo,
        action: 'CREATED_PCRF',
        details: `Created interconnected Change Request ${pcrfNo} for ${body.partName}.`,
      });

      saveDatabase(db);
      res.status(201).json({ pcrf: newRecord });
    },
  );

  // Exact PDF full-form controller endpoints (+ short compatibility aliases) — JWT protected
  app.put('/api/pcrfs/:id/process-change-requisition-form', requireJwtAuth, (req, res) =>
    handleSaveForm(req as AuthenticatedRequest, res, 'form1'),
  );
  app.put('/api/pcrfs/:id/pcrf', requireJwtAuth, (req, res) =>
    handleSaveForm(req as AuthenticatedRequest, res, 'form1'),
  );

  app.put('/api/pcrfs/:id/feasibility-report-for-change-request', requireJwtAuth, (req, res) =>
    handleSaveForm(req as AuthenticatedRequest, res, 'form2'),
  );
  app.put('/api/pcrfs/:id/feasibility', requireJwtAuth, (req, res) =>
    handleSaveForm(req as AuthenticatedRequest, res, 'form2'),
  );

  app.put('/api/pcrfs/:id/risk-analysis-check-sheet', requireJwtAuth, (req, res) =>
    handleSaveForm(req as AuthenticatedRequest, res, 'form3'),
  );
  app.put('/api/pcrfs/:id/risk-analysis', requireJwtAuth, (req, res) =>
    handleSaveForm(req as AuthenticatedRequest, res, 'form3'),
  );

  app.put('/api/pcrfs/:id/timing-plan', requireJwtAuth, (req, res) =>
    handleSaveForm(req as AuthenticatedRequest, res, 'form4'),
  );

  app.put('/api/pcrfs/:id/checklist-for-managing-and-tracking-change', requireJwtAuth, (req, res) =>
    handleSaveForm(req as AuthenticatedRequest, res, 'form5'),
  );
  app.put('/api/pcrfs/:id/change-checklist', requireJwtAuth, (req, res) =>
    handleSaveForm(req as AuthenticatedRequest, res, 'form5'),
  );

  app.put('/api/pcrfs/:id/ptr-initiation-form', requireJwtAuth, (req, res) =>
    handleSaveForm(req as AuthenticatedRequest, res, 'form6'),
  );
  app.put('/api/pcrfs/:id/ptr', requireJwtAuth, (req, res) =>
    handleSaveForm(req as AuthenticatedRequest, res, 'form6'),
  );

  app.put(
    '/api/pcrfs/:id/ppap-initiation-form-cum-production-report',
    requireJwtAuth,
    (req, res) => handleSaveForm(req as AuthenticatedRequest, res, 'form7'),
  );
  app.put('/api/pcrfs/:id/ppap', requireJwtAuth, (req, res) =>
    handleSaveForm(req as AuthenticatedRequest, res, 'form7'),
  );

  app.put('/api/pcrfs/:id/forms/:formKey', requireJwtAuth, (req, res) => {
    const formKey = req.params.formKey as FormIdentifier;
    const validKeys: FormIdentifier[] = ['form1', 'form2', 'form3', 'form4', 'form5', 'form6', 'form7'];
    if (!validKeys.includes(formKey)) {
      res.status(400).json({ error: 'Invalid form identifier.' });
      return;
    }
    handleSaveForm(req as AuthenticatedRequest, res, formKey);
  });

  // Workflow decision — strictly verified from JWT role!
  app.post('/api/pcrfs/:id/decision', requireJwtAuth, (req: AuthenticatedRequest, res) => {
    const db = loadDatabase();
    const idx = db.pcrfs.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Change request not found.' });
      return;
    }

    const { decision, comments } = req.body as {
      decision: 'APPROVE' | 'REJECT' | 'RETURN';
      comments?: string;
    };

    const actorName = req.authUser!.name;
    const actorRole = req.authUser!.role;
    const actorEmpId = req.authUser!.employeeId;

    const existing = db.pcrfs[idx];
    if (!canUserApproveStage(actorRole, existing.currentStage)) {
      res.status(403).json({
        error: `Role ${actorRole} is not authorized to approve or reject stage ${existing.currentStage}.`,
      });
      return;
    }

    const transitioned = applyWorkflowDecision(
      existing,
      decision,
      actorName,
      actorRole,
      comments || '',
    );

    if (existing.currentStage === 'INTERNAL_APPROVAL') {
      transitioned.form1 = {
        ...transitioned.form1,
        internalApprovalStatus:
          decision === 'APPROVE' ? 'Approved' : decision === 'REJECT' ? 'Rejected' : 'Pending',
        plantHeadApproval:
          decision === 'APPROVE' ? 'Approved' : decision === 'REJECT' ? 'Rejected' : 'Pending',
        plantHeadSign: `${actorName} (${new Date().toISOString().slice(0, 10)})`,
      };
    }

    db.pcrfs[idx] = transitioned;
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      type:
        decision === 'APPROVE'
          ? 'Request Approved'
          : decision === 'REJECT'
          ? 'Request Rejected'
          : 'Returned for Correction',
      title: `${existing.pcrfNo} — ${
        decision === 'APPROVE' ? 'Stage Approved' : decision === 'REJECT' ? 'Rejected' : 'Returned'
      }`,
      message: `${actorName} (${actorRole}): ${comments || 'Decision recorded.'}`,
      pcrfId: existing.id,
      pcrfNo: existing.pcrfNo,
      targetRoles: ['EMPLOYEE', 'HOD', 'CFT', 'CFT_LEADER', 'PLANT_HEAD', 'ADMIN'],
      createdAt: new Date().toISOString(),
      read: false,
    });
    db.auditLogs.unshift({
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: actorEmpId,
      actorName,
      actorRole,
      entityType: 'Workflow',
      entityId: existing.pcrfNo,
      action: `WORKFLOW_${decision}`,
      details: `${decision} at stage ${existing.currentStage}. ${comments || ''}`,
    });

    saveDatabase(db);
    res.json({ pcrf: transitioned });
  });

  // Notifications & Audit Logs — JWT protected; Audit Logs restricted to ADMIN & PLANT_HEAD
  app.get('/api/notifications', requireJwtAuth, (_req, res) => {
    const db = loadDatabase();
    res.json({ notifications: db.notifications });
  });

  app.post('/api/notifications/:id/read', requireJwtAuth, (req, res) => {
    const db = loadDatabase();
    db.notifications = db.notifications.map((n) =>
      n.id === req.params.id ? { ...n, read: true } : n,
    );
    saveDatabase(db);
    res.json({ ok: true });
  });

  app.post('/api/notifications/read-all', requireJwtAuth, (_req, res) => {
    const db = loadDatabase();
    db.notifications = db.notifications.map((n) => ({ ...n, read: true }));
    saveDatabase(db);
    res.json({ ok: true });
  });

  app.get(
    '/api/audit-logs',
    requireJwtAuth,
    requireRoles(...RBAC_ROLES.AUDIT_VIEWERS),
    (_req, res) => {
      const db = loadDatabase();
      res.json({ auditLogs: db.auditLogs });
    },
  );

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      configFile: path.resolve(process.cwd(), 'frontend/vite.config.ts'),
      root: path.resolve(process.cwd(), 'frontend'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sakthi Auto PCMS running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
