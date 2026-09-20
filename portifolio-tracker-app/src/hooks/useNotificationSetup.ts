import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { getNotificationsEnabled } from '../services/notificationPrefs';
import { IS_NATIVE_PUSH, enablePush, getCurrentToken, unregisterCurrentToken } from '../services/push';

/**
 * Registra o aparelho para push ao entrar, desde que o usuário não tenha
 * desligado as notificações na tela de Perfil › Notificações.
 *
 * A lógica de permissão/registro mora em `services/push.ts`, compartilhada com
 * aquela tela. Expo Go e web não registram token (ver o serviço).
 */
export function useNotificationSetup() {
  const isAuthenticated = useAuthStore((st) => st.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !IS_NATIVE_PUSH) return;

    let cancelled = false;
    (async () => {
      const wanted = await getNotificationsEnabled();
      if (cancelled || !wanted) return;
      const res = await enablePush();
      if (!res.ok) console.warn('Notificações não disponíveis:', res.message);
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Ao sair da conta, o token deste aparelho não deve continuar no backend.
  useEffect(() => {
    if (!isAuthenticated && IS_NATIVE_PUSH && getCurrentToken()) {
      // Só tira o token daqui — a preferência do usuário continua valendo.
      unregisterCurrentToken().catch(() => {});
    }
  }, [isAuthenticated]);
}
