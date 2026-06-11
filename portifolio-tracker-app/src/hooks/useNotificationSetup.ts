import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore';

// expo-notifications não funciona no Expo Go desde SDK 53
// Só ativa em development build ou produção
const IS_EXPO_GO = Constants.appOwnership === 'expo';

export function useNotificationSetup() {
  const { isAuthenticated } = useAuthStore();
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || IS_EXPO_GO) return;

    async function setup() {
      try {
        const Notifications = await import('expo-notifications');
        const Device = await import('expo-device');
        const { registerDeviceToken, unregisterDeviceToken } = await import('../services/notifications');

        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });

        if (!Device.default.isDevice) return;

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
        if (finalStatus !== 'granted') return;

        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const tokenData = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        tokenRef.current = tokenData.data;

        const platform: 'android' | 'ios' = Platform.OS === 'ios' ? 'ios' : 'android';
        await registerDeviceToken(tokenRef.current, platform);
      } catch (err) {
        console.warn('Notificações não disponíveis:', err);
      }
    }

    setup();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated && tokenRef.current && !IS_EXPO_GO) {
      import('../services/notifications').then(({ unregisterDeviceToken }) => {
        unregisterDeviceToken(tokenRef.current!).catch(() => {});
        tokenRef.current = null;
      });
    }
  }, [isAuthenticated]);
}
