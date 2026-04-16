import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { KA } from 'src/constants/strings.ka';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';

const S = KA.dashboard;

type DashboardProfile = {
  id: string;
  bio: string | null;
  hourly_rate: number | null;
  base_district_id: string | null;
  is_verified: boolean;
  base_district: { name_ka: string } | null;
};

function isProfileComplete(profile: DashboardProfile): boolean {
  return Boolean(profile.bio?.trim()) && profile.base_district_id !== null;
}

function Avatar({ uri, fullName }: { uri: string | null; fullName: string }) {
  const initials = fullName
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  if (uri) {
    return <Image source={{ uri }} className="w-16 h-16 rounded-full bg-gray-200" />;
  }
  return (
    <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center">
      <Text className="text-green-700 text-xl font-semibold">{initials}</Text>
    </View>
  );
}

export default function Dashboard() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();

  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('physio_profiles')
        .select(
          'id, bio, hourly_rate, base_district_id, is_verified, base_district:districts!physio_profiles_base_district_id_fkey(name_ka)',
        )
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data as unknown as DashboardProfile);
      }

      // Fresh-fetch avatar_url to catch updates from previous sessions
      const { data: userData } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (userData && userData.avatar_url !== user.avatar_url) {
        setUser({ ...user, avatar_url: userData.avatar_url as string | null });
      }

      setLoading(false);
    }

    fetchProfile();
  }, [user, setUser]);

  const firstName = user?.full_name.trim().split(' ')[0] ?? '';
  const complete = profile ? isProfileComplete(profile) : false;

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#16a34a" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View className="bg-white px-6 pt-14 pb-6 border-b border-gray-100">
        <Text className="text-sm text-gray-500 mb-0.5">{KA.general.welcome}</Text>
        <Text className="text-2xl font-bold text-gray-900">{firstName}</Text>
      </View>

      <View className="px-4 mt-5 gap-4">
        {/* ── Incomplete warning ── */}
        {(!profile || !complete) && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 gap-3">
            <View className="gap-1">
              <Text className="text-amber-900 font-semibold text-base">
                {S.incompleteTitle}
              </Text>
              <Text className="text-amber-800 text-sm">{S.incompleteBody}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.navigate('/(physio)/profile-edit')}
              activeOpacity={0.8}
              className="self-start bg-amber-500 rounded-xl px-5 py-2.5"
            >
              <Text className="text-white font-semibold text-sm">
                {S.completeProfileButton}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Profile summary card ── */}
        {profile && complete && (
          <View className="bg-white rounded-2xl p-4 gap-4">
            {/* Avatar + info row */}
            <View className="flex-row items-center gap-4">
              <Avatar uri={user?.avatar_url ?? null} fullName={user?.full_name ?? ''} />
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2 flex-wrap">
                  <Text className="text-base font-semibold text-gray-900">
                    {user?.full_name}
                  </Text>
                  {profile.is_verified && (
                    <View className="bg-green-100 rounded-full px-2 py-0.5">
                      <Text className="text-green-700 text-xs font-medium">
                        {S.verifiedBadge}
                      </Text>
                    </View>
                  )}
                </View>
                {profile.base_district && (
                  <Text className="text-sm text-gray-500">
                    {profile.base_district.name_ka}
                  </Text>
                )}
                {profile.hourly_rate != null && (
                  <Text className="text-sm font-semibold text-green-700">
                    ₾{profile.hourly_rate}
                    {S.perHour}
                  </Text>
                )}
              </View>
            </View>

            {/* Edit profile button */}
            <TouchableOpacity
              onPress={() => router.navigate('/(physio)/profile-edit')}
              activeOpacity={0.8}
              className="border border-gray-200 rounded-xl py-3 items-center"
            >
              <Text className="text-gray-700 font-medium text-sm">
                {S.editProfileButton}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── My bookings (shell) ── */}
        <View className="bg-white rounded-2xl p-4 gap-3">
          <Text className="text-base font-semibold text-gray-900">{S.myBookings}</Text>
          <View className="py-6 items-center">
            <Text className="text-gray-400 text-sm">{S.bookingsComingSoon}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
