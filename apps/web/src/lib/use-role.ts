import { useAuth } from './auth-context';

export function useRole() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const hasRole = (...roles: Array<'ADMIN' | 'STAFF'>) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return {
    isAdmin,
    isStaff,
    hasRole,
    role: user?.role,
  };
}
