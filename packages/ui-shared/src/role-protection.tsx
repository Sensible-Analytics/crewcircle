'use client';

import { useAuth } from '@/packages/supabase/src/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleProtectionProps {
  /** Required role(s) to access the wrapped content */
  roles: ('owner' | 'manager' | 'employee')[];
  /** The content to render if the user has the required role */
  children: React.ReactNode;
  /** Optional redirect path if access is denied (defaults to '/') */
  redirectTo?: string;
  /** Optional redirect path if not authenticated (defaults to '/login') */
  unauthenticatedRedirectTo?: string;
}

/**
 * A wrapper component that protects routes based on user role.
 * Redirects if the user is not authenticated or does not have the required role.
 */
export const RoleProtection = ({
  roles,
  children,
  redirectTo = '/',
  unauthenticatedRedirectTo = '/login',
}: RoleProtectionProps) => {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading, do nothing (wait for auth to load)
    if (isLoading) return;

    // If no user, redirect to login
    if (!user) {
      router.replace(unauthenticatedRedirectTo);
      return;
    }

    // If user does not have any of the required roles, redirect to denied page
    if (!roles.some((allowedRole) => role === allowedRole)) {
      router.replace(redirectTo);
      return;
    }
  }, [user, role, isLoading, roles, redirectTo, router, unauthenticatedRedirectTo]);

  // If loading, show a loading indicator (or null if you prefer)
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If we pass the checks, render the children
  return children;
};
