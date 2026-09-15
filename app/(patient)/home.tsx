import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      <View className="flex-row items-center gap-2 bg-white/20 px-3 py-2 rounded-xl">
        <ActivityIndicator size="small" color="#ffffff" />
        <Text className="text-teal-50 text-sm">{S.locationDetecting}</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View className="bg-white/15 px-3 py-2.5 rounded-xl gap-2">
        <Text className="text-teal-50 text-sm">{S.permissionDenied}</Text>
        <TouchableOpacity
          onPress={() => Linking.openSettings()}
          className="self-start bg-white/20 rounded-lg px-3 py-1"
        >
          <Text className="text-white text-xs font-semibold">{S.openSettings}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-row items-center justify-between bg-red-500/20 px-3 py-2 rounded-xl">
        <Text className="text-red-100 text-sm">{S.locationError}</Text>
        <TouchableOpacity onPress={onRetry} hitSlop={8}>
          <Text className="text-white text-sm font-bold">↻</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (districtName) {
    return (
      <View className="flex-row items-center gap-2 bg-white/15 px-3 py-2 rounded-xl">
        <View className="w-1.5 h-1.5 rounded-full bg-teal-200" />
        <Text className="text-teal-50 text-sm font-medium">
          {S.locationFound}
          <Text className="text-white font-semibold">{districtName}</Text>
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
      <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
        <Text className="text-slate-400 text-2xl">?</Text>
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
      {/* ── Teal hero header ── */}
      <LinearGradient
        colors={['#0c4a6e', '#0891b2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-6 pb-5"
        style={{ paddingTop: insets.top + 20 }}
      >
        <Text className="text-teal-100 text-xs font-semibold tracking-widest uppercase mb-1">
          {S.appName}
        </Text>
        <Text className="text-white text-2xl font-bold mb-4">
          {KA.general.welcome}, <Text className="text-teal-100">{firstName}</Text>
        </Text>

        <LocationBar
          loading={locationLoading}
          districtName={district?.name_ka ?? null}
          permissionDenied={permissionDenied}
          error={locationError}
          onRetry={refetchLocation}
        />
      </LinearGradient>

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
          {showPhysiosLoader && <ActivityIndicator size="small" color="#0891b2" />}
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-slate-50">
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
