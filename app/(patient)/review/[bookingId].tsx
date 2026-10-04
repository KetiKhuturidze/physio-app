import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KA } from 'src/constants/strings.ka';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';

const S = KA.reviewScreen;

type BookingInfo = {
  physio_id: string;
  physio_name: string;
  service_name: string | null;
};

function StarPicker({ value, onChange }: { value: number; onChange: (r: number) => void }) {
  return (
    <View className="flex-row gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} hitSlop={8} activeOpacity={0.7}>
          <Text className={`text-4xl ${star <= value ? 'text-amber-400' : 'text-gray-200'}`}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ReviewScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setLoadError(KA.errors.notFound);
      setLoading(false);
      return;
    }

    async function load() {
      const [bookingRes, reviewRes] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            physio_id,
            service_id,
            physio_profile:physio_profiles!bookings_physio_id_fkey(
              user:users!physio_profiles_user_id_fkey(full_name)
            )
          `)
          .eq('id', bookingId)
          .single(),
        supabase
          .from('reviews')
          .select('id')
          .eq('booking_id', bookingId)
          .maybeSingle(),
      ]);

      if (bookingRes.error || !bookingRes.data) {
        setLoadError(KA.errors.generic);
        setLoading(false);
        return;
      }

      const raw = bookingRes.data as unknown as {
        physio_id: string;
        service_id: string | null;
        physio_profile: { user: { full_name: string } } | null;
      };

      // Fetch service name separately to avoid FK ambiguity in PostgREST
      let serviceName: string | null = null;
      if (raw.service_id) {
        const { data: svcData } = await supabase
          .from('physio_services')
          .select('name')
          .eq('id', raw.service_id)
          .single();
        serviceName = (svcData as { name: string } | null)?.name ?? null;
      }

      setBookingInfo({
        physio_id: raw.physio_id,
        physio_name: raw.physio_profile?.user?.full_name ?? '—',
        service_name: serviceName,
      });

      if (reviewRes.data) {
        setAlreadyReviewed(true);
      }

      setLoading(false);
    }

    load();
  }, [bookingId]);

  async function handleSubmit() {
    if (!user || !bookingInfo || !bookingId) return;

    if (rating === 0) {
      setSubmitError(S.ratingRequired);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const { error } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      patient_id: user.id,
      physio_id: bookingInfo.physio_id,
      rating,
      comment: comment.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(S.submitError);
      return;
    }

    setSubmitted(true);
  }

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#3F6690" />
      </View>
    );
  }

  if (loadError) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-gray-500 text-base text-center">{loadError}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-brand-600 font-medium">{KA.nav.back}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-brand-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Header ── */}
      <View className="bg-brand-600 px-4 pb-4 flex-row items-center gap-3" style={{ paddingTop: insets.top + 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          className="flex-row items-center gap-1"
        >
          <Text className="text-white text-xl">‹</Text>
          <Text className="text-brand-100 font-medium">{KA.nav.back}</Text>
        </TouchableOpacity>
        <Text className="text-white text-base font-bold flex-1" numberOfLines={1}>
          {S.title}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 mt-5 gap-4">
          {/* ── Physio & service info ── */}
          <View className="bg-white rounded-2xl p-4">
            <Text className="text-base font-semibold text-gray-900">{bookingInfo?.physio_name}</Text>
            {bookingInfo?.service_name && (
              <Text className="text-sm text-gray-500 mt-0.5">{bookingInfo.service_name}</Text>
            )}
          </View>

          {/* ── Already reviewed ── */}
          {alreadyReviewed && (
            <View className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 items-center">
              <Text className="text-amber-800 text-sm font-medium">{S.alreadyReviewed}</Text>
              <TouchableOpacity onPress={() => router.back()} className="mt-3">
                <Text className="text-brand-600 font-medium text-sm">{KA.nav.back}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Success state ── */}
          {submitted && !alreadyReviewed && (
            <View className="bg-brand-50 border border-brand-200 rounded-2xl px-6 py-8 items-center gap-3">
              <Text className="text-amber-400 text-4xl">★</Text>
              <Text className="text-lg font-bold text-brand-800">{S.successTitle}</Text>
              <Text className="text-sm text-brand-700 text-center">{S.successMessage}</Text>
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.8}
                className="mt-2 bg-accent-600 rounded-2xl px-8 py-3"
              >
                <Text className="text-white font-semibold">{KA.nav.back}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Review form ── */}
          {!alreadyReviewed && !submitted && (
            <>
              {submitError && (
                <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <Text className="text-red-700 text-sm">{submitError}</Text>
                </View>
              )}

              {/* Stars */}
              <View className="bg-white rounded-2xl p-4 items-center gap-3">
                <Text className="text-sm font-medium text-gray-700">{S.ratingLabel}</Text>
                <StarPicker value={rating} onChange={(r) => { setRating(r); setSubmitError(null); }} />
              </View>

              {/* Comment */}
              <View className="bg-white rounded-2xl p-4">
                <Text className="text-sm font-medium text-gray-700 mb-1.5">{S.commentLabel}</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm min-h-[100px]"
                  value={comment}
                  onChangeText={setComment}
                  placeholder={S.commentPlaceholder}
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
                className={`rounded-2xl py-4 items-center ${
                  submitting ? 'bg-accent-300' : 'bg-accent-600'
                }`}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold text-base">{S.submitButton}</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
