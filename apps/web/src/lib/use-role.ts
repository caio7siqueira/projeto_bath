import { useAuth } from './auth-context';

export function useRole() {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;
  const isManager = user?.role === 'STAFF';
  const isAttendant = user?.role === 'GROOMER';
  const isFinance = user?.role === 'FINANCE';
  const hasRole = (...roles: Array<'ADMIN' | 'STAFF' | 'GROOMER' | 'FINANCE' | 'SUPER_ADMIN'>) => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return roles.includes(user.role);
  };

  return {
    isAdmin,
    isManager,
    isAttendant,
    isFinance,
    isSuperAdmin,
    hasRole,
    role: user?.role,
  };
}
