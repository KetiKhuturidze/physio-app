import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PhysioCard from 'src/components/PhysioCard';
import { KA } from 'src/constants/strings.ka';
import { useLocation } from 'src/hooks/useLocation';
import { usePhysios } from 'src/hooks/usePhysios';
import useAuthStore from 'src/stores/useAuthStore';
import { PhysioWithJoins } from 'src/types';

const S = KA.patientHome;

const CARD_SHADOW = {
  shadowColor: '#0f172a',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

// ─── Location bar ─────────────────────────────────────────────────────────────

function LocationBar({
  loading,
  districtName,
  permissionDenied,
  error,
  onRetry,
}: {
  loading: boolean;
  districtName: string | null;
  permissionDenied: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (loading) {
    return (
      <View
        className="flex-row items-center gap-2 bg-white px-4 py-3 rounded-2xl"
        style={CARD_SHADOW}
      >
        <ActivityIndicator size="small" color="#3F6690" />
        <Text className="text-brand-700 text-sm font-medium">{S.locationDetecting}</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View
        className="bg-white px-4 py-3 rounded-2xl gap-2"
        style={CARD_SHADOW}
      >
        <Text className="text-amber-800 text-sm font-medium">{S.permissionDenied}</Text>
        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          className="self-start bg-amber-500 rounded-lg px-3 py-1.5"
        >
          <Text className="text-white text-xs font-semibold">{S.openSettings}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View
        className="flex-row items-center justify-between gap-2 bg-white px-4 py-3 rounded-2xl"
        style={CARD_SHADOW}
      >
        <Text className="text-red-600 text-sm font-medium flex-1">{S.locationError}</Text>
        <TouchableOpacity onPress={onRetry} hitSlop={8} className="bg-red-50 rounded-full w-8 h-8 items-center justify-center">
          <Text className="text-red-600 text-sm font-bold">↻</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (districtName) {
    return (
      <View
        className="flex-row items-center gap-2.5 bg-white px-4 py-3 rounded-2xl"
        style={CARD_SHADOW}
      >
        <View className="w-2 h-2 rounded-full bg-accent-500" />
        <Text className="text-gray-500 text-sm">
          {S.locationFound}
          <Text className="text-gray-900 font-semibold">{districtName}</Text>
        </Text>
      </View>
    );
  }

  return null;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ locationLoading }: { locationLoading: boolean }) {
  if (locationLoading) return null;
  return (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <View className="w-16 h-16 rounded-full bg-brand-100 items-center justify-center mb-4">
        <Text className="text-brand-400 text-2xl">?</Text>
      </View>
      <Text className="text-gray-500 text-center text-base font-medium">{S.noPhysiosInArea}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Home() {
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    district,
    loading: locationLoading,
    error: locationError,
    permissionDenied,
    refetch: refetchLocation,
  } = useLocation();

  const [showAllPhysios, setShowAllPhysios] = useState(false);

  // Reset fallback whenever district changes (e.g. user moves)
  useEffect(() => {
    setShowAllPhysios(false);
  }, [district?.id]);

  // Fall back to showing all physios when location resolves but district query failed
  const physiosDistrictArg =
    locationError && !permissionDenied
      ? 'all'
      : showAllPhysios
        ? 'all'
        : (district?.id ?? null);

  const {
    physios,
    loading: physiosLoading,
    error: physiosError,
    refetch: refetchPhysios,
  } = usePhysios(physiosDistrictArg);

  // Auto-fallback: district resolved, query done, zero results → show all
  useEffect(() => {
    if (!showAllPhysios && !physiosLoading && district && physios.length === 0 && !physiosError) {
      setShowAllPhysios(true);
    }
  }, [physios.length, physiosLoading, district, showAllPhysios, physiosError]);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    refetchPhysios();
    setRefreshing(false);
  }, [refetchPhysios]);

  const handleCardPress = useCallback(
    (physio: PhysioWithJoins) => {
      router.push(`/(patient)/physio/${physio.id}`);
    },
    [router],
  );

  const firstName = user?.full_name.trim().split(' ')[0] ?? '';

  const showPhysiosLoader = !locationLoading && district !== null && physiosLoading;

  const ListHeader = (
    <View className="pb-2">
      <View
        className="bg-brand-900 px-6 rounded-b-[28px] justify-center"
        style={{ paddingTop: insets.top, height: insets.top + 84 }}
      >
        <Text className="text-brand-200 text-xs font-bold tracking-widest uppercase mb-1">
          {S.appName}
        </Text>
        <Text className="text-white text-2xl font-bold">
          {KA.general.welcome} <Text className="text-brand-200">{firstName}</Text>
        </Text>
      </View>

      <View className="mx-4 mt-4">
        <LocationBar
          loading={locationLoading}
          districtName={district?.name_ka ?? null}
          permissionDenied={permissionDenied}
          error={locationError}
          onRetry={refetchLocation}
        />
      </View>

      {/* ── Alerts below hero ── */}
      {showAllPhysios && district && (
        <View className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 gap-1">
          <Text className="text-amber-900 text-sm font-semibold">{S.noPhysiosInDistrict}</Text>
          <Text className="text-amber-700 text-sm">{S.showingAllPhysios}</Text>
        </View>
      )}

      {physiosError && (
        <View className="mx-4 mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <Text className="text-red-700 text-sm">{physiosError}</Text>
        </View>
      )}

      {/* ── Section title ── */}
      {!locationLoading && district && (
        <View className="px-4 pt-5 pb-2 flex-row items-center justify-between">
          <Text className="text-base font-bold text-gray-900">
            {showAllPhysios ? S.allPhysios : S.physiosNearby}
          </Text>
          {showPhysiosLoader && <ActivityIndicator size="small" color="#3F6690" />}
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-brand-50">
      <FlatList<PhysioWithJoins>
        data={physios}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PhysioCard physio={item} onPress={() => handleCardPress(item)} />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !physiosLoading && !locationLoading ? (
            <EmptyState locationLoading={locationLoading} />
          ) : null
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      />
    </View>
  );
}
