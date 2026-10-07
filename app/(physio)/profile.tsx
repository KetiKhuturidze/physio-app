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
import { deleteAccount } from 'src/hooks/useAccount';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';
import { District } from 'src/types';

const S = KA.physioProfile;
const PV = KA.physioProfileView;

type ServiceAreaRow = {
  district: District;
};

type ServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  patient: { full_name: string } | null;
};

type CertRow = {
  id: string;
  name: string;
  file_url: string;
};

type ProfileViewRow = {
  id: string;
  bio: string | null;
  specialties: string[];
  languages: string[];
  available_hours: string | null;
  is_verified: boolean;
  base_district: District | null;
  physio_service_areas: ServiceAreaRow[];
  physio_services: ServiceRow[];
  reviews: ReviewRow[];
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
    return (
      <Image
        source={{ uri }}
        className="w-24 h-24 rounded-full"
        style={{ borderWidth: 3, borderColor: '#DCE6F0' }}
      />
    );
  }
  return (
    <View
      className="w-24 h-24 rounded-full bg-brand-100 items-center justify-center"
      style={{ borderWidth: 3, borderColor: '#DCE6F0' }}
    >
      <Text className="text-brand-700 text-3xl font-bold">{initials}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</Text>;
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} className={`text-sm ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}>★</Text>
      ))}
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
}

export default function PhysioProfileView() {
  const { user, logout, setUser } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<ProfileViewRow | null>(null);
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function fetchProfile() {
        if (!user) { setLoading(false); return; }

        const { data } = await supabase
          .from('physio_profiles')
          .select(`
            id,
            bio,
            specialties,
            languages,
            available_hours,
            is_verified,
            base_district:districts!physio_profiles_base_district_id_fkey(id, name_en, name_ka, center),
            physio_service_areas(
              district:districts(id, name_en, name_ka, center)
            ),
            physio_services(id, name, duration_minutes, price, description),
            reviews(
              id, rating, comment, created_at,
              patient:users!reviews_patient_id_fkey(full_name)
            )
          `)
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;
        if (data) {
          setProfile(data as unknown as ProfileViewRow);
          const { data: certData, error: certError } = await supabase
            .from('physio_certificates')
            .select('id, name, file_url')
            .eq('physio_id', data.id);
          // Non-fatal — certificate list is supplementary, profile still renders without it
          if (!cancelled) setCerts(certError ? [] : (certData ?? []));
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

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return;
      logout();
      router.replace('/(auth)/login');
    } finally {
      setLoggingOut(false);
    }
  }

  async function handleDeleteAccount() {
    setDeletingAccount(true);
    setDeleteError(false);
    const ok = await deleteAccount();
    if (!ok) {
      setDeleteError(true);
      setDeletingAccount(false);
      return;
    }
    await supabase.auth.signOut();
    logout();
    router.replace('/(auth)/login');
  }

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
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
    >
      <View
        className="bg-brand-900 px-6 rounded-b-[28px] justify-center"
        style={{ paddingTop: insets.top, height: insets.top + 84 }}
      >
        <Text className="text-brand-200 text-sm font-bold tracking-widest uppercase">
          {KA.patientHome.appName}
        </Text>
      </View>

      <View
        className="mx-4 mt-4 bg-white rounded-2xl p-5 items-center"
        style={{
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        <Avatar uri={user?.avatar_url ?? null} fullName={user?.full_name ?? ''} />
        <View className="items-center mt-3 gap-1.5">
          <Text className="text-gray-900 text-xl font-bold">{user?.full_name}</Text>
          {profile?.base_district && (
            <Text className="text-gray-500 text-sm">{profile.base_district.name_ka}</Text>
          )}
          {profile?.is_verified && (
            <View className="bg-accent-100 rounded-full px-3 py-1 mt-1">
              <Text className="text-accent-700 text-xs font-semibold">{KA.physioCard.verified}</Text>
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

          {/* ── Services ── */}
          {profile.physio_services.length > 0 && (
            <View className="bg-white rounded-2xl p-4">
              <SectionTitle title={PV.servicesTitle} />
              <View className="gap-2">
                {profile.physio_services.map((svc) => (
                  <View key={svc.id} className="border border-gray-100 rounded-xl px-3 py-3 bg-gray-50">
                    <Text className="text-sm font-semibold text-gray-900">{svc.name}</Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {svc.duration_minutes} {PV.serviceMinutes} · ₾{svc.price}
                    </Text>
                    {svc.description && (
                      <Text className="text-xs text-gray-400 mt-0.5">{svc.description}</Text>
                    )}
                  </View>
                ))}
              </View>
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

          {/* ── Available hours ── */}
          {profile.available_hours && (
            <View className="bg-white rounded-2xl p-4">
              <SectionTitle title={PV.availableHoursTitle} />
              <Text className="text-gray-700 text-sm leading-6">{profile.available_hours}</Text>
            </View>
          )}

          {/* ── Service areas ── */}
          {profile.physio_service_areas.length > 0 && (
            <View className="bg-white rounded-2xl p-4">
              <SectionTitle title={PV.serviceAreasTitle} />
              <View className="gap-2">
                {profile.physio_service_areas.map(({ district }) => (
                  <View key={district.id} className="flex-row items-center gap-2">
                    <View className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                    <Text className="text-gray-700 text-sm">{district.name_ka}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Certificates ── */}
          {certs.length > 0 && (
            <View className="bg-white rounded-2xl p-4">
              <SectionTitle title={PV.certificatesTitle} />
              <View className="gap-2">
                {certs.map((cert) => (
                  <View
                    key={cert.id}
                    className="flex-row items-center gap-3 border border-gray-100 rounded-xl p-3 bg-gray-50"
                  >
                    <Image
                      source={{ uri: cert.file_url }}
                      className="w-14 h-14 rounded-lg bg-gray-200"
                      resizeMode="cover"
                    />
                    <Text className="text-sm font-medium text-gray-700 flex-1" numberOfLines={2}>
                      {cert.name}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Reviews ── */}
          <View className="bg-white rounded-2xl p-4">
            <SectionTitle title={PV.reviewsTitle} />
            {profile.reviews.length === 0 ? (
              <Text className="text-gray-400 text-sm">{PV.noReviewsYet}</Text>
            ) : (
              <View className="gap-4">
                {profile.reviews
                  .slice()
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((review) => (
                    <View key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center gap-2">
                          <StarRow rating={review.rating} />
                          {review.patient && (
                            <Text className="text-sm text-gray-700 font-medium">
                              {review.patient.full_name.split(' ')[0]}
                            </Text>
                          )}
                        </View>
                        <Text className="text-xs text-gray-400">{formatDate(review.created_at)}</Text>
                      </View>
                      {review.comment && (
                        <Text className="text-sm text-gray-600 leading-5">{review.comment}</Text>
                      )}
                    </View>
                  ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* ── Actions ── */}
      <View className="px-4 mt-6 gap-3">
        <TouchableOpacity
          onPress={() => router.navigate('/(physio)/profile-edit')}
          activeOpacity={0.8}
          className="bg-brand-600 rounded-2xl py-4 items-center"
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

        {/* ── Delete account ── */}
        {deleteError && (
          <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <Text className="text-red-700 text-sm">{S.deleteAccountError}</Text>
          </View>
        )}
        {deleteConfirming ? (
          <View className="bg-red-50 border border-red-200 rounded-2xl p-4 gap-3">
            <Text className="text-red-800 text-sm leading-5">{S.deleteAccountWarning}</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setDeleteConfirming(false)}
                disabled={deletingAccount}
                activeOpacity={0.8}
                className="flex-1 rounded-xl py-3 items-center border border-gray-300 bg-white"
              >
                <Text className="text-gray-700 font-semibold text-sm">{S.deleteAccountCancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deletingAccount}
                activeOpacity={0.8}
                className="flex-1 rounded-xl py-3 items-center bg-red-600"
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold text-sm">{S.deleteAccountConfirm}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setDeleteConfirming(true)}
            activeOpacity={0.8}
            className="items-center py-2"
          >
            <Text className="text-red-400 text-sm">{S.deleteAccountButton}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
