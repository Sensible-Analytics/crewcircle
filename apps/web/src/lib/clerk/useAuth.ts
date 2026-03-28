import { useUser, useClerk } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export interface AuthContext {
  user: ReturnType<typeof useUser>['user'];
  tenantId: string | null;
  role: 'owner' | 'manager' | 'employee' | null;
  isLoading: boolean;
  isDemoMode: boolean;
  signOut: () => Promise<void>;
  resetPasswordEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

export const useAuth = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [role, setRole] = useState<'owner' | 'manager' | 'employee' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    async function fetchTenantInfo() {
      const demoTenantId = sessionStorage.getItem('demo_tenant_id');
      const demoRole = sessionStorage.getItem('demo_role');
      const demoToken = sessionStorage.getItem('demo_token');

      if (demoTenantId && demoRole && demoToken) {
        setIsDemoMode(true);
        setTenantId(demoTenantId);
        setRole(demoRole as 'owner' | 'manager' | 'employee');
        setIsLoading(false);
        return;
      }

      if (!user) {
        setTenantId(null);
        setRole(null);
        setIsDemoMode(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user/profile?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setTenantId(data.tenantId);
          setRole(data.role);
        } else {
          const publicMetadata = user.publicMetadata;
          if (publicMetadata?.tenantId) {
            setTenantId(publicMetadata.tenantId as string);
            setRole(publicMetadata.role as 'owner' | 'manager' | 'employee');
          } else {
            setTenantId(null);
            setRole(null);
          }
        }
      } catch (err) {
        console.error('Error fetching tenant info:', err);
        const publicMetadata = user.publicMetadata;
        if (publicMetadata?.tenantId) {
          setTenantId(publicMetadata.tenantId as string);
          setRole(publicMetadata.role as 'owner' | 'manager' | 'employee');
        }
      }
      setIsDemoMode(false);
      setIsLoading(false);
    }

    if (isUserLoaded) {
      fetchTenantInfo();
    }
  }, [user, isUserLoaded]);

  const signOut = async () => {
    if (isDemoMode) {
      sessionStorage.removeItem('demo_email');
      sessionStorage.removeItem('demo_role');
      sessionStorage.removeItem('demo_tenant_id');
      sessionStorage.removeItem('demo_token');
      window.location.href = '/demo';
    } else {
      await clerkSignOut();
    }
  };

  const resetPasswordEmail = async (_email: string) => {
    console.log('Password reset requested - use Clerk hosted flow');
  };

  const updatePassword = async (newPassword: string) => {
    if (isDemoMode) {
      console.log('Password update not available in demo mode');
      return;
    }
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    await user.updatePassword({ newPassword });
  };

  return {
    user,
    tenantId,
    role,
    isLoading: !isUserLoaded || isLoading,
    isDemoMode,
    signOut,
    resetPasswordEmail,
    updatePassword,
  };
};
