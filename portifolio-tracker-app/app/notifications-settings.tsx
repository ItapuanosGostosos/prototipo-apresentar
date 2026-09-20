import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../src/theme';
import { DecoBackground } from '../src/components/ui/DecoBackground';
import { BackHeader, GhostButton, GlassCard, IconBubble } from '../src/components/ui/primitives';
import { getNotificationsEnabled } from '../src/services/notificationPrefs';
import { notify } from '../src/utils/feedback';
import {
  IS_EXPO_GO, IS_WEB, disablePush, enablePush, getPermissionStatus,
  sendTestNotification, type PermissionStatus,
} from '../src/services/push';

const STATUS_TEXT: Record<PermissionStatus, { label: string; color: string; icon: string }> = {
  granted:      { label: 'Permissão concedida', color: C.success, icon: 'checkmark-circle' },
  denied:       { label: 'Permissão negada',    color: '#FF8A8A', icon: 'close-circle' },
  undetermined: { label: 'Permissão pendente',  color: C.warning, icon: 'help-circle' },
  unsupported:  { label: 'Não disponível aqui', color: C.textMuted, icon: 'information-circle' },
};

export default function NotificationsSettingsScreen() {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<PermissionStatus>('undetermined');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [pref, perm] = await Promise.all([getNotificationsEnabled(), getPermissionStatus()]);
    setStatus(perm);
    // "Ligado" de verdade = o usuário quer receber E o sistema autorizou.
    setEnabled(pref && perm === 'granted');
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleToggle(next: boolean) {
    setBusy(true);
    try {
      if (next) {
        const res = await enablePush();
        setStatus(res.status);
        setEnabled(res.ok);
        notify(res.ok ? 'Notificações ativadas' : 'Não foi possível ativar', res.message);
      } else {
        await disablePush();
        setEnabled(false);
        notify('Notificações desativadas', 'Você não receberá mais avisos das notícias da sua carteira.');
      }
    } catch (err) {
      notify('Erro', err instanceof Error ? err.message : 'Tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    const ok = await sendTestNotification();
    if (!ok) {
      notify('Não enviado', 'Ative as notificações primeiro para receber o teste.');
    }
  }

  const st = STATUS_TEXT[status];

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <BackHeader title="Notificações" />

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={C.accentLt} style={{ marginTop: 40 }} />
          ) : (
            <>
              {/* Chave principal */}
              <GlassCard style={s.section}>
                <View style={s.switchRow}>
                  <IconBubble name="notifications-outline" size={42} color={enabled ? C.accentLt : C.textSec} active={enabled} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.switchLabel}>Avisos de notícias</Text>
                    <Text style={s.switchHint}>
                      Receba um aviso quando sair uma notícia relevante sobre os ativos das suas carteiras.
                    </Text>
                  </View>
                  {busy ? (
                    <ActivityIndicator color={C.accentLt} />
                  ) : (
                    <Switch
                      value={enabled}
                      onValueChange={handleToggle}
                      trackColor={{ false: 'rgba(255,255,255,0.18)', true: C.accent }}
                      thumbColor={enabled ? '#fff' : '#d8d5e6'}
                      accessibilityLabel="Ativar notificações"
                    />
                  )}
                </View>

                <View style={[s.statusRow, { borderColor: st.color + '55', backgroundColor: st.color + '18' }]}>
                  <Ionicons name={st.icon as any} size={16} color={st.color} />
                  <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
                </View>

                <GhostButton label="Enviar notificação de teste" icon="send-outline" onPress={handleTest} style={s.testBtn} />
              </GlassCard>

              {/* O que chega */}
              <GlassCard style={s.section}>
                <Text style={s.sectionTitle}>O que você recebe</Text>
                {[
                  { icon: 'newspaper-outline', text: 'Notícias novas sobre os ativos das suas carteiras.' },
                  { icon: 'sparkles-outline',  text: 'Resultado da análise de sentimento assim que fica pronta.' },
                  { icon: 'trending-up',       text: 'Alertas quando o impacto geral de um ticker muda de tom.' },
                ].map((item) => (
                  <View key={item.text} style={s.bullet}>
                    <Ionicons name={item.icon as any} size={16} color={C.accentLt} />
                    <Text style={s.bulletText}>{item.text}</Text>
                  </View>
                ))}
              </GlassCard>

              {/* Avisos por plataforma */}
              {(IS_EXPO_GO || IS_WEB || status === 'denied') && (
                <GlassCard style={s.section}>
                  <Text style={s.sectionTitle}>Observações</Text>
                  {IS_EXPO_GO && (
                    <Text style={s.note}>
                      No Expo Go o push remoto não funciona desde o SDK 53. Rode um development build para receber avisos no celular.
                    </Text>
                  )}
                  {IS_WEB && (
                    <Text style={s.note}>
                      Na web usamos as notificações do próprio navegador. Os avisos chegam enquanto esta aba estiver aberta.
                    </Text>
                  )}
                  {status === 'denied' && (
                    <Text style={s.note}>
                      A permissão está bloqueada. Libere as notificações {Platform.OS === 'web' ? 'nas configurações do site no navegador' : 'nas configurações do aparelho'} e volte aqui.
                    </Text>
                  )}
                </GlassCard>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 16, width: '100%', maxWidth: 560, alignSelf: 'center' },

  section: { padding: 18, borderRadius: R.xl, gap: 12 },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '700' },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchLabel: { color: C.text, fontSize: 15, fontWeight: '600' },
  switchHint: { color: C.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2 },

  statusRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: R.pill, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start',
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  testBtn: { alignSelf: 'flex-start' },

  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletText: { color: C.textSec, fontSize: 13, lineHeight: 19, flex: 1 },

  note: { color: C.textSec, fontSize: 13, lineHeight: 19 },
});
