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
      <View className="flex-row items-center gap-2 bg-blue-50 px-4 py-3 mx-4 rounded-xl">
        <ActivityIndicator size="small" color="#2563eb" />
        <Text className="text-blue-700 text-sm">{S.locationDetecting}</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View className="bg-amber-50 border border-amber-200 px-4 py-3 mx-4 rounded-xl gap-2">
        <Text className="text-amber-800 text-sm">{S.permissionDenied}</Text>
        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          className="self-start bg-amber-100 rounded-lg px-3 py-1.5"
        >
          <Text className="text-amber-800 text-xs font-medium">{S.openSettings}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-row items-center justify-between bg-red-50 border border-red-100 px-4 py-3 mx-4 rounded-xl">
        <Text className="text-red-700 text-sm">{S.locationError}</Text>
        <TouchableOpacity onPress={onRetry} hitSlop={8}>
          <Text className="text-red-600 text-sm font-medium">↻</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (districtName) {
    return (
      <View className="flex-row items-center gap-1.5 bg-green-50 px-4 py-3 mx-4 rounded-xl">
        <Text className="text-green-600 text-sm">📍</Text>
        <Text className="text-green-800 text-sm font-medium">
          {S.locationFound}
          <Text className="font-semibold">{districtName}</Text>
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
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-4xl mb-4">🔍</Text>
      <Text className="text-gray-500 text-center text-base">{S.noPhysiosInArea}</Text>
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
    <View className="gap-4 pb-4">
      {/* ── App header ── */}
      <View className="bg-white px-6 pb-5" style={{ paddingTop: insets.top + 12 }}>
        <Text className="text-xs font-semibold tracking-widest text-green-600 uppercase mb-1">
          {S.appName}
        </Text>
        <Text className="text-2xl font-bold text-gray-900">
          {KA.general.welcome}{' '}
          <Text className="text-green-700">{firstName}</Text>
        </Text>
      </View>

      {/* ── Location bar ── */}
      <LocationBar
        loading={locationLoading}
        districtName={district?.name_ka ?? null}
        permissionDenied={permissionDenied}
        error={locationError}
        onRetry={refetchLocation}
      />

      {/* ── No local physios banner ── */}
      {showAllPhysios && district && (
        <View className="mx-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 gap-1">
          <Text className="text-amber-900 text-sm font-medium">{S.noPhysiosInDistrict}</Text>
          <Text className="text-amber-700 text-sm">{S.showingAllPhysios}</Text>
        </View>
      )}

      {/* ── Section title / physios loader ── */}
      {!locationLoading && district && (
        <View className="px-4 flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-900">
            {showAllPhysios ? S.allPhysios : S.physiosNearby}
          </Text>
          {showPhysiosLoader && <ActivityIndicator size="small" color="#16a34a" />}
        </View>
      )}

      {/* ── Physios error ── */}
      {physiosError && (
        <View className="mx-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <Text className="text-red-700 text-sm">{physiosError}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
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
