import { useAuth } from './auth-context';

export function useRole() {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;
  const isStaff = user?.role === 'STAFF';
  const hasRole = (...roles: Array<'ADMIN' | 'STAFF' | 'SUPER_ADMIN'>) => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return roles.includes(user.role);
  };

  return {
    isAdmin,
    isStaff,
    isSuperAdmin,
    hasRole,
    role: user?.role,
  };
}
