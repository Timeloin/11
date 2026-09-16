import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserSession } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'inventory-super-secure-jwt-key-2026';

export const SUPER_ADMIN_EMAIL = (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase().trim();
export const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || '';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function signToken(session: UserSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (err) {
    return null;
  }
}

export function verifyAdminPassword(password?: string): boolean {
  if (!password) return false;
  const envPass = (process.env.SUPER_ADMIN_PASSWORD || SUPER_ADMIN_PASSWORD || '').trim();
  if (!envPass) return true; // If no password configured in environment, allow
  return password.trim() === envPass;
}
