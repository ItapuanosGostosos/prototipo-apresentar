import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../src/theme';
import { DecoBackground } from '../src/components/ui/DecoBackground';
import { BackHeader, GlassCard, IconBubble, type IconName } from '../src/components/ui/primitives';
import { notify } from '../src/utils/feedback';

const SUPPORT_EMAIL = 'suporte@portfoliotracker.app';

const FAQ: { q: string; a: string }[] = [
  {
    q: 'Como eu adiciono um ativo à minha carteira?',
    a: 'Vá em Carteira, escolha a carteira (ou deixe em "Todas") e toque em Adicionar. Informe o ticker, o nome e o tipo do ativo. Se você tiver mais de uma carteira, escolha ali mesmo em qual delas o ativo entra.',
  },
  {
    q: 'De onde vêm as notícias?',
    a: 'As notícias são buscadas em fontes públicas do mercado a partir dos tickers das suas carteiras. Só aparecem notícias ligadas a ativos que você cadastrou.',
  },
  {
    q: 'O que significa o impacto de −100% a +100%?',
    a: 'É a média do impacto estimado das notícias do período. Acima de +15% o cenário é considerado propício, abaixo de −15% adverso, e no meio neutro. O número resume tom da notícia, relevância para a empresa e assuntos detectados no texto.',
  },
  {
    q: 'Por que a análise fica "Pendente"?',
    a: 'A análise roda em segundo plano. Depois de tocar em Analisar, os artigos entram na fila e o resultado aparece em instantes. Puxe a lista para baixo para atualizar.',
  },
  {
    q: 'Posso ver tudo de uma vez, sem escolher carteira?',
    a: 'Sim. Em Carteira e em Analytics, o chip "Todas" vem selecionado por padrão e mostra os ativos e as análises de todas as suas carteiras, indicando a qual carteira cada item pertence.',
  },
  {
    q: 'Como ativo ou desativo as notificações?',
    a: 'Em Perfil › Notificações. Lá você concede a permissão, liga ou desliga os avisos e pode disparar uma notificação de teste para conferir.',
  },
  {
    q: 'Como altero minha senha ou meus dados?',
    a: 'Em Perfil › Configurações de Perfil você edita nome de usuário e CPF e altera a senha. O e-mail é a identificação da conta e não pode ser alterado.',
  },
  {
    q: 'As análises são recomendação de investimento?',
    a: 'Não. São estimativas automáticas sobre o tom das notícias, feitas para ajudar na leitura do noticiário. A decisão de investir é sua.',
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => setOpen((v) => !v)} accessibilityRole="button">
      <GlassCard style={s.faq}>
        <View style={s.faqHead}>
          <Text style={s.faqQuestion}>{q}</Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.textMuted} />
        </View>
        {open && <Text style={s.faqAnswer}>{a}</Text>}
      </GlassCard>
    </TouchableOpacity>
  );
}

function ContactRow({ icon, label, hint, onPress }: {
  icon: IconName; label: string; hint: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} accessibilityRole="button">
      <GlassCard style={s.contact}>
        <IconBubble name={icon} size={38} color={C.textSec} />
        <View style={{ flex: 1 }}>
          <Text style={s.contactLabel}>{label}</Text>
          <Text style={s.contactHint}>{hint}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
      </GlassCard>
    </TouchableOpacity>
  );
}

export default function HelpSupportScreen() {
  const router = useRouter();

  async function openMail() {
    const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Suporte Portfolio Tracker')}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
      else notify('Fale com o suporte', SUPPORT_EMAIL);
    } catch {
      notify('Fale com o suporte', SUPPORT_EMAIL);
    }
  }

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <BackHeader title="Ajuda & Suporte" />

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.intro}>
            Respostas rápidas para as dúvidas mais comuns. Se nada aqui resolver, fale com a gente.
          </Text>

          <Text style={s.sectionTitle}>Perguntas frequentes</Text>
          {FAQ.map((item) => <FaqItem key={item.q} q={item.q} a={item.a} />)}

          <Text style={s.sectionTitle}>Fale com a gente</Text>
          <ContactRow icon="mail-outline" label="E-mail do suporte" hint={SUPPORT_EMAIL} onPress={openMail} />
          <ContactRow
            icon="shield-checkmark-outline"
            label="Política de Privacidade"
            hint="Como tratamos os seus dados"
            onPress={() => router.push('/privacy-policy')}
          />
          <ContactRow
            icon="notifications-outline"
            label="Notificações"
            hint="Ligar, desligar e testar os avisos"
            onPress={() => router.push('/notifications-settings')}
          />

          <Text style={s.version}>Portfolio Tracker · versão 1.0.0</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 10, width: '100%', maxWidth: 640, alignSelf: 'center' },

  intro: { color: C.textSec, fontSize: 13, lineHeight: 19, marginBottom: 6 },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '700', marginTop: 14, marginBottom: 2 },

  faq: { padding: 14, borderRadius: R.lg, gap: 8 },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faqQuestion: { color: C.text, fontSize: 14, fontWeight: '600', flex: 1, lineHeight: 20 },
  faqAnswer: { color: C.textSec, fontSize: 13, lineHeight: 20 },

  contact: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: R.lg },
  contactLabel: { color: C.text, fontSize: 14, fontWeight: '600' },
  contactHint: { color: C.textMuted, fontSize: 12, marginTop: 2 },

  version: { color: C.textMuted, fontSize: 12, textAlign: 'center', marginTop: 18 },
});
