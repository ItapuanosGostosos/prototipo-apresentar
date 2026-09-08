import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/authStore';
import {
  IS_EXPO_GO,
  getNotificationPreference,
  getPushStatus,
  registerPushToken,
  unregisterPushToken,
} from '../services/pushNotifications';

/**
 * No login, registra o token de push caso o usuário já tenha concedido permissão e
 * não tenha desativado as notificações na tela "Notificações". Não pede permissão
 * sozinho: isso é feito pelo usuário, com contexto, naquela tela.
 * No logout, remove o token do backend.
 */
export function useNotificationSetup() {
  const { isAuthenticated } = useAuthStore();
  const registeredRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || IS_EXPO_GO || Platform.OS === 'web') return;

    (async () => {
      try {
        if (!(await getNotificationPreference())) return;
        if ((await getPushStatus()) !== 'granted') return;
        const token = await registerPushToken();
        registeredRef.current = token !== null;
      } catch (err) {
        console.warn('Notificações não disponíveis:', err);
      }
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated && registeredRef.current) {
      registeredRef.current = false;
      unregisterPushToken().catch(() => {});
    }
  }, [isAuthenticated]);
}
