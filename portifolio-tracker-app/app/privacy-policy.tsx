import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, R } from '../src/theme';
import { DecoBackground } from '../src/components/ui/DecoBackground';
import { BackHeader, GlassCard } from '../src/components/ui/primitives';

/** Data da última revisão do texto — atualize junto com o conteúdo. */
const UPDATED_AT = '19 de setembro de 2026';

type Section = { title: string; paragraphs: string[]; bullets?: string[] };

const SECTIONS: Section[] = [
  {
    title: '1. Quem somos',
    paragraphs: [
      'O Portfolio Tracker é um aplicativo que acompanha notícias sobre os ativos que você cadastra e mede, por análise de sentimento, o impacto provável dessas notícias sobre cada ticker.',
      'Esta política explica quais dados usamos, por que usamos e o que você pode fazer a respeito.',
    ],
  },
  {
    title: '2. Dados que coletamos',
    paragraphs: ['Coletamos apenas o necessário para o aplicativo funcionar:'],
    bullets: [
      'Cadastro: e-mail, nome de usuário e, se você preencher, CPF.',
      'Carteiras: os nomes das carteiras e os ativos (ticker, nome e tipo) que você adiciona.',
      'Notificações: o identificador push do aparelho, apenas se você ativar os avisos.',
      'Uso técnico: registros de erro e de acesso à API, para manter o serviço no ar.',
    ],
  },
  {
    title: '3. Como usamos esses dados',
    paragraphs: ['Usamos seus dados para:'],
    bullets: [
      'Autenticar seu acesso e manter sua sessão.',
      'Montar suas carteiras e buscar notícias relacionadas aos seus ativos.',
      'Gerar as análises de sentimento e o panorama de impacto do período.',
      'Enviar avisos sobre notícias relevantes, quando você autorizar.',
    ],
  },
  {
    title: '4. Análise de sentimento',
    paragraphs: [
      'A análise é feita pelo nosso próprio motor, sobre o texto público das notícias. Nós não analisamos mensagens suas nem dados pessoais para gerar as pontuações.',
      'As pontuações são estimativas automáticas. Elas não são recomendação de compra, venda ou manutenção de qualquer ativo, e você continua responsável pelas suas decisões de investimento.',
    ],
  },
  {
    title: '5. Com quem compartilhamos',
    paragraphs: [
      'Não vendemos seus dados e não os compartilhamos para publicidade.',
      'Usamos serviços de terceiros estritamente operacionais: o provedor de identidade que cuida do login, o provedor de notificações push e a fonte pública de notícias do mercado. Cada um recebe apenas o dado necessário para a sua função.',
    ],
  },
  {
    title: '6. Por quanto tempo guardamos',
    paragraphs: [
      'Seus dados de cadastro e carteiras ficam guardados enquanto sua conta existir.',
      'Ao excluir uma carteira ou um ativo, o registro sai do aplicativo imediatamente. Ao encerrar a conta, apagamos os dados pessoais, preservando apenas o que a lei exigir.',
    ],
  },
  {
    title: '7. Seus direitos',
    paragraphs: ['Conforme a Lei Geral de Proteção de Dados (LGPD), você pode:'],
    bullets: [
      'Confirmar quais dados temos e pedir uma cópia.',
      'Corrigir dados incompletos ou desatualizados, direto em Configurações de Perfil.',
      'Pedir a exclusão da conta e dos dados associados.',
      'Retirar o consentimento das notificações a qualquer momento, em Perfil › Notificações.',
    ],
  },
  {
    title: '8. Segurança',
    paragraphs: [
      'O acesso à API exige token e o tráfego é autenticado a cada requisição. As senhas ficam sob responsabilidade do provedor de identidade e nunca são armazenadas pelo aplicativo.',
      'Nenhum sistema é infalível: se identificarmos um incidente que afete seus dados, avisaremos você e as autoridades competentes.',
    ],
  },
  {
    title: '9. Alterações nesta política',
    paragraphs: [
      'Quando mudarmos esta política, atualizamos a data de revisão no topo desta tela. Mudanças relevantes serão avisadas dentro do aplicativo.',
    ],
  },
  {
    title: '10. Contato',
    paragraphs: [
      'Dúvidas sobre privacidade ou pedidos relacionados aos seus dados: privacidade@portfoliotracker.app.',
    ],
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <BackHeader title="Política de Privacidade" />

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.updated}>Última atualização: {UPDATED_AT}</Text>

          {SECTIONS.map((section) => (
            <GlassCard key={section.title} style={s.section}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              {section.paragraphs.map((p) => (
                <Text key={p} style={s.paragraph}>{p}</Text>
              ))}
              {section.bullets?.map((bullet) => (
                <View key={bullet} style={s.bullet}>
                  <View style={s.dot} />
                  <Text style={s.bulletText}>{bullet}</Text>
                </View>
              ))}
            </GlassCard>
          ))}

          <Text style={s.footer}>
            Ao continuar usando o Portfolio Tracker você concorda com os termos acima.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 14, width: '100%', maxWidth: 640, alignSelf: 'center' },

  updated: { color: C.textMuted, fontSize: 12, marginBottom: 2 },

  section: { padding: 18, borderRadius: R.xl, gap: 10 },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  paragraph: { color: C.textSec, fontSize: 13, lineHeight: 20 },

  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accentLt, marginTop: 8 },
  bulletText: { color: C.textSec, fontSize: 13, lineHeight: 20, flex: 1 },

  footer: { color: C.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
});
