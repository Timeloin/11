import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserSession } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'inventory-super-secure-jwt-key-2026';

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function signToken(session: UserSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserSession;
  } catch (err) {
    return null;
  }
}
