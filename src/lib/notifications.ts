import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';

import supabase from 'src/lib/supabase';
import { BookingStatus } from 'src/types';

// Remote push (getExpoPushTokenAsync) was removed from Expo Go in SDK 53, and
// merely importing expo-notifications there throws — so it's loaded lazily
// via dynamic import, only outside Expo Go, instead of a static import above.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const EAS_PROJECT_ID = 'dff9e930-9f1b-4543-83a4-7dd19dda2248';

async function setupNotificationHandler() {
  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

if (!isExpoGo) {
  setupNotificationHandler();
}

export async function registerForPushNotifications(userId: string): Promise<void> {
  if (!Device.isDevice || isExpoGo) return;

  const Notifications = await import('expo-notifications');

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  const finalStatus =
    existing === 'granted'
      ? existing
      : (await Notifications.requestPermissionsAsync()).status;

  if (finalStatus !== 'granted') return;

  const { data: tokenData } = await Notifications.getExpoPushTokenAsync({
    projectId: EAS_PROJECT_ID,
  });

  const { error } = await supabase
    .from('users')
    .update({ push_token: tokenData })
    .eq('id', userId);

  if (error) {
    // Non-fatal — app works without push
  }
}

export type BookingNotificationEvent = 'new_booking' | BookingStatus;

export async function triggerBookingNotification(
  bookingId: string,
  event: BookingNotificationEvent,
): Promise<void> {
  // Edge Function implemented in BE-008
  const { error } = await supabase.functions.invoke('notify-booking', {
    body: { bookingId, event },
  });

  if (error) {
    // Non-fatal — notification failure must never break booking flow
  }
}
