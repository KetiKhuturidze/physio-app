import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { KA } from 'src/constants/strings.ka';
import supabase from 'src/lib/supabase';
import { District } from 'src/types';

const S = KA.physioProfileView;

// ─── Raw query types ──────────────────────────────────────────────────────────

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  patient: { full_name: string } | null;
};

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

type PhysioDetailRow = {
  id: string;
  bio: string | null;
  specialties: string[];
  languages: string[];
  base_district_id: string | null;
  is_verified: boolean;
  user: { full_name: string; avatar_url: string | null };
  base_district: District | null;
  physio_service_areas: ServiceAreaRow[];
  physio_services: ServiceRow[];
  reviews: ReviewRow[];
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="text-base font-semibold text-gray-900 mb-3">{title}</Text>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Text
          key={star}
          className={`text-sm ${star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}
        >
          ★
        </Text>
      ))}
    </View>
  );
}

function Avatar({
  uri,
  fullName,
  size,
}: {
  uri: string | null;
  fullName: string;
  size: 'lg';
}) {
  const initials = fullName
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const dim = size === 'lg' ? 'w-24 h-24' : 'w-10 h-10';
  const textSize = size === 'lg' ? 'text-3xl' : 'text-sm';

  if (uri) {
    return (
      <Image source={{ uri }} className={`${dim} rounded-full bg-gray-200`} />
    );
  }
  return (
    <View className={`${dim} rounded-full bg-green-100 items-center justify-center`}>
      <Text className={`${textSize} font-semibold text-green-700`}>{initials}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}.${d.getFullYear()}`;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PhysioProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [physio, setPhysio] = useState<PhysioDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPhysio() {
      if (!id) {
        setError(S.notFound);
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from('physio_profiles')
        .select(`
          id,
          bio,
          specialties,
          languages,
          base_district_id,
          is_verified,
          user:users!physio_profiles_user_id_fkey(full_name, avatar_url),
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
        .eq('id', id)
        .single();

      if (dbError || !data) {
        setError(S.notFound);
        setLoading(false);
        return;
      }

      setPhysio(data as unknown as PhysioDetailRow);
      setLoading(false);
    }

    fetchPhysio();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#16a34a" />
      </View>
    );
  }

  if (error || !physio) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-gray-500 text-base text-center">{error ?? S.notFound}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-green-600 font-medium">{KA.nav.back}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {
    user,
    bio,
    specialties,
    languages,
    is_verified,
    base_district,
    physio_service_areas,
    physio_services,
    reviews,
  } = physio;

  const totalRatings = reviews.length;
  const averageRating =
    totalRatings > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings
      : null;

  const lastThreeReviews = reviews
    .slice()
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  return (
    <View className="flex-1 bg-gray-50">
      {/* ── Back button header ── */}
      <View className="bg-white px-4 pt-14 pb-3 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          className="flex-row items-center gap-1.5"
        >
          <Text className="text-green-600 text-xl">‹</Text>
          <Text className="text-green-600 font-medium">{KA.nav.back}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Hero ── */}
        <View className="bg-white px-6 pt-6 pb-6 items-center gap-3">
          <Avatar uri={user.avatar_url} fullName={user.full_name} size="lg" />

          <View className="items-center gap-1">
            {/* Name + verified badge */}
            <View className="flex-row items-center gap-2 flex-wrap justify-center">
              <Text className="text-xl font-bold text-gray-900">{user.full_name}</Text>
              {is_verified && (
                <View className="bg-green-100 rounded-full px-2.5 py-0.5">
                  <Text className="text-green-700 text-xs font-medium">
                    {KA.physioCard.verified}
                  </Text>
                </View>
              )}
            </View>

            {/* Base district */}
            {base_district && (
              <Text className="text-sm text-gray-500">{base_district.name_ka}</Text>
            )}

            {/* Rating */}
            {averageRating !== null && (
              <View className="flex-row items-center gap-2 mt-1">
                <StarRow rating={averageRating} />
                <Text className="text-sm text-gray-500">
                  {averageRating.toFixed(1)}{' '}
                  <Text className="text-gray-400">
                    ({totalRatings} {KA.physioCard.reviews})
                  </Text>
                </Text>
              </View>
            )}
          </View>

        </View>

        <View className="px-4 mt-4 gap-4">
          {/* ── Bio ── */}
          {bio && (
            <View className="bg-white rounded-2xl p-4">
              <SectionTitle title={S.bioTitle} />
              <Text className="text-gray-700 text-sm leading-6">{bio}</Text>
            </View>
          )}

          {/* ── Services ── */}
          {physio_services.length > 0 && (
            <View className="bg-white rounded-2xl p-4">
              <SectionTitle title={S.servicesTitle} />
              <View className="gap-2">
                {physio_services.map((svc) => (
                  <View key={svc.id} className="border border-gray-100 rounded-xl px-3 py-3 bg-gray-50">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-semibold text-gray-900 flex-1">{svc.name}</Text>
                      <Text className="text-sm font-bold text-green-700">₾{svc.price}</Text>
                    </View>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {svc.duration_minutes} {S.serviceMinutes}
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
          {specialties.length > 0 && (
            <View className="bg-white rounded-2xl p-4">
              <SectionTitle title={S.specialtiesTitle} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {specialties.map((s) => (
                  <View key={s} className="bg-gray-100 rounded-full px-4 py-2">
                    <Text className="text-gray-700 text-sm">{s}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Languages ── */}
          {languages.length > 0 && (
            <View className="bg-white rounded-2xl p-4">
              <SectionTitle title={S.languagesTitle} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {languages.map((l) => (
                  <View key={l} className="bg-blue-50 rounded-full px-4 py-2">
                    <Text className="text-blue-700 text-sm">{l}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Service areas ── */}
          {physio_service_areas.length > 0 && (
            <View className="bg-white rounded-2xl p-4">
              <SectionTitle title={S.serviceAreasTitle} />
              <View className="gap-2">
                {physio_service_areas.map(({ district }) => (
                  <View
                    key={district.id}
                    className="flex-row items-center gap-2"
                  >
                    <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <Text className="text-gray-700 text-sm">{district.name_ka}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Reviews ── */}
          <View className="bg-white rounded-2xl p-4">
            <SectionTitle title={S.reviewsTitle} />
            {lastThreeReviews.length === 0 ? (
              <Text className="text-gray-400 text-sm">{S.noReviewsYet}</Text>
            ) : (
              <View className="gap-4">
                {lastThreeReviews.map((review) => (
                  <View
                    key={review.id}
                    className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                  >
                    <View className="flex-row items-center justify-between mb-1.5">
                      <View className="flex-row items-center gap-2">
                        <StarRow rating={review.rating} />
                        {review.patient && (
                          <Text className="text-sm text-gray-700 font-medium">
                            {review.patient.full_name.split(' ')[0]}
                          </Text>
                        )}
                      </View>
                      <Text className="text-xs text-gray-400">
                        {formatDate(review.created_at)}
                      </Text>
                    </View>
                    {review.comment && (
                      <Text className="text-sm text-gray-600 leading-5">
                        {review.comment}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── Fixed book button ── */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-3 pb-8">
        <TouchableOpacity
          onPress={() => router.push(`/(patient)/book/${physio.id}`)}
          activeOpacity={0.85}
          className="bg-green-600 rounded-2xl py-4 items-center"
        >
          <Text className="text-white font-semibold text-base">{S.bookButton}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
