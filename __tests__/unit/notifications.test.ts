import * as Notifications from 'expo-notifications';

import supabase from 'src/lib/supabase';
import {
  registerForPushNotifications,
  triggerBookingNotification,
} from 'src/lib/notifications';

// Getter-based mock: Babel copies the descriptor (not the value), so setting
// mockIsDevice after module load is reflected in Device.isDevice inside notifications.ts.
let mockIsDevice = true;
jest.mock('expo-device', () => ({
  get isDevice() { return mockIsDevice; },
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { MAX: 5 },
}));

jest.mock('src/lib/supabase', () => ({
  __esModule: true,
  default: {
    from: jest.fn(),
    functions: { invoke: jest.fn() },
  },
}));

const mockGetPermissions = Notifications.getPermissionsAsync as jest.Mock;
const mockRequestPermissions = Notifications.requestPermissionsAsync as jest.Mock;
const mockGetToken = Notifications.getExpoPushTokenAsync as jest.Mock;
const mockFrom = supabase.from as jest.Mock;
const mockInvoke = supabase.functions.invoke as jest.Mock;

// beforeEach sets up a complete happy-path so each test only overrides what it needs
beforeEach(() => {
  jest.clearAllMocks();
  mockIsDevice = true;

  mockGetPermissions.mockResolvedValue({ status: 'granted' });
  mockRequestPermissions.mockResolvedValue({ status: 'granted' });
  mockGetToken.mockResolvedValue({ data: 'ExponentPushToken[test]' });
  mockInvoke.mockResolvedValue({ error: null });

  const eq = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn().mockReturnValue({ eq });
  mockFrom.mockReturnValue({ update });
});

// ─── registerForPushNotifications ────────────────────────────────────────────

describe('registerForPushNotifications', () => {
  it('returns immediately when not on a physical device', async () => {
    mockIsDevice = false;

    await registerForPushNotifications('user-1');

    expect(mockGetPermissions).not.toHaveBeenCalled();
  });

  it('does not fetch token when permission is denied', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'denied' });
    mockRequestPermissions.mockResolvedValue({ status: 'denied' });

    await registerForPushNotifications('user-1');

    expect(mockGetToken).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('does not call requestPermissions when already granted', async () => {
    await registerForPushNotifications('user-1');

    expect(mockRequestPermissions).not.toHaveBeenCalled();
    expect(mockGetToken).toHaveBeenCalled();
  });

  it('calls requestPermissions when status is undetermined', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' });

    await registerForPushNotifications('user-1');

    expect(mockRequestPermissions).toHaveBeenCalled();
  });

  it('returns early if requestPermissions is denied', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'undetermined' });
    mockRequestPermissions.mockResolvedValue({ status: 'denied' });

    await registerForPushNotifications('user-1');

    expect(mockGetToken).not.toHaveBeenCalled();
  });

  it('saves the push token to the users table', async () => {
    const token = 'ExponentPushToken[mytoken]';
    mockGetToken.mockResolvedValue({ data: token });

    const eq = jest.fn().mockResolvedValue({ error: null });
    const update = jest.fn().mockReturnValue({ eq });
    mockFrom.mockReturnValue({ update });

    await registerForPushNotifications('user-99');

    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(update).toHaveBeenCalledWith({ push_token: token });
    expect(eq).toHaveBeenCalledWith('id', 'user-99');
  });

  it('resolves without throwing when Supabase update fails', async () => {
    const eq = jest.fn().mockResolvedValue({ error: { message: 'DB error' } });
    mockFrom.mockReturnValue({ update: jest.fn().mockReturnValue({ eq }) });

    await expect(registerForPushNotifications('user-1')).resolves.toBeUndefined();
  });
});

// ─── triggerBookingNotification ───────────────────────────────────────────────

describe('triggerBookingNotification', () => {
  it('invokes the Edge Function with bookingId and event', async () => {
    await triggerBookingNotification('booking-abc', 'new_booking');

    expect(mockInvoke).toHaveBeenCalledWith('notify-booking', {
      body: { bookingId: 'booking-abc', event: 'new_booking' },
    });
  });

  it('resolves silently when the Edge Function returns an error', async () => {
    mockInvoke.mockResolvedValue({ error: { message: 'Function unavailable' } });

    await expect(
      triggerBookingNotification('b-1', 'confirmed'),
    ).resolves.toBeUndefined();
  });

  it.each(['new_booking', 'confirmed', 'declined', 'completed', 'cancelled', 'pending'] as const)(
    'handles event type: %s',
    async (event) => {
      await triggerBookingNotification('b-1', event);

      expect(mockInvoke).toHaveBeenCalledWith('notify-booking', {
        body: { bookingId: 'b-1', event },
      });
    },
  );
});
