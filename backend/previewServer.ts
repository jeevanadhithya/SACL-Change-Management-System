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
    const seed = buildSeedDatabase();
    let changed = false;
    if (!Array.isArray(parsed.companies) || parsed.companies.length === 0) {
      parsed.companies = seed.companies;
      changed = true;
    }
    const db = {
      ...seed,
      ...parsed,
    } as DatabaseSchema;
    if (changed) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    }
    return db;
  } catch {
    const seed = buildSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
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
  const role: UserRole = payload.role && validRoles.includes(payload.role) ? payload.role : 'EMPLOYEE';

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

  app.get('/api/customers', requireJwtAuth, (_req, res) => {
    const db = loadDatabase();
    res.json({ customers: db.customers });
  });

  app.get('/api/parts', requireJwtAuth, (_req, res) => {
    const db = loadDatabase();
    res.json({ parts: db.parts });
  });

  app.get('/api/analytics', requireJwtAuth, (_req, res) => {
    const db = loadDatabase();
    res.json({
      total: db.pcrfs.length,
      closed: db.pcrfs.filter((p) => p.overallStatus === 'Closed').length,
      inReview: db.pcrfs.filter((p) => p.overallStatus === 'In Review').length,
    });
  });

  // PCRFs (Authenticated JWT required; Creation strictly role-checked via JWT)
  app.get('/api/pcrfs', requireJwtAuth, (_req, res) => {
    const db = loadDatabase();
    res.json({ pcrfs: db.pcrfs });
  });

  app.get('/api/pcrfs/:id', requireJwtAuth, (req, res) => {
    const db = loadDatabase();
    const pcrf = db.pcrfs.find((p) => p.id === req.params.id || p.pcrfNo === req.params.id);
    if (!pcrf) {
      res.status(404).json({ error: 'Change request not found.' });
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
      };

      if (!body.customer || !body.partName || !body.partNo || !body.reasonForChange) {
        res.status(400).json({ error: 'Customer, Part Name, Part No, and Reason are required.' });
        return;
      }

      const requestedCompanyId = body.companyId || req.authUser?.companyId || undefined;
      const company = db.companies.find((c) => c.id === requestedCompanyId) || db.companies[0];
      const nextSeq = 45 + db.pcrfs.length;
      const pcrfNo = `PCRF-2026-${String(nextSeq).padStart(3, '0')}`;
      const actorName = req.authUser?.name || 'System User';
      const actorEmpId = req.authUser?.employeeId || 'EMP101';
      const actorRole = req.authUser?.role || 'EMPLOYEE';

      const newRecord = createBlankChangeRequest({
        id: `pcrf-${Date.now()}`,
        pcrfNo,
        companyId: company?.id,
        companyName: body.companyName || (company ? `${company.name} — ${company.unitName}` : undefined),
        title: body.title || `${body.partName} — ${body.particulars || body.changeType || 'Process'} Change`,
        priority: body.priority || 'Normal',
        createdBy: actorName,
        createdByEmployeeId: actorEmpId,
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
