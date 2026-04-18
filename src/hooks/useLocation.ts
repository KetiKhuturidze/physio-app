import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

import { KA } from 'src/constants/strings.ka';
import supabase from 'src/lib/supabase';
import { District } from 'src/types';

type LocationState = {
  district: District | null;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
  refetch: () => void;
};

type DistrictRow = District & { distance: number };

export function useLocation(): LocationState {
  const [district, setDistrict] = useState<District | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      setLoading(true);
      setError(null);
      setPermissionDenied(false);
      setDistrict(null);

      // 1. Request foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        if (!cancelled) {
          setPermissionDenied(true);
          setLoading(false);
        }
        return;
      }

      // 2. Get GPS coordinates
      let coords: Location.LocationObjectCoords;
      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coords = position.coords;
        console.log('[useLocation] GPS coords:', coords.latitude, coords.longitude);
      } catch (e) {
        console.error('[useLocation] GPS error:', e);
        if (!cancelled) {
          setError(KA.location.fetchError);
          setLoading(false);
        }
        return;
      }

      // 3. Query closest district via PostGIS
      const { data, error: dbError } = await supabase.rpc('nearest_district', {
        longitude: coords.longitude,
        latitude: coords.latitude,
      });

      if (cancelled) return;

      if (dbError || !data || (data as DistrictRow[]).length === 0) {
        console.error('[useLocation] nearest_district RPC error:', dbError, 'data:', data);
        setError(KA.location.districtError);
        setLoading(false);
        return;
      }

      const row = (data as DistrictRow[])[0];
      console.log('[useLocation] nearest district:', row.name_en, 'distance:', row.distance, 'm');
      setDistrict({
        id: row.id,
        name_en: row.name_en,
        name_ka: row.name_ka,
        center: row.center,
      });
      setLoading(false);
    }

    resolve();

    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  return { district, loading, error, permissionDenied, refetch };
}
