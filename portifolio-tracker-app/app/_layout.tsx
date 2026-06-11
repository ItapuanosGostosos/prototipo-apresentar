import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { useNotificationSetup } from '../src/hooks/useNotificationSetup';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});

function AppContent() {
  const { isAuthenticated, initialize } = useAuthStore();
  const segments = useSegments();
  const segmentsRef = useRef(segments);
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useNotificationSetup();

  // Keep a ref so the redirect effect can read segments without depending on it
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    initialize().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segmentsRef.current[0] === '(auth)';
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/news');
    } else if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    }
  }, [ready, isAuthenticated]); // segments NOT here — avoids redirect loop

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      {!ready && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center',
        }}>
          <ActivityIndicator color="#818cf8" size="large" />
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
