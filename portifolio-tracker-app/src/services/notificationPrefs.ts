import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Preferência local de notificações push.
 *
 * O backend só conhece o token do aparelho (`/notifications/device-token`):
 * ligado = token registrado, desligado = token removido. Guardamos a escolha
 * aqui para que o app não volte a registrar sozinho no próximo login.
 */
const KEY = '@portifolio:notifications_enabled';

export async function getNotificationsEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    // Sem escolha salva, o padrão é ligado (comportamento anterior do app).
    return raw === null ? true : raw === '1';
  } catch {
    return true;
  }
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, enabled ? '1' : '0');
  } catch {
    // Preferência é best-effort: se o storage falhar, mantemos só o estado da sessão.
  }
}
