import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { C, R } from '../src/theme';
import { DecoBackground } from '../src/components/ui/DecoBackground';
import { BackHeader, GhostButton, GlassCard } from '../src/components/ui/primitives';
import { APP_NAME, PRIVACY_POLICY_UPDATED_AT, SUPPORT_EMAIL } from '../src/constants';

type Section = { title: string; paragraphs?: string[]; bullets?: string[] };

const SECTIONS: Section[] = [
  {
    title: '1. Quem somos e a quem esta política se aplica',
    paragraphs: [
      `Esta Política de Privacidade descreve como o ${APP_NAME} ("nós") coleta, utiliza, armazena e compartilha dados pessoais de quem usa o aplicativo e a API associada. Ela é elaborada em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 – LGPD).`,
      'Ao criar uma conta ou usar o aplicativo, você declara ter lido e compreendido esta política.',
    ],
  },
  {
    title: '2. Dados que coletamos',
    paragraphs: ['Coletamos apenas o necessário para prestar o serviço:'],
    bullets: [
      'Dados de cadastro: e-mail, nome de usuário e senha (a senha é armazenada de forma criptografada pelo provedor de identidade, nunca em texto puro).',
      'Dados opcionais de perfil: CPF, informado voluntariamente na tela de Configurações de Perfil.',
      'Dados de uso do produto: carteiras criadas, ativos e tickers acompanhados, análises de sentimento solicitadas e seus resultados.',
      'Dados do dispositivo: um token anônimo de notificações push e a plataforma (Android ou iOS), apenas se você ativar as notificações.',
      'Registros técnicos: data e hora de acesso, endereço IP e identificadores de sessão, usados para segurança e diagnóstico.',
    ],
  },
  {
    title: '3. Para que usamos os dados',
    bullets: [
      'Autenticar você e manter sua sessão ativa com segurança.',
      'Exibir suas carteiras e selecionar notícias relacionadas aos seus ativos.',
      'Executar, quando você solicitar, a análise de sentimento das notícias e apresentar os resultados.',
      'Enviar notificações sobre notícias relevantes, se você optar por recebê-las.',
      'Prevenir fraudes, abusos e falhas, e cumprir obrigações legais.',
    ],
    paragraphs: ['Não vendemos dados pessoais nem os utilizamos para publicidade de terceiros.'],
  },
  {
    title: '4. Bases legais',
    paragraphs: [
      'Tratamos seus dados com base na execução do contrato (prestação do serviço que você contratou), no seu consentimento (por exemplo, para notificações e para o CPF opcional), no legítimo interesse (segurança e melhoria do produto) e no cumprimento de obrigação legal ou regulatória.',
    ],
  },
  {
    title: '5. Com quem compartilhamos',
    paragraphs: ['Compartilhamos dados somente com operadores necessários ao funcionamento do serviço:'],
    bullets: [
      'Provedor de identidade (Keycloak): autenticação e gestão de credenciais.',
      'Serviço de notificações push (Expo/Firebase Cloud Messaging): entrega dos alertas ao seu dispositivo.',
      'Fontes de notícias e cotações públicas: consultadas pelos nossos servidores; nenhum dado pessoal seu é enviado a elas.',
      'Provedores de infraestrutura em nuvem e banco de dados que hospedam a aplicação.',
      'Autoridades públicas, quando exigido por lei ou ordem judicial.',
    ],
  },
  {
    title: '6. Por quanto tempo guardamos',
    paragraphs: [
      'Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta, os dados são apagados ou anonimizados em até 30 dias, salvo quando a lei exigir retenção por prazo maior (por exemplo, registros de acesso, mantidos por 6 meses conforme o Marco Civil da Internet).',
      'Tokens de notificação são removidos imediatamente ao sair da conta ou ao desativar as notificações.',
    ],
  },
  {
    title: '7. Segurança',
    paragraphs: [
      'Adotamos medidas técnicas e organizacionais como criptografia em trânsito (HTTPS), tokens de acesso de curta duração, controle de acesso por perfil e registro de atividades administrativas. Nenhum sistema é totalmente seguro; se identificarmos um incidente que possa gerar risco a você, comunicaremos nos termos da LGPD.',
    ],
  },
  {
    title: '8. Seus direitos',
    paragraphs: ['Você pode, a qualquer momento:'],
    bullets: [
      'Confirmar a existência de tratamento e acessar seus dados.',
      'Corrigir dados incompletos, inexatos ou desatualizados (nome de usuário e CPF podem ser editados no próprio app).',
      'Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.',
      'Solicitar a portabilidade dos seus dados.',
      'Revogar o consentimento, inclusive desativando as notificações no app.',
      'Solicitar a exclusão da sua conta.',
    ],
    paragraphs2: undefined,
  } as Section,
  {
    title: '9. Crianças e adolescentes',
    paragraphs: ['O aplicativo destina-se a maiores de 18 anos. Não coletamos intencionalmente dados de menores; se identificarmos esse caso, excluiremos a conta.'],
  },
  {
    title: '10. Alterações desta política',
    paragraphs: [
      'Podemos atualizar esta política para refletir mudanças no produto ou na legislação. Alterações relevantes serão comunicadas no aplicativo. A data da última atualização aparece no fim desta página.',
    ],
  },
  {
    title: '11. Contato do encarregado (DPO)',
    paragraphs: [`Para exercer seus direitos ou tirar dúvidas sobre privacidade, escreva para ${SUPPORT_EMAIL}. Respondemos em até 15 dias.`],
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }}>
        <BackHeader title="Política de Privacidade" onBack={() => router.back()} />
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.intro}>
            Transparência sobre o que coletamos, por quê e como você controla seus dados.
          </Text>

          {SECTIONS.map((sec) => (
            <GlassCard key={sec.title} style={s.card}>
              <Text style={s.sectionTitle}>{sec.title}</Text>
              {sec.paragraphs?.map((par, i) => (
                <Text key={i} style={s.paragraph}>{par}</Text>
              ))}
              {sec.bullets?.map((b, i) => (
                <View key={i} style={s.bulletRow}>
                  <View style={s.bulletDot} />
                  <Text style={s.bulletText}>{b}</Text>
                </View>
              ))}
            </GlassCard>
          ))}

          <GhostButton
            label="Falar com o encarregado"
            icon="mail-outline"
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Privacidade%20-%20${encodeURIComponent(APP_NAME)}`)}
            style={s.contact}
          />
          <Text style={s.updated}>Última atualização: {PRIVACY_POLICY_UPDATED_AT}</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 12, width: '100%', maxWidth: 640, alignSelf: 'center' },
  intro: { color: C.textSec, fontSize: 14, lineHeight: 21, marginBottom: 4 },
  card: { padding: 16, borderRadius: R.lg },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '700', marginBottom: 8 },
  paragraph: { color: C.textSec, fontSize: 13, lineHeight: 20, marginBottom: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accentLt, marginTop: 7 },
  bulletText: { flex: 1, color: C.textSec, fontSize: 13, lineHeight: 20 },
  contact: { alignSelf: 'center', marginTop: 8 },
  updated: { color: C.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 },
});
