import * as Notifications from 'expo-notifications';
import { format } from 'date-fns';
import { ItineraryItem } from '../types/models';

const NOTIF_PREFIX = 'roamly-item-';

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleItineraryNotifications(items: ItineraryItem[]): Promise<void> {
  const now = new Date();

  for (const item of items) {
    const id = NOTIF_PREFIX + item.id;

    // Always cancel the existing one first (handles updates)
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

    if (!item.start_time) continue;

    const startTime = new Date(item.start_time);
    const triggerTime = new Date(startTime.getTime() - 15 * 60 * 1000);

    if (triggerTime <= now) continue;

    const timeStr = format(startTime, 'h:mm a');
    const body = item.place_name
      ? `at ${item.place_name} · ${timeStr}`
      : `Starts at ${timeStr}`;

    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: item.title,
        body,
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerTime },
    });
  }
}

export async function cancelItemNotification(itemId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIF_PREFIX + itemId).catch(() => {});
}
