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
        className="w-16 h-16 rounded-full bg-gray-200"
      />
    );
  }
  return (
    <View className="w-16 h-16 rounded-full bg-teal-100 items-center justify-center">
      <Text className="text-teal-700 text-lg font-semibold">
        {getInitials(fullName)}
      </Text>
    </View>
  );
}

export default function PhysioCard({ physio, onPress }: Props) {
  const { user, base_district, specialties, is_verified, average_rating, review_count } = physio;

  const visibleSpecialties = specialties.slice(0, 2);
  const extraCount = specialties.length - 2;

  const ratingText =
    average_rating != null
      ? `★ ${average_rating.toFixed(1)}`
      : null;

  const reviewText =
    review_count != null && review_count > 0
      ? `(${review_count} ${KA.physioCard.reviews})`
      : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="bg-white rounded-2xl mx-4 mb-3 p-4 flex-row items-start shadow-sm border border-gray-100"
    >
      {/* Avatar */}
      <Avatar fullName={user.full_name} avatarUrl={user.avatar_url} />

      {/* Info */}
      <View className="flex-1 ml-3">
        {/* Name + verified badge */}
        <View className="flex-row items-center flex-wrap gap-x-1.5 mb-0.5">
          <Text className="text-base font-semibold text-gray-900">
            {user.full_name}
          </Text>
          {is_verified && (
            <View className="bg-teal-100 rounded-full px-2 py-0.5">
              <Text className="text-teal-700 text-xs font-medium">
                {KA.physioCard.verified}
              </Text>
            </View>
          )}
        </View>

        {/* District */}
        <Text className="text-sm text-gray-500 mb-1.5">
          {base_district.name_ka}
        </Text>

        {/* Specialties */}
        {visibleSpecialties.length > 0 && (
          <View className="flex-row flex-wrap gap-1 mb-1.5">
            {visibleSpecialties.map((specialty) => (
              <View key={specialty} className="bg-gray-100 rounded-full px-2.5 py-0.5">
                <Text className="text-xs text-gray-600">{specialty}</Text>
              </View>
            ))}
            {extraCount > 0 && (
              <View className="bg-gray-100 rounded-full px-2.5 py-0.5">
                <Text className="text-xs text-gray-500">
                  +{extraCount} {KA.physioCard.moreSpecialties}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Rating */}
        {ratingText != null && (
          <Text className="text-sm text-amber-600 mt-0.5 font-medium">
            {ratingText}
            <Text className="text-gray-400 font-normal">
              {reviewText != null ? ` ${reviewText}` : ''}
            </Text>
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
