import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BookingCard from 'src/components/BookingCard';
import { KA } from 'src/constants/strings.ka';
import { useBookings } from 'src/hooks/useBookings';

const S = KA.patientBookings;

export default function PatientBookings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookings, loading, error, refetch } = useBookings('patient');

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
        {error && (
          <View className="mx-4 mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        )}

        {/* ── Empty state ── */}
        {!error && bookings.length === 0 && (
          <View className="flex-1 items-center justify-center px-8 mt-16">
            <Text className="text-gray-400 text-base text-center mb-2">{S.empty}</Text>
            <Text className="text-gray-400 text-sm text-center mb-6">{S.emptySubtitle}</Text>
            <TouchableOpacity
              onPress={() => router.replace('/(patient)/home')}
              activeOpacity={0.8}
              className="bg-teal-600 rounded-2xl px-6 py-3"
            >
              <Text className="text-white font-semibold text-sm">{KA.patientHome.findPhysio}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Bookings list ── */}
        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            role="patient"
            onReview={
              booking.status === 'completed'
                ? () => router.push(`/(patient)/review/${booking.id}`)
                : undefined
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}
