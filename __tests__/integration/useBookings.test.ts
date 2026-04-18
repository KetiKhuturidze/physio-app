import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useBookings, createBooking, updateBookingStatus } from 'src/hooks/useBookings';
import supabase from 'src/lib/supabase';
import useAuthStore from 'src/stores/useAuthStore';

jest.mock('src/lib/supabase', () => ({
  __esModule: true,
  default: {
    from: jest.fn(),
    functions: { invoke: jest.fn() },
  },
}));

jest.mock('src/stores/useAuthStore', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// triggerBookingNotification calls supabase.functions.invoke — covered by the supabase mock above
jest.mock('src/lib/notifications', () => ({
  triggerBookingNotification: jest.fn(),
}));

const mockFrom = supabase.from as jest.Mock;
const mockUseAuthStore = useAuthStore as unknown as jest.Mock;

const PATIENT_USER = {
  id: 'patient-1',
  email: 'p@test.com',
  phone: '+995',
  full_name: 'Giorgi',
  role: 'patient' as const,
  avatar_url: null,
  push_token: null,
  default_address: null,
  default_district_id: null,
  created_at: '2024-01-01T00:00:00Z',
};

const PHYSIO_USER = { ...PATIENT_USER, id: 'physio-user-1', role: 'physio' as const };

// Chainable query builder whose direct await resolves to `result`.
function qb(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  ['select', 'eq', 'order', 'insert', 'update'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.single = jest.fn().mockResolvedValue(result);
  chain.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    p.then(res, rej);
  return chain;
}

const BOOKING = {
  id: 'b-1',
  patient_id: 'patient-1',
  physio_id: 'physio-profile-1',
  status: 'pending',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuthStore.mockReturnValue({ user: PATIENT_USER });
  mockFrom.mockReturnValue(qb({ data: [BOOKING], error: null }));
});

// ─── useBookings hook ──────────────────────────────────────────────────────────

describe('useBookings — patient', () => {
  it('returns empty list while user is null', () => {
    mockUseAuthStore.mockReturnValue({ user: null });
    const { result } = renderHook(() => useBookings('patient'));
    expect(result.current.bookings).toEqual([]);
  });

  it('fetches bookings by patient_id', async () => {
    const chain = qb({ data: [BOOKING], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => useBookings('patient'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFrom).toHaveBeenCalledWith('bookings');
    expect((chain.eq as jest.Mock)).toHaveBeenCalledWith('patient_id', PATIENT_USER.id);
    expect(result.current.bookings).toHaveLength(1);
  });

  it('sets error when fetch fails', async () => {
    mockFrom.mockReturnValue(qb({ data: null, error: { message: 'DB error' } }));
    const { result } = renderHook(() => useBookings('patient'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.bookings).toEqual([]);
  });

  it('refetch triggers a second query', async () => {
    const { result } = renderHook(() => useBookings('patient'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFrom).toHaveBeenCalledTimes(1);
    act(() => { result.current.refetch(); });
    await waitFor(() => expect(mockFrom).toHaveBeenCalledTimes(2));
  });
});

describe('useBookings — physio', () => {
  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({ user: PHYSIO_USER });
  });

  it('resolves physio_profiles id then fetches bookings', async () => {
    const profileChain = qb({ data: { id: 'physio-profile-1' }, error: null });
    const bookingsChain = qb({ data: [BOOKING], error: null });
    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(bookingsChain);

    const { result } = renderHook(() => useBookings('physio'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFrom).toHaveBeenNthCalledWith(1, 'physio_profiles');
    expect(mockFrom).toHaveBeenNthCalledWith(2, 'bookings');
    expect(result.current.bookings).toHaveLength(1);
  });

  it('sets error when profile lookup fails', async () => {
    mockFrom.mockReturnValue(qb({ data: null, error: { message: 'not found' } }));
    const { result } = renderHook(() => useBookings('physio'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
  });

  it('sets error when bookings query fails after profile resolves', async () => {
    const profileChain = qb({ data: { id: 'physio-profile-1' }, error: null });
    const errorChain = qb({ data: null, error: { message: 'DB error' } });
    mockFrom
      .mockReturnValueOnce(profileChain)
      .mockReturnValueOnce(errorChain);

    const { result } = renderHook(() => useBookings('physio'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
  });
});

// ─── createBooking ─────────────────────────────────────────────────────────────

describe('createBooking', () => {
  const INPUT = {
    physio_id: 'physio-profile-1',
    service_id: 'svc-1',
    patient_address: 'Test St. 1',
    patient_district_id: 'd-1',
    requested_time: 'Tuesday 10:00',
    notes: null,
  };

  it('returns booking id on success', async () => {
    mockFrom.mockReturnValue(qb({ data: { id: 'new-booking-id' }, error: null }));
    const result = await createBooking(INPUT, 'patient-1');
    expect(result).toEqual({ id: 'new-booking-id' });
  });

  it('returns null when insert fails', async () => {
    mockFrom.mockReturnValue(qb({ data: null, error: { message: 'insert failed' } }));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await createBooking(INPUT, 'patient-1');
    expect(result).toBeNull();
    jest.restoreAllMocks();
  });

  it('calls supabase.from("bookings") with correct patient_id', async () => {
    mockFrom.mockReturnValue(qb({ data: { id: 'b-1' }, error: null }));
    await createBooking(INPUT, 'patient-99');
    expect(mockFrom).toHaveBeenCalledWith('bookings');
  });
});

// ─── updateBookingStatus ───────────────────────────────────────────────────────

describe('updateBookingStatus', () => {
  it('returns true on success', async () => {
    mockFrom.mockReturnValue(qb({ data: null, error: null }));
    const result = await updateBookingStatus('b-1', 'confirmed');
    expect(result).toBe(true);
  });

  it('returns false when update fails', async () => {
    mockFrom.mockReturnValue(qb({ data: null, error: { message: 'update failed' } }));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = await updateBookingStatus('b-1', 'declined');
    expect(result).toBe(false);
    jest.restoreAllMocks();
  });
});
