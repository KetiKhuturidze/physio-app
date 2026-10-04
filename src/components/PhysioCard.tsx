import { Image, Text, TouchableOpacity, View } from 'react-native';

import { KA } from 'src/constants/strings.ka';
import { PhysioWithJoins } from 'src/types';

type Props = {
  physio: PhysioWithJoins;
  onPress: () => void;
};

function getInitials(fullName: string): string {
  return fullName
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

function Avatar({ fullName, avatarUrl }: { fullName: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        className="w-16 h-16 rounded-full"
        style={{ borderWidth: 2, borderColor: '#DCE6F0' }}
      />
    );
  }
  return (
    <View
      className="w-16 h-16 rounded-full bg-brand-100 items-center justify-center"
      style={{ borderWidth: 2, borderColor: '#DCE6F0' }}
    >
      <Text className="text-brand-700 text-lg font-bold">
        {getInitials(fullName)}
      </Text>
    </View>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} className={`text-xs ${s <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`}>
          ★
        </Text>
      ))}
    </View>
  );
}

export default function PhysioCard({ physio, onPress }: Props) {
  const { user, base_district, specialties, is_verified, average_rating, review_count } = physio;

  const visibleSpecialties = specialties.slice(0, 2);
  const extraCount = specialties.length - 2;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="bg-white mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* ── Main row ── */}
      <View className="p-4 flex-row items-start gap-3">
        <Avatar fullName={user.full_name} avatarUrl={user.avatar_url} />

        <View className="flex-1">
          {/* Name + verified */}
          <View className="flex-row items-center gap-1.5 flex-wrap mb-0.5">
            <Text className="text-base font-bold text-gray-900">{user.full_name}</Text>
            {is_verified && (
              <View className="bg-accent-600 rounded-full w-4 h-4 items-center justify-center">
                <Text className="text-white text-xs font-bold" style={{ fontSize: 9 }}>✓</Text>
              </View>
            )}
          </View>

          {/* District */}
          <Text className="text-sm text-gray-400 mb-2">{base_district.name_ka}</Text>

          {/* Rating */}
          {average_rating != null && (
            <View className="flex-row items-center gap-1.5 mb-2">
              <Stars rating={average_rating} />
              <Text className="text-xs font-semibold text-amber-500">
                {average_rating.toFixed(1)}
              </Text>
              {review_count != null && review_count > 0 && (
                <Text className="text-xs text-gray-400">
                  ({review_count} {KA.physioCard.reviews})
                </Text>
              )}
            </View>
          )}

          {/* Specialties */}
          {visibleSpecialties.length > 0 && (
            <View className="flex-row flex-wrap gap-1">
              {visibleSpecialties.map((s) => (
                <View key={s} className="bg-brand-100 rounded-full px-2.5 py-0.5">
                  <Text className="text-xs text-brand-700 font-medium">{s}</Text>
                </View>
              ))}
              {extraCount > 0 && (
                <View className="bg-gray-100 rounded-full px-2.5 py-0.5">
                  <Text className="text-xs text-gray-500">+{extraCount}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* ── Footer strip ── */}
      <View className="flex-row items-center justify-between px-4 py-2.5 bg-brand-50 border-t border-brand-100">
        <Text className="text-xs text-brand-700 font-medium">{KA.physioCard.verified}</Text>
        <Text className="text-brand-600 text-sm font-bold">›</Text>
      </View>
    </TouchableOpacity>
  );
}
