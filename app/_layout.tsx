import 'react-native-url-polyfill/auto';
import '../global.css';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerForPushNotifications } from 'src/lib/notifications';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';
import { User } from 'src/types/index';

function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading, setUser, setLoading, logout } = useAuthStore();
  const navigationState = useRootNavigationState();

  // Safety net: if loading never resolves (e.g. network hang on Android), unblock after 10s
  useEffect(() => {
    if (!isLoading) return;
    const timeout = setTimeout(() => {
      console.warn('[Auth] Loading timeout — forcing logout');
      logout();
      setLoading(false);
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isLoading, logout, setLoading]);

  useEffect(() => {
    async function fetchUser(userId: string): Promise<User | null> {
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // On Android (especially Samsung), the Supabase query can hang indefinitely
      // on a slow/offline network. Race it against a 6s timeout so the 10s safety
      // net above is a last resort rather than the first line of defence.
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('query timeout') }), 6000),
      );

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      if (error || !data) return null;
      return data as User;
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (!session) {
          logout();
          setLoading(false);
          return;
        }

        const u = await fetchUser(session.user.id);
        if (!u) {
          logout();
          setLoading(false);
          return;
        }

        setUser(u);
        registerForPushNotifications(u.id);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (!session) return;
        const u = await fetchUser(session.user.id);
        if (!u) { logout(); return; }
        setUser(u);
        registerForPushNotifications(u.id);
        return;
      }

      if (event === 'SIGNED_OUT') {
        logout();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
    // Zustand actions (logout, setLoading, setUser) are stable references —
    // listing them satisfies exhaustive-deps without risking re-subscription.
  }, [logout, setLoading, setUser]);

  useEffect(() => {
    if (!navigationState?.key) return;
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user) {
      if (!inAuthGroup) router.replace('/(auth)/login');
      return;
    }

    if (user.role === 'patient') {
      if (segments[0] !== '(patient)') router.replace('/(patient)/home');
      return;
    }

    if (user.role === 'physio') {
      if (segments[0] !== '(physio)') router.replace('/(physio)/dashboard');
      return;
    }
  }, [user, isLoading, segments, navigationState?.key, router]);
}

export default function RootLayout() {
  const { isLoading } = useAuthStore();

  useProtectedRoute();

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
