import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';

import { KA } from 'src/constants/strings.ka';
import { BookingStatus, BookingWithJoins, UserRole } from 'src/types';

type Props = {
  booking: BookingWithJoins;
  role: UserRole;
  onConfirm?: () => void;
  onDecline?: () => void;
  onReview?: () => void;
  actionLoading?: boolean;
};

const STATUS_STYLES: Record<BookingStatus, { bg: string; text: string; label: string }> = {
  pending:   { bg: 'bg-amber-100',  text: 'text-amber-800',  label: KA.bookingStatus.pending },
  confirmed: { bg: 'bg-green-100',  text: 'text-green-800',  label: KA.bookingStatus.confirmed },
  declined:  { bg: 'bg-red-100',    text: 'text-red-800',    label: KA.bookingStatus.declined },
  completed: { bg: 'bg-gray-100',   text: 'text-gray-600',   label: KA.bookingStatus.completed },
  cancelled: { bg: 'bg-gray-100',   text: 'text-gray-600',   label: KA.bookingStatus.cancelled },
};

function Avatar({ uri, name }: { uri: string | null; name: string }) {
  const initials = name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  if (uri) {
    return <Image source={{ uri }} className="w-11 h-11 rounded-full bg-gray-200" />;
  }
  return (
    <View className="w-11 h-11 rounded-full bg-green-100 items-center justify-center">
      <Text className="text-green-700 text-sm font-semibold">{initials}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}.${d.getFullYear()}`;
}

export default function BookingCard({ booking, role, onConfirm, onDecline, onReview, actionLoading }: Props) {
  const S = KA.patientBookings;
  const status = STATUS_STYLES[booking.status];

  // Patient sees physio info; physio sees patient info
  const primaryName =
    role === 'patient'
      ? (booking.physio_profile?.user?.full_name ?? '—')
      : (booking.patient?.full_name ?? '—');

  const avatarUri =
    role === 'patient' ? (booking.physio_profile?.user?.avatar_url ?? null) : null;

  const subtitle =
    role === 'patient' && booking.physio_profile?.base_district
      ? booking.physio_profile.base_district.name_ka
      : role === 'physio'
      ? (booking.patient?.phone ?? null)
      : null;

  return (
    <View className="bg-white rounded-2xl mx-4 mb-3 p-4 border border-gray-100">
      {/* ── Top row: avatar + name + status badge ── */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3 flex-1">
          <Avatar uri={avatarUri} name={primaryName} />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
              {primaryName}
            </Text>
            {subtitle && (
              <Text className="text-xs text-gray-500 mt-0.5">{subtitle}</Text>
            )}
          </View>
        </View>
        <View className={`rounded-full px-3 py-1 ml-2 ${status.bg}`}>
          <Text className={`text-xs font-medium ${status.text}`}>{status.label}</Text>
        </View>
      </View>

      {/* ── Service ── */}
      {booking.service && (
        <View className="flex-row items-center gap-1.5 mb-1.5">
          <Text className="text-xs text-gray-500">{S.service}:</Text>
          <Text className="text-xs text-gray-800 font-medium">
            {booking.service.name} · {booking.service.duration_minutes} {S.minutes} · ₾{booking.service.price}
          </Text>
        </View>
      )}

      {/* ── Requested time ── */}
      {booking.requested_time && (
        <View className="flex-row items-center gap-1.5 mb-1.5">
          <Text className="text-xs text-gray-500">{S.requestedTime}:</Text>
          <Text className="text-xs text-gray-800">{booking.requested_time}</Text>
        </View>
      )}

      {/* ── Address ── */}
      {booking.patient_address && (
        <View className="flex-row items-start gap-1.5 mb-1.5">
          <Text className="text-xs text-gray-500">{S.address}:</Text>
          <Text className="text-xs text-gray-800 flex-1">{booking.patient_address}</Text>
        </View>
      )}

      {/* ── Date ── */}
      <Text className="text-xs text-gray-400 mt-1 text-right">
        {formatDate(booking.created_at)}
      </Text>

      {/* ── Review button (patient, completed only) ── */}
      {role === 'patient' && booking.status === 'completed' && onReview && (
        <View className="mt-3 pt-3 border-t border-gray-100">
          <TouchableOpacity
            onPress={onReview}
            activeOpacity={0.75}
            className="rounded-xl bg-amber-50 border border-amber-200 py-2.5 items-center"
          >
            <Text className="text-amber-800 text-sm font-medium">
              {KA.reviewScreen.reviewButton}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Confirm / Decline (physio, pending only) ── */}
      {role === 'physio' && booking.status === 'pending' && (onConfirm || onDecline) && (
        <View className="flex-row gap-2 mt-3 pt-3 border-t border-gray-100">
          {onDecline && (
            <TouchableOpacity
              onPress={onDecline}
              disabled={actionLoading}
              activeOpacity={0.75}
              className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 items-center"
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <Text className="text-red-700 text-sm font-medium">{KA.nav.decline}</Text>
              )}
            </TouchableOpacity>
          )}
          {onConfirm && (
            <TouchableOpacity
              onPress={onConfirm}
              disabled={actionLoading}
              activeOpacity={0.75}
              className="flex-1 rounded-xl bg-green-600 py-2.5 items-center"
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white text-sm font-semibold">{KA.nav.confirm}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
