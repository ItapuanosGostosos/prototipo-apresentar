import { apiFetch } from './api';
import type { DeviceTokenPayload, Platform } from '../types';

export async function registerDeviceToken(
  token: string,
  platform: Platform,
): Promise<void> {
  await apiFetch<void>('/notifications/device-token', {
    method: 'POST',
    body: JSON.stringify({ token, platform } satisfies DeviceTokenPayload),
  });
}

export async function unregisterDeviceToken(token: string): Promise<void> {
  await apiFetch<void>('/notifications/device-token', {
    method: 'DELETE',
    body: JSON.stringify({ token }),
  });
}
