import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, Image, Text, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { useNotificationSetup } from '../src/hooks/useNotificationSetup';
import { DecoBackground } from '../src/components/ui/DecoBackground';
import { C, R, shadow } from '../src/theme';

const logoSource = require('../assets/logo.png');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60,
    },
  },
});

/** Tela de carregamento (Figma "Loading Screen"): logo, marca e spinner sobre o gradiente. */
function LoadingOverlay() {
  return (
    <View style={s.loading}>
      <DecoBackground waves={false} intensity={1.4} />
      <Image source={logoSource} style={s.loadingLogo} resizeMode="contain" accessibilityLabel="Portfolio Tracker" />
      <Text style={s.loadingBrand}>Portfolio Tracker</Text>
      <Text style={s.loadingSub}>Acompanhe seus investimentos</Text>
      <ActivityIndicator color={C.accentLt} size="large" style={s.loadingSpinner} />
    </View>
  );
}

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
    <View style={s.root}>
      <StatusBar style="light" />
      <Slot />
      {!ready && <LoadingOverlay />}
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  loading: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center',
  },
  loadingLogo: { width: 104, height: 104, borderRadius: R.lg, marginBottom: 20, ...shadow.glow },
  loadingBrand: { color: C.text, fontSize: 32, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center' },
  loadingSub: { color: C.textMuted, fontSize: 15, marginTop: 2 },
  loadingSpinner: { marginTop: 40 },
});
