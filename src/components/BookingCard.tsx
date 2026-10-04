import { ActivityIndicator, Image, Linking, Text, TouchableOpacity, View } from 'react-native';

import { KA } from 'src/constants/strings.ka';
import { BookingStatus, BookingWithJoins, UserRole } from 'src/types';

function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function toWhatsAppHref(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (!digits.startsWith('995') && digits.length === 9) {
    digits = `995${digits}`;
  }
  return `https://wa.me/${digits}`;
}

type Props = {
  booking: BookingWithJoins;
  role: UserRole;
  onConfirm?: () => void;
  onDecline?: () => void;
  onReview?: () => void;
  onComplete?: () => void;
  actionLoading?: boolean;
};

const STATUS_CONFIG: Record<BookingStatus, { bg: string; text: string; dot: string; label: string }> = {
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400',  label: KA.bookingStatus.pending },
  confirmed: { bg: 'bg-accent-50',  text: 'text-accent-700',  dot: 'bg-accent-500', label: KA.bookingStatus.confirmed },
  declined:  { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-400',    label: KA.bookingStatus.declined },
  completed: { bg: 'bg-slate-100', text: 'text-slate-600',  dot: 'bg-slate-400',  label: KA.bookingStatus.completed },
  cancelled: { bg: 'bg-slate-100', text: 'text-slate-600',  dot: 'bg-slate-400',  label: KA.bookingStatus.cancelled },
};

const STATUS_BORDER: Record<BookingStatus, string> = {
  pending:   '#f59e0b',
  confirmed: '#16A34A',
  declined:  '#f87171',
  completed: '#94a3b8',
  cancelled: '#94a3b8',
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
    return <Image source={{ uri }} className="w-11 h-11 rounded-full bg-gray-100" />;
  }
  return (
    <View className="w-11 h-11 rounded-full bg-brand-100 items-center justify-center">
      <Text className="text-brand-700 text-sm font-bold">{initials}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}.${d.getFullYear()}`;
}

export default function BookingCard({ booking, role, onConfirm, onDecline, onReview, onComplete, actionLoading }: Props) {
  const S = KA.patientBookings;
  const cfg = STATUS_CONFIG[booking.status];

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

  const contactPhone =
    role === 'patient' ? (booking.physio_profile?.user?.phone ?? null) : (booking.patient?.phone ?? null);

  const canContact =
    contactPhone && (booking.status === 'confirmed' || booking.status === 'completed');

  return (
    <View
      className="bg-white mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: STATUS_BORDER[booking.status],
      }}
    >
      {/* ── Top row: avatar + name + status ── */}
      <View className="flex-row items-center justify-between px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 flex-1">
          <Avatar uri={avatarUri} name={primaryName} />
          <View className="flex-1">
            <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
              {primaryName}
            </Text>
            {subtitle && (
              <Text className="text-xs text-gray-400 mt-0.5">{subtitle}</Text>
            )}
          </View>
        </View>
        <View className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ml-2 ${cfg.bg}`}>
          <View className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          <Text className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</Text>
        </View>
      </View>

      {/* ── Details ── */}
      <View className="px-4 pb-3 gap-1.5">
        {booking.service && (
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs text-gray-400 w-16">{S.service}</Text>
            <Text className="text-xs text-gray-800 font-semibold flex-1">
              {booking.service.name} · {booking.service.duration_minutes} {S.minutes} · ₾{booking.service.price}
            </Text>
          </View>
        )}
        {booking.requested_time && (
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs text-gray-400 w-16">{S.requestedTime}</Text>
            <Text className="text-xs text-gray-700 flex-1">{booking.requested_time}</Text>
          </View>
        )}
        {booking.patient_address && (
          <View className="flex-row items-start gap-1.5">
            <Text className="text-xs text-gray-400 w-16">{S.address}</Text>
            <Text className="text-xs text-gray-700 flex-1">{booking.patient_address}</Text>
          </View>
        )}
        <Text className="text-xs text-gray-300 text-right mt-0.5">{formatDate(booking.created_at)}</Text>
      </View>

      {/* ── Call / WhatsApp ── */}
      {canContact && contactPhone && (
        <View className="flex-row gap-2 px-4 pb-3">
          <TouchableOpacity
            onPress={() => Linking.openURL(toTelHref(contactPhone))}
            activeOpacity={0.75}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 py-2.5"
          >
            <Text className="text-gray-700 text-sm font-semibold">{KA.nav.call}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => Linking.openURL(toWhatsAppHref(contactPhone))}
            activeOpacity={0.75}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-accent-200 bg-accent-50 py-2.5"
          >
            <Text className="text-accent-700 text-sm font-semibold">{KA.nav.whatsapp}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Review button ── */}
      {role === 'patient' && booking.status === 'completed' && onReview && (
        <TouchableOpacity
          onPress={onReview}
          activeOpacity={0.75}
          className="mx-4 mb-4 rounded-xl border border-amber-200 bg-amber-50 py-2.5 items-center"
        >
          <Text className="text-amber-700 text-sm font-semibold">
            {KA.reviewScreen.reviewButton}
          </Text>
        </TouchableOpacity>
      )}

      {/* ── Mark as completed ── */}
      {role === 'physio' && booking.status === 'confirmed' && onComplete && (
        <View className="px-4 pb-4">
          <TouchableOpacity
            onPress={onComplete}
            disabled={actionLoading}
            activeOpacity={0.75}
            className="rounded-xl bg-slate-700 py-2.5 items-center"
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white text-sm font-bold">{KA.nav.complete}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Confirm / Decline ── */}
      {role === 'physio' && booking.status === 'pending' && (onConfirm || onDecline) && (
        <View className="flex-row gap-2 px-4 pb-4">
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
                <Text className="text-red-600 text-sm font-semibold">{KA.nav.decline}</Text>
              )}
            </TouchableOpacity>
          )}
          {onConfirm && (
            <TouchableOpacity
              onPress={onConfirm}
              disabled={actionLoading}
              activeOpacity={0.75}
              className="flex-1 rounded-xl bg-accent-600 py-2.5 items-center"
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white text-sm font-bold">{KA.nav.confirm}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}
