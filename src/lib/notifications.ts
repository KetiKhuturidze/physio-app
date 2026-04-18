import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

import supabase from 'src/lib/supabase';
import { BookingStatus } from 'src/types';

const EAS_PROJECT_ID = 'b20d7b10-51a4-4a71-b2e6-5a52f75be3e7';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<void> {
  if (!Device.isDevice) return;

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
