import { CustomPermissions, UserSession } from '@/types';

export function hasPermission(
  session: UserSession | null | undefined,
  permission: keyof CustomPermissions
): boolean {
  if (!session) return false;
  // Main Admin always has full permissions
  if (session.role === 'admin' || session.isSuperAdmin) return true;

  const perms = session.permissions;
  if (!perms) return false;

  // If member is marked Read-Only, block all write actions
  if (perms.isReadOnly) {
    if (permission === 'isReadOnly' || permission === 'canViewCostPrice' || permission === 'canExportData') {
      return !!perms[permission];
    }
    return false;
  }

  return !!perms[permission];
}

export function isMemberReadOnly(session: UserSession | null | undefined): boolean {
  if (!session) return true;
  if (session.role === 'admin' || session.isSuperAdmin) return false;
  return !!session.permissions?.isReadOnly;
}
