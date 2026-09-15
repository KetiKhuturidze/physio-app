import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BookingCard from 'src/components/BookingCard';
import { KA } from 'src/constants/strings.ka';
import { useBookings, updateBookingStatus } from 'src/hooks/useBookings';
import { BookingWithJoins } from 'src/types';

const S = KA.physioBookings;

export default function PhysioBookings() {
  const insets = useSafeAreaInsets();
  const { bookings, loading, error, refetch } = useBookings('physio');
  const [actionBookingId, setActionBookingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleAction(booking: BookingWithJoins, action: 'confirmed' | 'declined') {
    setActionBookingId(booking.id);
    setActionError(null);
    const ok = await updateBookingStatus(booking.id, action);
    setActionBookingId(null);
    if (!ok) {
      setActionError(KA.errors.generic);
      return;
    }
    refetch();
  }

  const pending = bookings.filter((b) => b.status === 'pending');
  const others = bookings.filter((b) => b.status !== 'pending');

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator color="#0891b2" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* ── Teal header ── */}
      <LinearGradient
        colors={['#0c4a6e', '#0891b2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pb-5"
        style={{ paddingTop: insets.top + 20 }}
      >
        <Text className="text-white text-2xl font-bold">{S.title}</Text>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor="#0891b2" />
        }
      >
        {/* ── Error ── */}
        {(error || actionError) && (
          <View className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <Text className="text-red-700 text-sm">{error ?? actionError}</Text>
          </View>
        )}

        {/* ── Empty state ── */}
        {!error && bookings.length === 0 && (
          <View className="flex-1 items-center justify-center px-8 mt-16">
            <Text className="text-gray-400 text-base text-center mb-2">{S.empty}</Text>
            <Text className="text-gray-400 text-sm text-center">{S.emptySubtitle}</Text>
          </View>
        )}

        {/* ── Pending bookings ── */}
        {pending.length > 0 && (
          <>
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 mb-2">
              {S.pendingSection}
            </Text>
            {pending.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                role="physio"
                actionLoading={actionBookingId === booking.id}
                onConfirm={() => handleAction(booking, 'confirmed')}
                onDecline={() => handleAction(booking, 'declined')}
              />
            ))}
          </>
        )}

        {/* ── History ── */}
        {others.length > 0 && (
          <>
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 mb-2 mt-4">
              {S.otherSection}
            </Text>
            {others.map((booking) => (
              <BookingCard key={booking.id} booking={booking} role="physio" />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
