import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Linking, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { C, R } from '../src/theme';
import { DecoBackground } from '../src/components/ui/DecoBackground';
import { BackHeader, GhostButton, GlassCard, IconBubble, Notice, PrimaryButton } from '../src/components/ui/primitives';
import {
  IS_EXPO_GO,
  disablePushNotifications,
  enablePushNotifications,
  getNotificationPreference,
  getPushStatus,
  getStoredPushToken,
  type PushStatus,
} from '../src/services/pushNotifications';

const STATUS_LABEL: Record<PushStatus, { title: string; description: string; color: string }> = {
  granted: { title: 'Permitidas', description: 'O dispositivo aceita notificações deste app.', color: C.success },
  denied: { title: 'Bloqueadas', description: 'A permissão foi negada. Libere nos ajustes do sistema.', color: '#FF8A8A' },
  undetermined: { title: 'Ainda não solicitadas', description: 'Toque em "Ativar notificações" para pedir a permissão.', color: C.warning },
  unsupported: { title: 'Indisponíveis', description: 'Este ambiente não suporta notificações.', color: C.textMuted },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'info' | 'success' | 'error' | 'warning'; text: string } | null>(null);

  const refresh = useCallback(async () => {
    const [s, pref, t] = await Promise.all([getPushStatus(), getNotificationPreference(), getStoredPushToken()]);
    setStatus(s);
    setEnabled(pref);
    setToken(t);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleEnable() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await enablePushNotifications();
      if (result.status === 'granted') {
        if (result.token) {
          setMessage({ kind: 'success', text: 'Notificações ativadas. Você receberá alertas sobre as notícias dos seus ativos.' });
        } else if (Platform.OS === 'web') {
          setMessage({ kind: 'info', text: 'Permissão concedida no navegador. Alertas push são enviados apenas pelo app instalado no celular.' });
        } else if (IS_EXPO_GO) {
          setMessage({ kind: 'warning', text: 'Permissão concedida, mas o Expo Go não recebe push remoto. Use um build de desenvolvimento ou a versão publicada.' });
        } else {
          setMessage({ kind: 'warning', text: 'Permissão concedida, mas não foi possível registrar este dispositivo. Tente novamente mais tarde.' });
        }
      } else if (result.status === 'denied') {
        setMessage({ kind: 'error', text: 'Permissão negada. Você pode liberar nas configurações do sistema.' });
      } else {
        setMessage({ kind: 'warning', text: 'Notificações não estão disponíveis neste ambiente.' });
      }
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Não foi possível ativar as notificações.' });
    } finally {
      setBusy(false);
      await refresh();
    }
  }

  async function handleToggle(value: boolean) {
    if (value) {
      await handleEnable();
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await disablePushNotifications();
      setMessage({ kind: 'info', text: 'Notificações desativadas. Este dispositivo não receberá mais alertas.' });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Não foi possível desativar.' });
    } finally {
      setBusy(false);
      await refresh();
    }
  }

  const info = status ? STATUS_LABEL[status] : null;
  const active = status === 'granted' && enabled;

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <BackHeader title="Notificações" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Estado atual */}
          <GlassCard style={s.card}>
            {!info ? (
              <ActivityIndicator color={C.accentLt} />
            ) : (
              <View style={s.statusRow}>
                <IconBubble name={active ? 'notifications' : 'notifications-off-outline'} size={48} color={info.color} bg={info.color + '22'} />
                <View style={{ flex: 1 }}>
                  <Text style={s.statusLabel}>Permissão do dispositivo</Text>
                  <Text style={[s.statusTitle, { color: info.color }]}>{info.title}</Text>
                  <Text style={s.statusDesc}>{info.description}</Text>
                </View>
              </View>
            )}
          </GlassCard>

          {message ? <Notice kind={message.kind}>{message.text}</Notice> : null}

          {/* Preferência */}
          <GlassCard style={s.card}>
            <View style={s.prefRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.prefTitle}>Notícias do portfólio</Text>
                <Text style={s.prefDesc}>Alertas quando sair notícia relevante sobre um ativo das suas carteiras.</Text>
              </View>
              <Switch
                value={active}
                onValueChange={handleToggle}
                disabled={busy || status === 'unsupported'}
                trackColor={{ false: 'rgba(255,255,255,0.18)', true: C.accent }}
                thumbColor="#fff"
                accessibilityLabel="Ativar notificações de notícias"
              />
            </View>
          </GlassCard>

          {status !== 'granted' && status !== 'unsupported' ? (
            <PrimaryButton label="Ativar notificações" icon="notifications-outline" onPress={handleEnable} loading={busy} disabled={status === null} />
          ) : null}

          {status === 'denied' && Platform.OS !== 'web' ? (
            <GhostButton label="Abrir ajustes do sistema" icon="settings-outline" onPress={() => Linking.openSettings()} style={s.settingsBtn} />
          ) : null}

          {/* Como funciona */}
          <GlassCard style={s.card}>
            <Text style={s.howTitle}>Como funciona</Text>
            <Text style={s.howText}>
              Quando uma notícia envolve um ticker das suas carteiras, o servidor envia um alerta para os dispositivos
              registrados. O registro usa um token anônimo do serviço de push, associado à sua conta, e é removido ao
              sair da conta ou ao desativar as notificações aqui.
            </Text>
            {IS_EXPO_GO ? (
              <Text style={[s.howText, { marginTop: 8 }]}>
                No Expo Go, o sistema pode conceder a permissão, mas o push remoto só funciona em um build de
                desenvolvimento ou na versão publicada do app.
              </Text>
            ) : null}
            {token ? <Text style={s.tokenText} numberOfLines={1}>Dispositivo registrado: {token}</Text> : null}
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 16, width: '100%', maxWidth: 560, alignSelf: 'center' },
  card: { padding: 18, borderRadius: R.xl },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  statusLabel: { color: C.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  statusTitle: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  statusDesc: { color: C.textSec, fontSize: 13, marginTop: 4, lineHeight: 18 },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  prefTitle: { color: C.text, fontSize: 15, fontWeight: '600' },
  prefDesc: { color: C.textMuted, fontSize: 12, marginTop: 4, lineHeight: 17 },
  settingsBtn: { alignSelf: 'center' },
  howTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  howText: { color: C.textSec, fontSize: 13, lineHeight: 20 },
  tokenText: { color: C.textMuted, fontSize: 11, marginTop: 12 },
});
