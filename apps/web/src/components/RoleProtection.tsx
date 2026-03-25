'use client';

import { useAuth } from '@/packages/supabase/src/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleProtectionProps {
  roles: ('owner' | 'manager' | 'employee')[];
  children: React.ReactNode;
  redirectTo?: string;
  unauthenticatedRedirectTo?: string;
}

export const RoleProtection = ({
  roles,
  children,
  redirectTo = '/',
  unauthenticatedRedirectTo = '/login',
}: RoleProtectionProps) => {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace(unauthenticatedRedirectTo);
      return;
    }

    if (!roles.some((allowedRole) => role === allowedRole)) {
      router.replace(redirectTo);
      return;
    }
  }, [user, role, isLoading, roles, redirectTo, router, unauthenticatedRedirectTo]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return children;
};
