import { useEffect } from 'react';
import { ColorValue, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAuthStore from 'src/stores/useAuthStore';
import { KA } from 'src/constants/strings.ka';

const S = KA;

function TabIcon({ name, color, size, focused }: { name: keyof typeof Ionicons.glyphMap; color: ColorValue; size: number; focused: boolean }) {
  return (
    <View style={{ width: 56, height: 32, alignItems: 'center', justifyContent: 'center' }}>
      {focused && (
        <View
          style={{
            position: 'absolute',
            width: 56,
            height: 32,
            backgroundColor: '#EEF3F9',
            borderRadius: 16,
          }}
        />
      )}
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

export default function PhysioLayout() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, isLoading, router]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3F6690',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 10,
          paddingBottom: insets.bottom,
          height: 64 + insets.bottom,
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: S.nav.dashboard,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: S.nav.bookings,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: S.nav.profile,
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} size={size} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="profile-edit" options={{ href: null }} />
      <Tabs.Screen name="availability" options={{ href: null }} />
      <Tabs.Screen name="earnings" options={{ href: null }} />
    </Tabs>
  );
}
