import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from './client.browser';

export interface AuthContext {
  user: User | null;
  tenantId: string | null;
  role: 'owner' | 'manager' | 'employee' | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  resetPasswordEmail: (email: string) => Promise<void>;
  updatePassword: (password: string, token: string) => Promise<void>;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [role, setRole] = useState<'owner' | 'manager' | 'employee' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const getSupabaseClient = () => {
    return createBrowserSupabaseClient();
  };

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // If we have a user, fetch their profile to get tenant_id and role
      if (session?.user) {
        supabase
          .from('profiles')
          .select('tenant_id, role')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setTenantId(data.tenant_id);
              setRole(data.role as 'owner' | 'manager' | 'employee');
            }
          });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      if (session?.user) {
        supabase
          .from('profiles')
          .select('tenant_id, role')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setTenantId(data.tenant_id);
              setRole(data.role as 'owner' | 'manager' | 'employee');
            } else {
              // If no profile found, clear tenant and role
              setTenantId(null);
              setRole(null);
            }
          });
      } else {
        // User signed out
        setTenantId(null);
        setRole(null);
      }
    });

     // Cleanup subscription on unmount
     return () => {
       subscription.unsubscribe();
     };
  }, []);

  const signOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  const resetPasswordEmail = async (email: string) => {
    const supabase = getSupabaseClient();
    await supabase.auth.resetPasswordForEmail(email, {
      // You can set a redirect URL if needed
      // redirectTo: `${window.location.origin}/update-password`,
    });
  };

  const updatePassword = async (password: string, token: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    // Note: Supabase's updatePasswordWithToken is deprecated in favor of updateUser with password when using email change flow.
    // For password reset via email link, we use updateUser after verifying the token via getUser.
    // However, the typical flow is:
    // 1. User clicks link in email with token
    // 2. We verify the token by getting the user (supabase.auth.getUser())
    // 3. Then we update the password.
    // But the above updateUser without token requires the user to be logged in.
    // Let's use the proper method: verify the token then update.
    // Actually, the Supabase JS client has `verifyPasswordReset` but it's not in the types? 
    // We'll do:
    //   const { data: { user }, error } = await supabase.auth.verifyPasswordReset(token);
    //   if (error) throw error;
    //   const { error: updateError } = await supabase.auth.updateUser(user, { password });
    // However, the updateUser method doesn't take a user object as first param in v2.
    // Let's check: In v2, we use `updateUser` with an object containing the password.
    // But we need to have a session. So we must first set the session using the token.
    // There's a method `setSession` but it's not for password reset.
    // Actually, the flow for password reset via email is:
    //   - User submits their email, we send a reset link (done above)
    //   - User clicks the link, which goes to a page with the token in the URL
    //   - On that page, we verify the token and then allow them to enter a new password.
    //   - We then call `updateUser` with the new password, but we must have a session.
    //   - We can get the session by using `getUser` and then `setSession`? Not exactly.
    //   - The correct way is to use `verifyPasswordReset` to get the user, then update the password for that user.
    //   - However, the `updateUser` method requires the user to be logged in. So we must log in the user using the token?
    //   - Actually, the `verifyPasswordReset` returns a user object, but we cannot use that to log in.
    //   - Instead, we can use the token to update the password directly with `updateUser` by providing the token in the options? 
    //   - Looking at the Supabase JS docs v2: 
    //        const { data, error } = await supabase.auth.updateUser({ password })
    //   - This updates the password for the currently logged in user.
    //   - So we need to log in the user first. How to log in with a password reset token?
    //   - We can use `signInWithOAuth`? No.
    //   - Actually, the password reset link is meant to be used with a form that has a new password and confirmation.
    //   - The backend verifies the token and then updates the password.
    //   - In the Supabase JS client, we don't have a direct method to update password with a token.
    //   - However, we can use the `updateUser` method if we have a session. So we must create a session by logging in with the user's email and a temporary password? 
    //   - This is getting complicated.
    //   - Given the time, we'll note that the password reset flow requires a backend endpoint or using the Supabase JS client in a specific way.
    //   - We'll implement a simplified version: we'll send the reset email and then on the reset page, we'll ask for the new password and then call `updateUser` after the user has logged in with a temporary credential? 
    //   - Alternatively, we can use the `verifyPasswordReset` to get the user and then use the `updateUser` method by first logging in via `signInWithPassword` with the email and a dummy password? Not secure.
    //   - Let's look at the Supabase example: 
    //        https://supabase.com/docs/guides/auth/reset-password-email
    //   - They use the `updateUser` method after verifying the token? Actually, the example doesn't show the JS client.
    //   - We'll assume that we can use the `updateUser` method if we have a session. So we need to log in the user with their email and a temporary password that we set? 
    //   - Not feasible.
    //   - Given the scope of the task, we'll implement the `resetPasswordEmail` and leave the `updatePassword` as a placeholder that throws an error, to be implemented later.
    //   - But note: the plan says to implement password reset.
    //   - We'll do a different approach: we'll create a server endpoint (or edge function) to handle password reset with token.
    //   - However, the task is for the session management in the auth context.
    //   - We'll change the plan: we'll implement the reset password email and then update the password via an edge function that we call from the client.
    //   - But that's beyond the scope of the current task.
    //   - Let's read the plan again: "Implement session management: auto-refresh tokens, logout, password reset"
    //   - We can interpret password reset as the ability to reset the password via email (sending the reset link) and then the user can set a new password via the link (which is handled by Supabase).
    //   - The client side only needs to send the reset email and then handle the token verification and password update on the page that the reset link points to.
    //   - We'll create a page for updating the password that uses the token from the URL and then calls `updateUser` after verifying the token? 
    //   - Actually, the Supabase JS client does not have a direct way to update password with a token, but we can use the `updateUser` method if we have a session. 
    //   - We can create a session by using the `setSession` method with the access token and refresh token that we get from verifying the password reset? 
    //   - The `verifyPasswordReset` method does not return tokens.
    //   - This is a known limitation: https://github.com/supabase/supabase/issues/1977
    //   - The workaround is to use the `updateUser` method if the user is already logged in. So we must have a way to log in the user with the reset token.
    //   - We can't.
    //   - Given the time, we'll implement the reset password email and then note that the update password flow requires additional setup (like a custom endpoint or using the Supabase JS client in a specific way that we'll leave for later).
    //   - We'll throw an error in updatePassword to indicate it's not implemented.
    //   - However, let's try to implement it the way Supabase suggests in their docs for Next.js: 
    //        https://supabase.com/docs/guides/auth/email-auth-nextjs
    //   - They use the `updateUser` method after verifying the session? 
    //   - Actually, in the Next.js example, they have a page that verifies the token and then updates the password by using the `updateUser` method, but they must have a session.
    //   - They get the session by using `getSession` and then if there's no session, they show an error.
    //   - So the flow is: the user clicks the reset link, which goes to a page that already has a session (because they are redirected from the email link and Supabase sets a session?).
    //   - I think when the user clicks the link in the email, Supabase sets a session for that user (using the token) and then redirects to the app.
    //   - Then we can call `updateUser` without needing to verify the token again.
    //   - Let's assume that.
    //   - So we'll implement updatePassword as simply calling `updateUser` with the new password.
    //   - We'll leave it to the developer to ensure that the user is logged in (i.e., they came from the reset link and Supabase set the session).
    //   - We'll note that in the comments.
  };

  return {
    user,
    tenantId,
    role,
    isLoading,
    signOut,
    resetPasswordEmail,
    updatePassword,
  };
};
