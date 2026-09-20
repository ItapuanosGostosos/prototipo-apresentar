import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { registerDeviceToken, unregisterDeviceToken } from './notifications';
import { setNotificationsEnabled } from './notificationPrefs';

/**
 * Camada única de notificações push usada pelo hook de setup e pela tela de
 * Notificações. Cada plataforma usa o que realmente funciona ali:
 *
 * - Android/iOS em development build ou produção: expo-notifications, com
 *   permissão do sistema e token Expo registrado no backend.
 * - Web: API de notificações do próprio navegador (permissão + aviso local).
 *   O backend só aceita "android"/"ios", então na web não registramos token.
 * - Expo Go (SDK 53+): push remoto não é suportado; avisamos na tela.
 */

export const IS_EXPO_GO = Constants.appOwnership === 'expo';
export const IS_WEB = Platform.OS === 'web';
export const IS_NATIVE_PUSH = !IS_WEB && !IS_EXPO_GO;

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export interface EnableResult {
  ok: boolean;
  status: PermissionStatus;
  message: string;
}

/** Último token registrado nesta sessão, para conseguir removê-lo ao desligar. */
let currentToken: string | null = null;

export function getCurrentToken(): string | null {
  return currentToken;
}

// ─── Web ─────────────────────────────────────────────────────────────────────

function webNotification(): any | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return typeof w.Notification === 'undefined' ? null : w.Notification;
}

// ─── Permissão ───────────────────────────────────────────────────────────────

export async function getPermissionStatus(): Promise<PermissionStatus> {
  if (IS_WEB) {
    const N = webNotification();
    if (!N) return 'unsupported';
    if (N.permission === 'granted') return 'granted';
    if (N.permission === 'denied') return 'denied';
    return 'undetermined';
  }

  if (IS_EXPO_GO) return 'unsupported';

  try {
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'unsupported';
  }
}

// ─── Ligar / desligar ────────────────────────────────────────────────────────

/** Pede permissão e, no mobile, registra o token do aparelho no backend. */
export async function enablePush(): Promise<EnableResult> {
  if (IS_WEB) {
    const N = webNotification();
    if (!N) {
      return { ok: false, status: 'unsupported', message: 'Este navegador não suporta notificações.' };
    }
    const permission: string = N.permission === 'granted' ? 'granted' : await N.requestPermission();
    if (permission !== 'granted') {
      return {
        ok: false,
        status: permission === 'denied' ? 'denied' : 'undetermined',
        message: 'Permissão negada. Libere as notificações nas configurações do navegador.',
      };
    }
    await setNotificationsEnabled(true);
    return { ok: true, status: 'granted', message: 'Notificações ativadas neste navegador.' };
  }

  if (IS_EXPO_GO) {
    return {
      ok: false,
      status: 'unsupported',
      message: 'O Expo Go não suporta push desde o SDK 53. Use um development build.',
    };
  }

  try {
    const Notifications = await import('expo-notifications');
    const Device = await import('expo-device');

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
        lightColor: '#818CF8',
        sound: 'default',
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return { ok: false, status: 'denied', message: 'Permissão negada nas configurações do aparelho.' };
    }

    if (!Device.default.isDevice) {
      await setNotificationsEnabled(true);
      return { ok: true, status: 'granted', message: 'Permissão concedida. Push remoto exige um aparelho físico.' };
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    currentToken = tokenData.data;

    await registerDeviceToken(currentToken, Platform.OS === 'ios' ? 'ios' : 'android');
    await setNotificationsEnabled(true);
    return { ok: true, status: 'granted', message: 'Notificações ativadas neste aparelho.' };
  } catch (err) {
    return {
      ok: false,
      status: 'unsupported',
      message: err instanceof Error ? err.message : 'Não foi possível ativar as notificações.',
    };
  }
}

/** Remove o token do backend sem mexer na preferência (usado ao sair da conta). */
export async function unregisterCurrentToken(): Promise<void> {
  if (IS_NATIVE_PUSH && currentToken) {
    await unregisterDeviceToken(currentToken).catch(() => {});
    currentToken = null;
  }
}

/** Desliga: remove o token do backend (quando houver) e salva a preferência. */
export async function disablePush(): Promise<void> {
  await unregisterCurrentToken();
  await setNotificationsEnabled(false);
}

// ─── Teste ───────────────────────────────────────────────────────────────────

/** Dispara um aviso local para o usuário conferir que está mesmo funcionando. */
export async function sendTestNotification(): Promise<boolean> {
  if (IS_WEB) {
    const N = webNotification();
    if (!N || N.permission !== 'granted') return false;
    // eslint-disable-next-line no-new
    new N('Portfolio Tracker', {
      body: 'Tudo certo! Você vai receber avisos das notícias da sua carteira.',
    });
    return true;
  }

  if (IS_EXPO_GO) return false;

  try {
    const Notifications = await import('expo-notifications');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Portfolio Tracker',
        body: 'Tudo certo! Você vai receber avisos das notícias da sua carteira.',
      },
      trigger: null,
    });
    return true;
  } catch {
    return false;
  }
}
