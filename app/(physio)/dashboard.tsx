import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KA } from 'src/constants/strings.ka';
import { useBookings } from 'src/hooks/useBookings';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';

const S = KA.dashboard;

type DashboardProfile = {
  id: string;
  bio: string | null;
  base_district_id: string | null;
  is_verified: boolean;
  base_district: { name_ka: string } | null;
  physio_services: { id: string }[];
};

function isProfileComplete(profile: DashboardProfile): boolean {
  return (
    Boolean(profile.bio?.trim()) &&
    profile.base_district_id !== null &&
    profile.physio_services.length > 0
  );
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
    <View className="w-16 h-16 rounded-full bg-brand-100 items-center justify-center">
      <Text className="text-brand-700 text-xl font-semibold">{initials}</Text>
    </View>
  );
}

export default function Dashboard() {
  const { user, setUser } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const { bookings, loading: bookingsLoading } = useBookings('physio');
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const now = new Date();
  const thisMonthCount = bookings.filter((b) => {
    const d = new Date(b.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function fetchProfile() {
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('physio_profiles')
          .select(
            'id, bio, base_district_id, is_verified, base_district:districts!physio_profiles_base_district_id_fkey(name_ka), physio_services(id)',
          )
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;
        if (!error && data) {
          setProfile(data as unknown as DashboardProfile);
        }

        const { data: userData } = await supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.id)
          .single();

        if (cancelled) return;
        if (userData && userData.avatar_url !== user.avatar_url) {
          setUser({ ...user, avatar_url: userData.avatar_url as string | null });
        }

        setLoading(false);
      }

      fetchProfile();
      return () => { cancelled = true; };
    }, [user, setUser]),
  );

  const firstName = user?.full_name.trim().split(' ')[0] ?? '';
  const complete = profile ? isProfileComplete(profile) : false;

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#3F6690" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-brand-50"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
    >
      <View
        className="bg-brand-900 px-6 rounded-b-[28px] justify-center"
        style={{ paddingTop: insets.top, height: insets.top + 84 }}
      >
        <Text className="text-brand-200 text-xs font-bold tracking-widest uppercase mb-1">
          {KA.patientHome.appName}
        </Text>
        <Text className="text-white text-2xl font-bold">
          {KA.general.welcome} <Text className="text-brand-200">{user?.full_name ?? firstName}</Text>
        </Text>
      </View>

      <View className="px-4 mt-4 gap-4">
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
            {/* Avatar + info, centered */}
            <View className="items-center gap-1">
              <Avatar uri={user?.avatar_url ?? null} fullName={user?.full_name ?? ''} />
              <View className="items-center gap-0.5 mt-2">
                <View className="flex-row items-center justify-center gap-2 flex-wrap">
                  <Text className="text-base font-semibold text-gray-900 text-center">
                    {user?.full_name}
                  </Text>
                  {profile.is_verified && (
                    <View className="bg-brand-100 rounded-full px-2 py-0.5">
                      <Text className="text-brand-700 text-xs font-medium">
                        {S.verifiedBadge}
                      </Text>
                    </View>
                  )}
                </View>
                {profile.base_district && (
                  <Text className="text-sm text-gray-500 text-center">
                    {profile.base_district.name_ka}
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

        {/* ── Stats row ── */}
        <View className="flex-row gap-3">
          <View className="flex-1 bg-amber-50 border border-amber-100 rounded-2xl p-4 items-center">
            {bookingsLoading ? (
              <ActivityIndicator color="#d97706" size="small" />
            ) : (
              <Text className="text-3xl font-bold text-amber-600">{pendingCount}</Text>
            )}
            <Text className="text-xs text-amber-700 mt-1 font-medium">{S.pendingLabel}</Text>
          </View>
          <View className="flex-1 bg-brand-50 border border-brand-100 rounded-2xl p-4 items-center">
            {bookingsLoading ? (
              <ActivityIndicator color="#3F6690" size="small" />
            ) : (
              <Text className="text-3xl font-bold text-brand-600">{thisMonthCount}</Text>
            )}
            <Text className="text-xs text-brand-700 mt-1 font-medium">{S.thisMonthLabel}</Text>
          </View>
        </View>

        {/* ── See all bookings ── */}
        <TouchableOpacity
          onPress={() => router.navigate('/(physio)/bookings')}
          activeOpacity={0.8}
          className="flex-row items-center justify-between bg-white rounded-2xl px-4 py-3.5"
          style={{ shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
        >
          <Text className="text-sm font-semibold text-gray-900">{S.myBookings}</Text>
          <Text className="text-brand-600 text-sm font-medium">{S.seeAll}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
