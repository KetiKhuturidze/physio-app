import { act, renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';

import { useLocation } from 'src/hooks/useLocation';
import supabase from 'src/lib/supabase';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  PermissionStatus: { GRANTED: 'granted' },
  Accuracy: { Balanced: 3 },
}));

jest.mock('src/lib/supabase', () => ({
  __esModule: true,
  default: { rpc: jest.fn() },
}));

const mockRequestPerm = Location.requestForegroundPermissionsAsync as jest.Mock;
const mockGetPosition = Location.getCurrentPositionAsync as jest.Mock;
const mockRpc = supabase.rpc as jest.Mock;

const DISTRICT = { id: 'd-1', name_en: 'Vake', name_ka: 'ვაკე', center: null };
const COORDS = { latitude: 41.715, longitude: 44.827 };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});

  mockRequestPerm.mockResolvedValue({ status: 'granted' });
  mockGetPosition.mockResolvedValue({ coords: COORDS });
  mockRpc.mockResolvedValue({ data: [{ ...DISTRICT, distance: 500 }], error: null });
});

afterEach(() => jest.restoreAllMocks());

describe('useLocation', () => {
  it('starts in loading state', () => {
    mockRequestPerm.mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useLocation());
    expect(result.current.loading).toBe(true);
    expect(result.current.district).toBeNull();
  });

  it('sets permissionDenied and stops loading when permission denied', async () => {
    mockRequestPerm.mockResolvedValue({ status: 'denied' });
    const { result } = renderHook(() => useLocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.permissionDenied).toBe(true);
    expect(result.current.district).toBeNull();
    expect(mockGetPosition).not.toHaveBeenCalled();
  });

  it('sets error when GPS throws', async () => {
    mockGetPosition.mockRejectedValue(new Error('GPS unavailable'));
    const { result } = renderHook(() => useLocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.district).toBeNull();
  });

  it('sets error when RPC returns an error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const { result } = renderHook(() => useLocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
  });

  it('sets error when RPC returns empty array', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const { result } = renderHook(() => useLocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
  });

  it('sets district on success', async () => {
    const { result } = renderHook(() => useLocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.district).toEqual(DISTRICT);
    expect(result.current.error).toBeNull();
    expect(result.current.permissionDenied).toBe(false);
  });

  it('calls RPC with coordinates from GPS', async () => {
    const { result } = renderHook(() => useLocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockRpc).toHaveBeenCalledWith('nearest_district', {
      longitude: COORDS.longitude,
      latitude: COORDS.latitude,
    });
  });

  it('refetch triggers a new resolve cycle', async () => {
    const { result } = renderHook(() => useLocation());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockRpc).toHaveBeenCalledTimes(1);
    act(() => { result.current.refetch(); });
    await waitFor(() => expect(mockRpc).toHaveBeenCalledTimes(2));
  });
});
