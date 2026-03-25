import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { createMobileSupabaseClient } from '../lib/supabase/client.mobile';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createMobileSupabaseClient();

  useEffect(() => {
    registerForPushNotifications();

    const notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      notificationSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const registerForPushNotifications = async () => {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for push notifications');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID!,
      });

      if (session?.user?.id) {
        await registerPushToken(tokenData.data);
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const registerPushToken = async (token: string) => {
    try {
      const { data: existingToken, error: fetchError } = await supabase
        .from('push_tokens')
        .select('id')
        .eq('profile_id', session?.user?.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing push token:', fetchError);
        return;
      }

      if (existingToken) {
        const { error: updateError } = await supabase
          .from('push_tokens')
          .update({
            expo_push_token: token,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingToken.id);

        if (updateError) {
          console.error('Error updating push token:', updateError);
        }
      } else {
        const { error: insertError } = await supabase
          .from('push_tokens')
          .insert({
            profile_id: session?.user?.id,
            expo_push_token: token,
            platform: Device.getDeviceType() === Device.DeviceType.Tablet ? 'ios' : 'android',
          });

        if (insertError) {
          console.error('Error inserting push token:', insertError);
        }
      }
    } catch (error) {
      console.error('Error in registerPushToken:', error);
    }
  };

  const unregisterPushToken = async () => {
    try {
      if (session?.user?.id) {
        const { error } = await supabase
          .from('push_tokens')
          .delete()
          .eq('profile_id', session?.user?.id);

        if (error) {
          console.error('Error removing push token:', error);
        }
      }
    } catch (error) {
      console.error('Error in unregisterPushToken:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user?.id) {
        registerForPushNotifications();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user?.id) {
        registerForPushNotifications();
      } else {
        unregisterPushToken();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};