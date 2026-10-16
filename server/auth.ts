import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db, ADMIN_EMAIL_ALLOWLIST, hashPassword, User } from './db.js';

const SESSIONS = new Map<string, { userId: string; email: string; role: 'admin' | 'customer'; expiresAt: number }>();

export function createSession(user: User): string {
  const token = crypto.randomBytes(32).toString('hex');
  // 7 days expiration
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  SESSIONS.set(token, {
    userId: user.id,
    email: user.email.toLowerCase().trim(),
    role: user.role,
    expiresAt
  });
  return token;
}

export function revokeSession(token: string): void {
  SESSIONS.delete(token);
}

export function getSessionUser(req: Request): { userId: string; email: string; role: 'admin' | 'customer' } | null {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.sw_token) {
    token = req.cookies.sw_token;
  }

  if (!token) return null;

  const session = SESSIONS.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    SESSIONS.delete(token);
    return null;
  }

  return session;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: 'admin' | 'customer';
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  req.user = sessionUser;
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    res.status(401).json({ error: 'Access denied.' });
    return;
  }

  const normalizedEmail = sessionUser.email.toLowerCase().trim();
  const isAllowlisted = ADMIN_EMAIL_ALLOWLIST.some(
    allowed => allowed.toLowerCase().trim() === normalizedEmail
  );

  if (sessionUser.role !== 'admin' || !isAllowlisted) {
    res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
    return;
  }

  req.user = sessionUser;
  next();
}

export function authenticateUser(email: string, password: string):User | null {
  const normalizedEmail = email.toLowerCase().trim();
  const data = db.getData();
  const user = data.users.find(u => u.email.toLowerCase().trim() === normalizedEmail);
  if (!user) return null;

  const inputHash = hashPassword(password);
  if (user.passwordHash !== inputHash) return null;

  // Strict check: if user role is admin, verify allowlist
  if (user.role === 'admin') {
    const isAllowlisted = ADMIN_EMAIL_ALLOWLIST.some(
      allowed => allowed.toLowerCase().trim() === normalizedEmail
    );
    if (!isAllowlisted) {
      return null; // Deny admin role if not allowlisted
    }
  }

  return user;
}
