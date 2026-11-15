import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import type {
  ChangeRequestRecord,
  CompanyRecord,
  FormIdentifier,
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

function handleSaveForm(
  req: express.Request,
  res: express.Response,
  formKey: FormIdentifier,
) {
  const db = loadDatabase();
  const idx = db.pcrfs.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Change request not found.' });
    return;
  }

  const { data, actorName, actorRole } = req.body as {
    data: ChangeRequestRecord[FormIdentifier];
    actorName?: string;
    actorRole?: UserRole;
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
      actorName: actorName || 'System User',
      actorRole: actorRole || 'CFT',
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
  // Integrated preview server serves both Express /api/* and Vite on port 3000.
  // Clear split-deployment API override so client calls hit same-origin /api/*.
  delete process.env.REACT_APP_API_URL;
  delete process.env.VITE_API_URL;

  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'sakthi-auto-pcms' });
  });

  // Auth login
  app.post('/api/auth/login', (req, res) => {
    const { employeeId, password } = req.body as { employeeId?: string; password?: string };
    const db = loadDatabase();
    const normalized = (employeeId ?? '').trim().toUpperCase();
    const user = db.users.find(
      (u) => u.employeeId.toUpperCase() === normalized && u.active,
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid Employee ID or inactive account.' });
      return;
    }

    if (user.password && password !== user.password) {
      res.status(401).json({ error: 'Incorrect password. Please try again.' });
      return;
    }

    const { password: _removed, ...safeUser } = user;
    res.json({ user: safeUser, token: `preview-token-${safeUser.employeeId}` });
  });

  // Users
  app.get('/api/users', (_req, res) => {
    const db = loadDatabase();
    const safeUsers = db.users.map(({ password: _p, ...u }) => u);
    res.json({ users: safeUsers });
  });

  app.post('/api/users', (req, res) => {
    const db = loadDatabase();
    const payload = req.body as {
      employeeId: string;
      name: string;
      email: string;
      role: UserRole;
      department: string;
      title: string;
      facility: 'Foundry' | 'Machine Shop' | 'Corporate' | 'Quality';
    };
    if (!payload.employeeId || !payload.name) {
      res.status(400).json({ error: 'Employee ID and Name are required.' });
      return;
    }
    const newUser = {
      id: `u-${Date.now()}`,
      employeeId: payload.employeeId.toUpperCase(),
      name: payload.name,
      email: payload.email || `${payload.employeeId.toLowerCase()}@sakthiauto.com`,
      role: payload.role || 'EMPLOYEE',
      department: payload.department || 'Machine Shop',
      title: payload.title || 'Engineer',
      facility: payload.facility || 'Machine Shop',
      active: true,
      password: 'password123',
    };
    db.users.push(newUser);
    saveDatabase(db);
    const { password: _p, ...safe } = newUser;
    res.status(201).json({ user: safe });
  });

  // Companies CRUD
  app.get('/api/companies', (_req, res) => {
    const db = loadDatabase();
    res.json({ companies: db.companies });
  });

  app.post('/api/companies', (req, res) => {
    const actorRole = String(req.headers['x-user-role'] || req.body?.actorRole || '').toUpperCase();
    if (actorRole !== 'ADMIN') {
      res.status(403).json({
        error: 'Only System Administrators can add companies from the Admin Dashboard.',
      });
      return;
    }
    const db = loadDatabase();
    const body = req.body as Partial<CompanyRecord>;
    if (!body.code?.trim() || !body.name?.trim() || !body.location?.trim()) {
      res.status(400).json({ error: 'Company Code, Name, and Location are required.' });
      return;
    }
    const normalizedCode = body.code.trim().toUpperCase();
    if (db.companies.some((c) => c.code.toUpperCase() === normalizedCode)) {
      res.status(400).json({ error: `Company code ${normalizedCode} already exists.` });
      return;
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
    db.auditLogs.unshift({
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: 'ADMIN',
      actorName: 'Administrator',
      actorRole: 'ADMIN',
      entityType: 'Company',
      entityId: created.code,
      action: 'ADDED_COMPANY',
      details: `Added company ${created.name} (${created.unitName}) at ${created.location}.`,
    });
    saveDatabase(db);
    res.status(201).json({ company: created });
  });

  app.put('/api/companies/:id', (req, res) => {
    const actorRole = String(req.headers['x-user-role'] || req.body?.actorRole || '').toUpperCase();
    if (actorRole !== 'ADMIN') {
      res.status(403).json({
        error: 'Only System Administrators can update companies.',
      });
      return;
    }
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

  // Master Data & Domain Endpoints
  app.get('/api/master-data', (_req, res) => {
    const db = loadDatabase();
    res.json({
      companies: db.companies,
      departments: db.departments,
      customers: db.customers,
      parts: db.parts,
    });
  });

  app.get('/api/departments', (_req, res) => {
    const db = loadDatabase();
    res.json({ departments: db.departments });
  });

  app.get('/api/customers', (_req, res) => {
    const db = loadDatabase();
    res.json({ customers: db.customers });
  });

  app.get('/api/parts', (_req, res) => {
    const db = loadDatabase();
    res.json({ parts: db.parts });
  });

  app.get('/api/analytics', (_req, res) => {
    const db = loadDatabase();
    res.json({
      total: db.pcrfs.length,
      closed: db.pcrfs.filter((p) => p.overallStatus === 'Closed').length,
      inReview: db.pcrfs.filter((p) => p.overallStatus === 'In Review').length,
    });
  });

  // PCRFs
  app.get('/api/pcrfs', (_req, res) => {
    const db = loadDatabase();
    res.json({ pcrfs: db.pcrfs });
  });

  app.get('/api/pcrfs/:id', (req, res) => {
    const db = loadDatabase();
    const pcrf = db.pcrfs.find((p) => p.id === req.params.id || p.pcrfNo === req.params.id);
    if (!pcrf) {
      res.status(404).json({ error: 'Change request not found.' });
      return;
    }
    res.json({ pcrf });
  });

  app.post('/api/pcrfs', (req, res) => {
    const db = loadDatabase();
    const body = req.body as {
      companyId?: string;
      companyName?: string;
      title: string;
      priority?: 'Critical' | 'High' | 'Normal';
      createdBy: string;
      createdByEmployeeId: string;
      department: string;
      customer: string;
      partName: string;
      partNo: string;
      changeType: 'Product' | 'Process';
      facilityScope: 'Foundry' | 'Machine Shop' | 'Foundry & Machine Shop';
      classifications: Array<'Man' | 'Machine' | 'Material' | 'Method'>;
      reasonForChange: string;
      particulars: string;
      currentStatus: string;
      changeRequired: string;
      dueDate?: string;
    };

    if (!body.customer || !body.partName || !body.partNo || !body.reasonForChange) {
      res.status(400).json({ error: 'Customer, Part Name, Part No, and Reason are required.' });
      return;
    }

    const company = db.companies.find((c) => c.id === body.companyId) || db.companies[0];
    const nextSeq = 45 + db.pcrfs.length;
    const pcrfNo = `PCRF-2026-${String(nextSeq).padStart(3, '0')}`;
    const newRecord = createBlankChangeRequest({
      id: `pcrf-${Date.now()}`,
      pcrfNo,
      companyId: company?.id,
      companyName: body.companyName || (company ? `${company.name} — ${company.unitName}` : undefined),
      title: body.title || `${body.partName} — ${body.particulars || body.changeType} Change`,
      priority: body.priority || 'Normal',
      createdBy: body.createdBy || 'R. Karthik',
      createdByEmployeeId: body.createdByEmployeeId || 'EMP101',
      department: body.department || 'Machine Shop',
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
      message: `${newRecord.createdBy} submitted ${newRecord.title} for ${newRecord.form1.customer}.`,
      pcrfId: newRecord.id,
      pcrfNo,
      targetRoles: ['HOD', 'HOF', 'COF', 'CFT_LEADER', 'ADMIN'],
      createdAt: new Date().toISOString(),
      read: false,
    });
    db.auditLogs.unshift({
      id: `al-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actorId: newRecord.createdByEmployeeId,
      actorName: newRecord.createdBy,
      actorRole: 'EMPLOYEE',
      entityType: 'PCRF',
      entityId: pcrfNo,
      action: 'CREATED_PCRF',
      details: `Created interconnected Change Request ${pcrfNo} for ${body.partName}.`,
    });

    saveDatabase(db);
    res.status(201).json({ pcrf: newRecord });
  });

  // Exact PDF full-form controller endpoints (+ short compatibility aliases)
  app.put('/api/pcrfs/:id/process-change-requisition-form', (req, res) => handleSaveForm(req, res, 'form1'));
  app.put('/api/pcrfs/:id/pcrf', (req, res) => handleSaveForm(req, res, 'form1'));

  app.put('/api/pcrfs/:id/feasibility-report-for-change-request', (req, res) => handleSaveForm(req, res, 'form2'));
  app.put('/api/pcrfs/:id/feasibility', (req, res) => handleSaveForm(req, res, 'form2'));

  app.put('/api/pcrfs/:id/risk-analysis-check-sheet', (req, res) => handleSaveForm(req, res, 'form3'));
  app.put('/api/pcrfs/:id/risk-analysis', (req, res) => handleSaveForm(req, res, 'form3'));

  app.put('/api/pcrfs/:id/timing-plan', (req, res) => handleSaveForm(req, res, 'form4'));

  app.put('/api/pcrfs/:id/checklist-for-managing-and-tracking-change', (req, res) => handleSaveForm(req, res, 'form5'));
  app.put('/api/pcrfs/:id/change-checklist', (req, res) => handleSaveForm(req, res, 'form5'));

  app.put('/api/pcrfs/:id/ptr-initiation-form', (req, res) => handleSaveForm(req, res, 'form6'));
  app.put('/api/pcrfs/:id/ptr', (req, res) => handleSaveForm(req, res, 'form6'));

  app.put('/api/pcrfs/:id/ppap-initiation-form-cum-production-report', (req, res) => handleSaveForm(req, res, 'form7'));
  app.put('/api/pcrfs/:id/ppap', (req, res) => handleSaveForm(req, res, 'form7'));

  app.put('/api/pcrfs/:id/forms/:formKey', (req, res) => {
    const formKey = req.params.formKey as FormIdentifier;
    const validKeys: FormIdentifier[] = ['form1', 'form2', 'form3', 'form4', 'form5', 'form6', 'form7'];
    if (!validKeys.includes(formKey)) {
      res.status(400).json({ error: 'Invalid form identifier.' });
      return;
    }
    handleSaveForm(req, res, formKey);
  });

  // Workflow decision
  app.post('/api/pcrfs/:id/decision', (req, res) => {
    const db = loadDatabase();
    const idx = db.pcrfs.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Change request not found.' });
      return;
    }

    const { decision, actorName, actorRole, comments } = req.body as {
      decision: 'APPROVE' | 'REJECT' | 'RETURN';
      actorName: string;
      actorRole: UserRole;
      comments: string;
    };

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
      actorId: actorRole,
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

  // Notifications & Audit Logs
  app.get('/api/notifications', (_req, res) => {
    const db = loadDatabase();
    res.json({ notifications: db.notifications });
  });

  app.post('/api/notifications/:id/read', (req, res) => {
    const db = loadDatabase();
    db.notifications = db.notifications.map((n) =>
      n.id === req.params.id ? { ...n, read: true } : n,
    );
    saveDatabase(db);
    res.json({ ok: true });
  });

  app.post('/api/notifications/read-all', (_req, res) => {
    const db = loadDatabase();
    db.notifications = db.notifications.map((n) => ({ ...n, read: true }));
    saveDatabase(db);
    res.json({ ok: true });
  });

  app.get('/api/audit-logs', (_req, res) => {
    const db = loadDatabase();
    res.json({ auditLogs: db.auditLogs });
  });

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
