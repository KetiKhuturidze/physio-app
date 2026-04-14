import '../global.css';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';
import { User } from 'src/types/index';

function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isLoading, setUser, setLoading, logout } = useAuthStore();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    const bootstrap = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        logout();
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();

      if (userError || !userData) {
        logout();
        setLoading(false);
        return;
      }

      setUser(userData as User);
      setLoading(false);
    };

    bootstrap();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        logout();
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userError || !userData) {
          logout();
          return;
        }

        setUser(userData as User);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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
  }, [user, isLoading, segments]);
}

export default function RootLayout() {
  const { isLoading } = useAuthStore();

  useProtectedRoute();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
