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
import { District } from 'src/types';

const S = KA.physioProfile;
const PV = KA.physioProfileView;

type ServiceAreaRow = {
  district: District;
};

type ProfileViewRow = {
  id: string;
  bio: string | null;
  specialties: string[];
  languages: string[];
  hourly_rate: number | null;
  is_verified: boolean;
  base_district: District | null;
  physio_service_areas: ServiceAreaRow[];
};

function Avatar({ uri, fullName }: { uri: string | null; fullName: string }) {
  const initials = fullName
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  if (uri) {
    return <Image source={{ uri }} className="w-24 h-24 rounded-full bg-gray-200" />;
  }
  return (
    <View className="w-24 h-24 rounded-full bg-green-100 items-center justify-center">
      <Text className="text-green-700 text-2xl font-semibold">{initials}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</Text>;
}

export default function PhysioProfileView() {
  const { user, logout, setUser } = useAuthStore();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileViewRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('physio_profiles')
        .select(`
          id,
          bio,
          specialties,
          languages,
          hourly_rate,
          is_verified,
          base_district:districts!physio_profiles_base_district_id_fkey(id, name_en, name_ka, center),
          physio_service_areas(
            district:districts(id, name_en, name_ka, center)
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) setProfile(data as unknown as ProfileViewRow);

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

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    logout();
    router.replace('/(auth)/login');
  }

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#16a34a" />
      </View>
    );
  }

  const rateString =
    profile?.hourly_rate != null
      ? PV.rateDisplay.replace('{{rate}}', String(profile.hourly_rate))
      : null;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View className="bg-white px-6 pt-14 pb-6 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">{S.title}</Text>
      </View>

      {/* ── Hero ── */}
      <View className="bg-white px-6 pt-6 pb-6 items-center gap-3 border-b border-gray-100">
        <Avatar uri={user?.avatar_url ?? null} fullName={user?.full_name ?? ''} />

        <View className="items-center gap-1.5">
          <Text className="text-xl font-bold text-gray-900">{user?.full_name}</Text>

          {profile?.is_verified && (
            <View className="bg-green-100 rounded-full px-3 py-1">
              <Text className="text-green-700 text-xs font-medium">
                {KA.physioCard.verified}
              </Text>
            </View>
          )}

          {profile?.base_district && (
            <Text className="text-sm text-gray-500">{profile.base_district.name_ka}</Text>
          )}

          {rateString && (
            <View className="bg-green-50 border border-green-100 rounded-full px-5 py-1.5 mt-1">
              <Text className="text-green-700 font-bold text-base">{rateString}</Text>
            </View>
          )}
        </View>
      </View>

      {!profile && (
        <View className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Text className="text-amber-800 text-sm">{S.noProfile}</Text>
        </View>
      )}

      {profile && (
        <View className="px-4 mt-4 gap-4">
          {/* ── Bio ── */}
          {profile.bio && (
            <View className="bg-white rounded-2xl p-4">
              <SectionTitle title={PV.bioTitle} />
              <Text className="text-gray-700 text-sm leading-6">{profile.bio}</Text>
            </View>
          )}

          {/* ── Specialties ── */}
          {profile.specialties.length > 0 && (
            <View className="bg-white rounded-2xl p-4">
              <SectionTitle title={PV.specialtiesTitle} />
              <View className="flex-row flex-wrap gap-2">
                {profile.specialties.map((s) => (
                  <View key={s} className="bg-gray-100 rounded-full px-4 py-2">
                    <Text className="text-gray-700 text-sm">{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Languages ── */}
          {profile.languages.length > 0 && (
            <View className="bg-white rounded-2xl p-4">
              <SectionTitle title={PV.languagesTitle} />
              <View className="flex-row flex-wrap gap-2">
                {profile.languages.map((l) => (
                  <View key={l} className="bg-blue-50 rounded-full px-4 py-2">
                    <Text className="text-blue-700 text-sm">{l}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Service areas ── */}
          {profile.physio_service_areas.length > 0 && (
            <View className="bg-white rounded-2xl p-4">
              <SectionTitle title={PV.serviceAreasTitle} />
              <View className="gap-2">
                {profile.physio_service_areas.map(({ district }) => (
                  <View key={district.id} className="flex-row items-center gap-2">
                    <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <Text className="text-gray-700 text-sm">{district.name_ka}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* ── Actions ── */}
      <View className="px-4 mt-6 gap-3">
        <TouchableOpacity
          onPress={() => router.navigate('/(physio)/profile-edit')}
          activeOpacity={0.8}
          className="bg-green-600 rounded-2xl py-4 items-center"
        >
          <Text className="text-white font-semibold text-base">{S.editButton}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
          className={`rounded-2xl py-4 items-center border ${
            loggingOut ? 'border-red-200 bg-red-50' : 'border-red-300 bg-white'
          }`}
        >
          {loggingOut ? (
            <ActivityIndicator color="#ef4444" />
          ) : (
            <Text className="text-red-600 font-semibold text-base">{S.logoutButton}</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
