'use client';

import { useAuth } from '@/lib/clerk/useAuth';
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
  const { user, role, isLoading, isDemoMode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isDemoMode) {
      if (!roles.some((allowedRole) => role === allowedRole)) {
        router.replace(redirectTo);
        return;
      }
      return;
    }

    if (!user) {
      router.replace(unauthenticatedRedirectTo);
      return;
    }

    if (!roles.some((allowedRole) => role === allowedRole)) {
      router.replace(redirectTo);
      return;
    }
  }, [user, role, isLoading, roles, redirectTo, router, unauthenticatedRedirectTo, isDemoMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
          <svg className="animate-spin h-8 w-8 text-orange-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  return children;
};
