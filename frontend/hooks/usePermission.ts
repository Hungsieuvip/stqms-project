'use client';

import { useAuth } from '../contexts/AuthContext';

export function usePermission() {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const roleLower = (user.role || '').toLowerCase();
    if (roleLower === 'admin' || roleLower === 'system_admin') return true;

    // Check in permissions array
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }
    return false;
  };

  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    const target = roleName.toUpperCase();
    if ((user.role || '').toUpperCase() === target) return true;
    if (user.roles && Array.isArray(user.roles)) {
      return user.roles.some((r: any) => {
        const name = typeof r === 'string' ? r : (r.name || r.code || '');
        return name.toUpperCase() === target;
      });
    }
    return false;
  };

  const isOwner = (authorId?: string | number | null): boolean => {
    if (!user || authorId === null || authorId === undefined) return false;
    return user.id.toString() === authorId.toString();
  };

  return { user, hasPermission, hasRole, isOwner };
}
