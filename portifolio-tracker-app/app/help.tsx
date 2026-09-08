import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { C, R } from '../src/theme';
import { DecoBackground } from '../src/components/ui/DecoBackground';
import { BackHeader, GlassCard, IconBubble, PrimaryButton, type IconName } from '../src/components/ui/primitives';
import { APP_NAME, SUPPORT_EMAIL } from '../src/constants';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Faq = { q: string; a: string };
type Group = { title: string; icon: IconName; items: Faq[] };

const GROUPS: Group[] = [
  {
    title: 'Carteiras e ativos',
    icon: 'wallet-outline',
    items: [
      {
        q: 'Como crio uma carteira?',
        a: 'Na aba Carteira, toque em "Novo", dê um nome (ex.: "Longo prazo") e confirme. Você pode ter quantas carteiras quiser e alternar entre elas pelos chips no topo da tela.',
      },
      {
        q: 'Como adiciono um ativo?',
        a: 'Selecione uma carteira, toque em "Adicionar" (ou no botão tracejado "+"), informe o ticker exatamente como negociado (ex.: PETR4, HGLG11, BTC), um nome para identificação e o tipo. O ticker é usado para relacionar as notícias ao ativo.',
      },
      {
        q: 'Quais tipos de ativo existem?',
        a: 'Ação, FII (fundo imobiliário), Cripto, ETF e BDR. O tipo serve para organizar a carteira e colorir os cartões; ele não altera a busca de notícias.',
      },
      {
        q: 'Como removo um ativo ou excluo uma carteira?',
        a: 'Para remover um ativo, toque no "x" no canto do cartão dele e confirme. Para excluir uma carteira, toque no ícone de lixeira ao lado de "Ativos" ou mantenha o chip da carteira pressionado. A exclusão é definitiva.',
      },
    ],
  },
  {
    title: 'Notícias e análise com IA',
    icon: 'newspaper-outline',
    items: [
      {
        q: 'De onde vêm as notícias?',
        a: 'Agregamos fontes públicas de notícias financeiras e as relacionamos aos tickers das suas carteiras. Em "Notícias" você filtra por todas, por ticker ou por carteira. Toque em uma notícia para abrir a matéria original.',
      },
      {
        q: 'O que faz o botão "Analise com IA"?',
        a: 'Ele envia as notícias recentes dos ativos de uma carteira para o motor de análise de sentimento. O resultado (positivo, neutro ou negativo, com impacto estimado e explicação) aparece na aba Analytics assim que o processamento termina. A análise é uma leitura automatizada do texto e não é recomendação de investimento.',
      },
      {
        q: 'Minha análise ficou "Pendente". E agora?',
        a: 'As análises são processadas em fila e costumam levar poucos minutos. Puxe a lista para baixo em Analytics para atualizar. Se ficar "Falhou", toque em "Analisar" novamente.',
      },
    ],
  },
  {
    title: 'Notificações',
    icon: 'notifications-outline',
    items: [
      {
        q: 'Como ativo as notificações?',
        a: 'Em Perfil › Notificações, toque em "Ativar notificações" e aceite a permissão do sistema. Você passa a receber alertas quando sair notícia relevante sobre um ativo das suas carteiras.',
      },
      {
        q: 'Neguei a permissão sem querer. Como reverter?',
        a: 'Abra as configurações do sistema para o app (o botão "Abrir ajustes do sistema" leva até lá), permita notificações e volte à tela Notificações para concluir o registro.',
      },
      {
        q: 'Por que não recebo notificações no Expo Go?',
        a: 'O Expo Go não suporta notificações push remotas. Elas funcionam em um build de desenvolvimento ou na versão publicada do app.',
      },
    ],
  },
  {
    title: 'Conta e segurança',
    icon: 'shield-checkmark-outline',
    items: [
      {
        q: 'Como altero meu nome de usuário ou CPF?',
        a: 'Em Perfil › Configurações de Perfil você edita o nome de usuário e o CPF. O e-mail é o identificador da conta e não pode ser alterado pelo app.',
      },
      {
        q: 'Como troco minha senha?',
        a: 'Em Configurações de Perfil, seção "Alterar Senha", informe a senha atual, a nova senha (mínimo de 6 caracteres) e a confirmação.',
      },
      {
        q: 'Esqueci minha senha.',
        a: `Por enquanto a redefinição é feita pelo suporte. Envie um e-mail para ${SUPPORT_EMAIL} a partir do endereço cadastrado e responderemos com as instruções.`,
      },
      {
        q: 'Como excluo minha conta e meus dados?',
        a: `Envie a solicitação para ${SUPPORT_EMAIL} a partir do e-mail cadastrado. A conta e os dados associados são removidos em até 30 dias, conforme a Política de Privacidade.`,
      },
    ],
  },
];

function FaqItem({ item }: { item: Faq }) {
  const [open, setOpen] = useState(false);
  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  }
  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={s.faqItem} accessibilityRole="button" accessibilityState={{ expanded: open }}>
      <View style={s.faqHead}>
        <Text style={s.faqQ}>{item.q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={C.textMuted} />
      </View>
      {open ? <Text style={s.faqA}>{item.a}</Text> : null}
    </TouchableOpacity>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const subject = encodeURIComponent(`Suporte - ${APP_NAME}`);
  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <BackHeader title="Ajuda & Suporte" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.intro}>Perguntas frequentes sobre o {APP_NAME}. Não achou o que procura? Fale com a gente no fim da página.</Text>

          {GROUPS.map((g) => (
            <GlassCard key={g.title} style={s.group}>
              <View style={s.groupHead}>
                <IconBubble name={g.icon} size={36} color={C.accentLt} />
                <Text style={s.groupTitle}>{g.title}</Text>
              </View>
              {g.items.map((item, i) => (
                <View key={item.q} style={i < g.items.length - 1 ? s.divider : undefined}>
                  <FaqItem item={item} />
                </View>
              ))}
            </GlassCard>
          ))}

          <GlassCard style={s.contactCard} strong>
            <Text style={s.contactTitle}>Ainda precisa de ajuda?</Text>
            <Text style={s.contactText}>Nossa equipe responde em até 2 dias úteis.</Text>
            <PrimaryButton
              label="Enviar e-mail ao suporte"
              icon="mail-outline"
              onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`)}
              style={{ marginTop: 12 }}
            />
            <Text style={s.contactEmail}>{SUPPORT_EMAIL}</Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 14, width: '100%', maxWidth: 640, alignSelf: 'center' },
  intro: { color: C.textSec, fontSize: 14, lineHeight: 21 },
  group: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: R.xl },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 6 },
  groupTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  faqItem: { paddingVertical: 12 },
  faqHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQ: { flex: 1, color: C.text, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  faqA: { color: C.textSec, fontSize: 13, lineHeight: 20, marginTop: 8 },
  contactCard: { padding: 18, borderRadius: R.xl, alignItems: 'center' },
  contactTitle: { color: C.text, fontSize: 16, fontWeight: '700' },
  contactText: { color: C.textSec, fontSize: 13, marginTop: 4 },
  contactEmail: { color: C.textMuted, fontSize: 12, marginTop: 10 },
});
