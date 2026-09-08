import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { registerDeviceToken, unregisterDeviceToken } from './notifications';

/**
 * Camada única para permissão e registro de push, usada pela tela "Notificações"
 * e pelo hook que roda no login.
 *
 * - Expo Go (SDK 53+) não suporta push remoto: a permissão pode ser pedida, mas o
 *   token não é emitido — informamos isso ao usuário em vez de falhar em silêncio.
 * - Web: usamos a Notification API do navegador só para a permissão; push remoto
 *   fica restrito aos apps nativos.
 */
export type PushStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export const IS_EXPO_GO = Constants.appOwnership === 'expo';
const PREF_KEY = '@portifolio:notifications_enabled';
const TOKEN_KEY = '@portifolio:push_token';

export async function getNotificationPreference(): Promise<boolean> {
  const v = await AsyncStorage.getItem(PREF_KEY);
  return v === null ? true : v === 'true';
}

export async function setNotificationPreference(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(PREF_KEY, String(enabled));
}

export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getPushStatus(): Promise<PushStatus> {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'undetermined';
  }
  try {
    const Notifications = await import('expo-notifications');
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied' && !canAskAgain) return 'denied';
    return 'undetermined';
  } catch {
    return 'unsupported';
  }
}

/** Pede a permissão ao sistema. Retorna o status final. */
export async function requestPushPermission(): Promise<PushStatus> {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') return 'unsupported';
    const result = await Notification.requestPermission();
    return result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'undetermined';
  }
  const Notifications = await import('expo-notifications');
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status === 'granted' ? 'granted' : 'denied';
}

/**
 * Configura canal Android, obtém o token Expo Push e registra no backend.
 * Retorna o token, ou null quando o ambiente não emite token (Expo Go, web, simulador).
 */
export async function registerPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || IS_EXPO_GO) return null;
  const Notifications = await import('expo-notifications');
  const Device = await import('expo-device');
  if (!Device.default.isDevice) return null;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('news', {
      name: 'Notícias do portfólio',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B7CFF',
      sound: 'default',
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const platform: 'android' | 'ios' = Platform.OS === 'ios' ? 'ios' : 'android';
  await registerDeviceToken(tokenData.data, platform);
  await AsyncStorage.setItem(TOKEN_KEY, tokenData.data);
  return tokenData.data;
}

/** Remove o token do backend (se houver) e limpa o cache local. */
export async function unregisterPushToken(): Promise<void> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    await unregisterDeviceToken(token).catch(() => {});
    await AsyncStorage.removeItem(TOKEN_KEY);
  }
}

/** Fluxo completo do botão "Ativar": permissão → registro → preferência. */
export async function enablePushNotifications(): Promise<{ status: PushStatus; token: string | null }> {
  const status = await requestPushPermission();
  if (status !== 'granted') return { status, token: null };
  const token = await registerPushToken().catch(() => null);
  await setNotificationPreference(true);
  return { status, token };
}

export async function disablePushNotifications(): Promise<void> {
  await setNotificationPreference(false);
  await unregisterPushToken();
}
