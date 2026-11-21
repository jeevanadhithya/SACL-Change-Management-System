import crypto from 'node:crypto';
import type { UserRole, WorkflowStageKey } from '../../frontend/src/types/pcms.ts';
import { canUserApproveStage } from '../../frontend/src/utils/workflow.ts';

export interface JwtPayload {
  sub: string;
  id: string;
  employeeId: string;
  username?: string;
  name: string;
  role: UserRole;
  department: string;
  companyId?: string | null;
  companyCode?: string | null;
  companyName?: string | null;
  iat: number;
  exp: number;
}

const DEFAULT_JWT_SECRET = process.env.JWT_SECRET || 'sacl_pcms_jwt_secret_2026_enterprise';
const DEFAULT_TTL_SECONDS = 12 * 60 * 60; // 12 hours

export const RBAC_ROLES = {
  ALL_AUTHENTICATED: [
    'ADMIN',
    'EMPLOYEE',
    'COMPANY_USER',
    'HOD',
    'HOF',
    'COF',
    'CFT',
    'CFT_LEADER',
    'PLANT_HEAD',
  ] as UserRole[],
  ADMIN_ONLY: ['ADMIN'] as UserRole[],
  PCRF_CREATORS: ['ADMIN', 'EMPLOYEE', 'COMPANY_USER', 'HOD', 'HOF', 'COF', 'CFT_LEADER'] as UserRole[],
  AUDIT_VIEWERS: ['ADMIN', 'PLANT_HEAD'] as UserRole[],
  MASTER_MANAGERS: ['ADMIN', 'COF', 'CFT_LEADER'] as UserRole[],
  APPROVERS: ['ADMIN', 'HOD', 'HOF', 'COF', 'CFT', 'CFT_LEADER', 'PLANT_HEAD'] as UserRole[],
};

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLength), 'base64');
}

export function signJwtToken(
  user: {
    id: string;
    employeeId: string;
    username?: string;
    name: string;
    role: UserRole;
    department: string;
    companyId?: string | null;
    companyCode?: string | null;
    companyName?: string | null;
  },
  options?: { secret?: string; expiresInSeconds?: number; nowSeconds?: number },
): string {
  const secret = options?.secret || DEFAULT_JWT_SECRET;
  const now = options?.nowSeconds ?? Math.floor(Date.now() / 1000);
  const ttl = options?.expiresInSeconds ?? DEFAULT_TTL_SECONDS;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: JwtPayload = {
    sub: user.id,
    id: user.id,
    employeeId: user.employeeId,
    ...(user.username ? { username: user.username } : {}),
    name: user.name,
    role: user.role,
    department: user.department,
    companyId: user.companyId ?? null,
    companyCode: user.companyCode ?? null,
    companyName: user.companyName ?? null,
    iat: now,
    exp: now + ttl,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signingInput)
    .digest();

  return `${signingInput}.${base64UrlEncode(signature)}`;
}

export function verifyJwtToken(
  token: string,
  options?: { secret?: string; nowSeconds?: number },
): { valid: true; payload: JwtPayload } | { valid: false; error: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Missing authentication token.' };
  }
  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed JWT token.' };
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const secret = options?.secret || DEFAULT_JWT_SECRET;

  try {
    const header = JSON.parse(base64UrlDecode(encodedHeader).toString('utf-8')) as {
      alg?: string;
      typ?: string;
    };
    if (header.alg !== 'HS256') {
      return { valid: false, error: 'Unsupported JWT algorithm.' };
    }

    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();
    const providedSig = base64UrlDecode(encodedSignature);

    if (
      providedSig.length !== expectedSig.length ||
      !crypto.timingSafeEqual(providedSig, expectedSig)
    ) {
      return { valid: false, error: 'Invalid JWT signature.' };
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf-8')) as JwtPayload;
    const now = options?.nowSeconds ?? Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || now >= payload.exp) {
      return { valid: false, error: 'Authentication token has expired.' };
    }
    if (!payload.id || !payload.role) {
      return { valid: false, error: 'Incomplete JWT claims.' };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Invalid authentication token.' };
  }
}

export function extractBearerToken(authHeader?: string | string[]): string | null {
  if (!authHeader || Array.isArray(authHeader)) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return match ? match[1].trim() : null;
}

export function hasRequiredRole(role: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(role);
}

export function canApproveStageForRole(role: UserRole, stage: WorkflowStageKey): boolean {
  return canUserApproveStage(role, stage);
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPassword(plainPassword: string, storedPassword?: string): boolean {
  if (!storedPassword) return false;
  if (storedPassword.startsWith('scrypt$')) {
    const [, salt, storedHash] = storedPassword.split('$');
    if (!salt || !storedHash) return false;
    const derived = crypto.scryptSync(plainPassword, salt, 64);
    const storedBuf = Buffer.from(storedHash, 'hex');
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  }
  return plainPassword === storedPassword;
}
