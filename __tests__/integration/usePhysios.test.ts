import { act, renderHook, waitFor } from '@testing-library/react-native';

import { usePhysios } from 'src/hooks/usePhysios';
import supabase from 'src/lib/supabase';

jest.mock('src/lib/supabase', () => ({
  __esModule: true,
  default: { from: jest.fn() },
}));

const mockFrom = supabase.from as jest.Mock;

// Returns a chainable builder whose final await resolves to `result`.
function qb(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  ['select', 'eq', 'order'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    p.then(res, rej);
  return chain;
}

const RAW_PHYSIO = {
  id: 'p-1',
  user_id: 'u-1',
  bio: null,
  specialties: [],
  languages: [],
  available_hours: null,
  base_district_id: 'd-1',
  is_verified: false,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  user: { full_name: 'Ana Davitashvili', avatar_url: null },
  base_district: { id: 'd-1', name_en: 'Vake', name_ka: 'ვაკე', center: null },
  reviews: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockFrom.mockReturnValue(qb({ data: [RAW_PHYSIO], error: null }));
});

describe('usePhysios', () => {
  it('returns empty list and loading=false immediately when districtId is null', () => {
    const { result } = renderHook(() => usePhysios(null));
    expect(result.current.physios).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('fetches physios for a specific district', async () => {
    const { result } = renderHook(() => usePhysios('d-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.physios).toHaveLength(1);
    expect(result.current.physios[0].id).toBe('p-1');
  });

  it('applies district filter when districtId is not "all"', async () => {
    const chain = qb({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => usePhysios('d-42'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect((chain.eq as jest.Mock)).toHaveBeenCalledWith(
      'physio_service_areas.district_id',
      'd-42',
    );
  });

  it('does not apply district filter when districtId is "all"', async () => {
    const chain = qb({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const { result } = renderHook(() => usePhysios('all'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const eqCalls = (chain.eq as jest.Mock).mock.calls;
    const districtFilterApplied = eqCalls.some(
      ([key]: [string]) => key === 'physio_service_areas.district_id',
    );
    expect(districtFilterApplied).toBe(false);
  });

  it('sets error when Supabase returns an error', async () => {
    mockFrom.mockReturnValue(qb({ data: null, error: { message: 'DB error' } }));
    const { result } = renderHook(() => usePhysios('d-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
    expect(result.current.physios).toEqual([]);
  });

  it('computes average_rating from reviews', async () => {
    const physioWithReviews = { ...RAW_PHYSIO, reviews: [{ rating: 4 }, { rating: 5 }] };
    mockFrom.mockReturnValue(qb({ data: [physioWithReviews], error: null }));

    const { result } = renderHook(() => usePhysios('all'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.physios[0].average_rating).toBe(4.5);
    expect(result.current.physios[0].review_count).toBe(2);
  });

  it('leaves average_rating undefined when there are no reviews', async () => {
    const { result } = renderHook(() => usePhysios('all'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.physios[0].average_rating).toBeUndefined();
    expect(result.current.physios[0].review_count).toBeUndefined();
  });

  it('refetch triggers a new query', async () => {
    const { result } = renderHook(() => usePhysios('d-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFrom).toHaveBeenCalledTimes(1);
    act(() => { result.current.refetch(); });
    await waitFor(() => expect(mockFrom).toHaveBeenCalledTimes(2));
  });
});
