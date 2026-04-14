import { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';
import { KA } from 'src/constants/strings.ka';

const S = KA;

export default function ProfileEdit() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <View className="flex-1 bg-white px-6 pt-16">
      <Text className="text-2xl font-bold text-gray-900 mb-1">
        {S.nav.profile}
      </Text>

      <View className="mt-10 bg-gray-50 rounded-2xl px-5 py-6">
        <Text className="text-base text-gray-500 mb-1">
          {user?.full_name ?? '—'}
        </Text>
        <Text className="text-2xl font-bold text-gray-900">
          {user?.full_name ?? '—'}
        </Text>
        <View className="mt-3 self-start bg-teal-100 rounded-full px-3 py-1">
          <Text className="text-teal-700 text-xs font-medium">
            {S.auth.register.rolePhysio}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        className={`mt-8 rounded-xl py-4 items-center ${
          isLoading ? 'bg-red-300' : 'bg-red-500'
        }`}
        onPress={handleLogout}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white font-semibold text-base">
            {S.nav.logout}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
