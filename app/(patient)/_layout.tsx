import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import useAuthStore from 'src/stores/useAuthStore';
import { KA } from 'src/constants/strings.ka';

const S = KA;

export default function PatientLayout() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f3f4f6',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: S.nav.home }}
      />
      <Tabs.Screen
        name="bookings"
        options={{ title: S.nav.bookings }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: S.nav.profile }}
      />
      <Tabs.Screen name="physio/[id]" options={{ href: null }} />
      <Tabs.Screen name="book/[physioId]" options={{ href: null }} />
      <Tabs.Screen name="quiz" options={{ href: null }} />
      <Tabs.Screen name="map" options={{ href: null }} />
    </Tabs>
  );
}
