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

import DistrictPicker from 'src/components/DistrictPicker';
import { KA } from 'src/constants/strings.ka';
import { createBooking } from 'src/hooks/useBookings';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';

const S = KA.bookingScreen;

type ServiceOption = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
};

type BookingPhysioRow = {
  id: string;
  user: { full_name: string };
  physio_services: ServiceOption[];
};

function FieldLabel({ label }: { label: string }) {
  return <Text className="text-sm font-medium text-gray-700 mb-1.5">{label}</Text>;
}

export default function BookPhysio() {
  const { physioId } = useLocalSearchParams<{ physioId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [physio, setPhysio] = useState<BookingPhysioRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [districtIds, setDistrictIds] = useState<string[]>([]);
  const [requestedTime, setRequestedTime] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPhysio() {
      if (!physioId) {
        setLoadError(S.loadError);
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from('physio_profiles')
        .select(
          'id, user:users!physio_profiles_user_id_fkey(full_name), physio_services(id, name, duration_minutes, price)',
        )
        .eq('id', physioId)
        .single();

      if (dbError || !data) {
        setLoadError(S.loadError);
        setLoading(false);
        return;
      }

      setPhysio(data as unknown as BookingPhysioRow);
      setLoading(false);
    }

    loadPhysio();
  }, [physioId]);

  function validate(): string | null {
    if (!selectedServiceId) return S.serviceRequired;
    if (!address.trim()) return `${S.addressLabel}: ${KA.errors.requiredField}`;
    if (districtIds.length === 0) return `${S.districtLabel}: ${KA.errors.requiredField}`;
    if (!requestedTime.trim()) return `${S.requestedTimeLabel}: ${KA.errors.requiredField}`;
    return null;
  }

  async function handleSubmit() {
    if (!user || !physioId) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await createBooking(
      {
        physio_id: physioId,
        service_id: selectedServiceId,
        patient_address: address.trim(),
        patient_district_id: districtIds[0],
        requested_time: requestedTime.trim(),
        notes: notes.trim() || null,
      },
      user.id,
    );

    setSubmitting(false);

    if (!result) {
      setError(S.submitError);
      return;
    }

    router.replace('/(patient)/bookings');
  }

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#16a34a" />
      </View>
    );
  }

  if (loadError || !physio) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Text className="text-gray-500 text-base text-center">{loadError ?? S.loadError}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-green-600 font-medium">{KA.nav.back}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Header ── */}
      <View className="bg-white px-4 pt-14 pb-3 flex-row items-center border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          className="flex-row items-center gap-1.5 mr-3"
        >
          <Text className="text-green-600 text-xl">‹</Text>
          <Text className="text-green-600 font-medium">{KA.nav.back}</Text>
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-900 flex-1" numberOfLines={1}>
          {S.title} — {physio.user.full_name}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 mt-5 gap-5">
          {/* ── Error banner ── */}
          {error && (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <Text className="text-red-700 text-sm">{error}</Text>
            </View>
          )}

          {/* ── Service selection ── */}
          <View className="bg-white rounded-2xl p-4">
            <FieldLabel label={S.selectServiceLabel} />
            {physio.physio_services.length === 0 ? (
              <Text className="text-gray-400 text-sm">{S.loadError}</Text>
            ) : (
              <View className="gap-2">
                {physio.physio_services.map((svc) => {
                  const selected = selectedServiceId === svc.id;
                  return (
                    <TouchableOpacity
                      key={svc.id}
                      onPress={() => {
                        setSelectedServiceId(svc.id);
                        setError(null);
                      }}
                      activeOpacity={0.75}
                      className={`flex-row items-center justify-between px-4 py-3.5 rounded-xl border ${
                        selected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <View className="flex-1 gap-0.5">
                        <Text
                          className={`text-sm font-semibold ${
                            selected ? 'text-green-800' : 'text-gray-900'
                          }`}
                        >
                          {svc.name}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {svc.duration_minutes} {S.minutes} · ₾{svc.price}
                        </Text>
                      </View>
                      {selected && (
                        <Text className="text-green-600 text-base font-bold ml-3">✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* ── Address ── */}
          <View className="bg-white rounded-2xl p-4">
            <FieldLabel label={S.addressLabel} />
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm"
              value={address}
              onChangeText={(v) => {
                setAddress(v);
                setError(null);
              }}
              placeholder={S.addressPlaceholder}
              placeholderTextColor="#9ca3af"
              returnKeyType="next"
            />
          </View>

          {/* ── District ── */}
          <View className="bg-white rounded-2xl p-4">
            <FieldLabel label={S.districtLabel} />
            <DistrictPicker
              selectedIds={districtIds}
              onChange={(ids) => {
                setDistrictIds(ids);
                setError(null);
              }}
              singleSelect
            />
          </View>

          {/* ── Preferred time ── */}
          <View className="bg-white rounded-2xl p-4">
            <FieldLabel label={S.requestedTimeLabel} />
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm"
              value={requestedTime}
              onChangeText={(v) => {
                setRequestedTime(v);
                setError(null);
              }}
              placeholder={S.requestedTimePlaceholder}
              placeholderTextColor="#9ca3af"
              returnKeyType="next"
            />
          </View>

          {/* ── Notes ── */}
          <View className="bg-white rounded-2xl p-4">
            <FieldLabel label={S.notesLabel} />
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm min-h-[80px]"
              value={notes}
              onChangeText={setNotes}
              placeholder={S.notesPlaceholder}
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              returnKeyType="done"
            />
          </View>

          {/* ── Submit ── */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
            className={`rounded-2xl py-4 items-center ${
              submitting ? 'bg-green-300' : 'bg-green-600'
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white font-semibold text-base">{S.submitButton}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
