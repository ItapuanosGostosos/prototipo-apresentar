import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { C, R, TAB_BAR_SPACE, shadow } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
import { GlassCard, IconBubble } from '../../src/components/ui/primitives';
import { useAuthStore } from '../../src/store/authStore';
import { listPortfolios } from '../../src/services/portfolios';
import { getGlobalNews } from '../../src/services/news';
import type { NewsArticle, PortfolioListItem } from '../../src/types';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function Avatar({ name }: { name: string }) {
  return (
    <LinearGradient colors={[C.accentLt, C.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatarRing}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>{name[0]?.toUpperCase() ?? 'U'}</Text>
      </View>
    </LinearGradient>
  );
}

/** Cartão "Minha carteira" (Figma "My wallet"): resumo dos portfólios em mini-cards. */
function WalletCard({ portfolios }: { portfolios: PortfolioListItem[] }) {
  const router = useRouter();
  const totalAssets = portfolios.reduce((acc, p) => acc + p.asset_count, 0);
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/(tabs)/portfolios')}>
      <GlassCard style={s.walletCard} strong>
        <View style={s.walletHead}>
          <IconBubble name="wallet-outline" size={36} />
          <View style={{ flex: 1 }}>
            <Text style={s.walletLabel}>Minha carteira</Text>
            <Text style={s.walletSummary}>
              {portfolios.length === 0
                ? 'Crie seu primeiro portfólio'
                : `${portfolios.length} ${portfolios.length === 1 ? 'portfólio' : 'portfólios'} · ${totalAssets} ${totalAssets === 1 ? 'ativo' : 'ativos'}`}
            </Text>
          </View>
          <Ionicons name="chevron-forward" color={C.textMuted} size={18} />
        </View>
        {portfolios.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.walletChips}>
            {portfolios.map((p) => (
              <View key={p.id} style={s.walletChip}>
                <Text style={s.walletChipName} numberOfLines={1}>{p.name}</Text>
                <Text style={s.walletChipCount}>{p.asset_count} ativos</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

function NewsRow({ article }: { article: NewsArticle }) {
  return (
    <TouchableOpacity style={s.newsRow} onPress={() => Linking.openURL(article.url)} activeOpacity={0.75}>
      <View style={s.newsRowDot} />
      <View style={{ flex: 1 }}>
        <Text style={s.newsRowTitle} numberOfLines={2}>{article.title}</Text>
        {article.tickers.length > 0 && (
          <View style={s.tickerRow}>
            {article.tickers.slice(0, 3).map((t) => (
              <View key={t} style={s.tickerBadge}>
                <Text style={s.tickerText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function SuggestionCard({ article }: { article: NewsArticle }) {
  return (
    <TouchableOpacity onPress={() => Linking.openURL(article.url)} activeOpacity={0.8}>
      <GlassCard style={s.suggCard}>
        {article.tickers.length > 0 && (
          <View style={s.suggTickers}>
            {article.tickers.slice(0, 2).map((t) => (
              <View key={t} style={s.suggTicker}>
                <Text style={s.suggTickerText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={s.suggTitle} numberOfLines={3}>{article.title}</Text>
        {article.source && <Text style={s.suggSource}>{article.source.name}</Text>}
      </GlassCard>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useAuthStore();
  const username = user?.username || user?.email?.split('@')[0] || 'Usuário';

  const { data: portfolios, isLoading: loadingPortfolios } = useQuery({
    queryKey: ['portfolios'],
    queryFn: listPortfolios,
  });

  const { data: news, isLoading: loadingNews } = useQuery({
    queryKey: ['news', 'global'],
    queryFn: getGlobalNews,
  });

  const suggestions = (news ?? []).slice(0, 6);
  const trending   = (news ?? []).slice(6, 14);

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.greeting}>{greeting()} 👋</Text>
              <Text style={s.username}>{username}</Text>
            </View>
            <Avatar name={username} />
          </View>

          {/* Wallet card */}
          {loadingPortfolios ? (
            <GlassCard style={[s.walletCard, s.walletLoading]}>
              <ActivityIndicator color={C.accentLt} />
            </GlassCard>
          ) : (
            <WalletCard portfolios={portfolios ?? []} />
          )}

          {/* Suggestions */}
          <View style={s.sectionHeader}>
            <Ionicons name="sparkles-outline" color={C.accentLt} size={16} />
            <Text style={s.sectionTitle}>Sugestões Portfolio Tracker</Text>
            <View style={s.sectionBadge}>
              <Text style={s.sectionBadgeText}>IA</Text>
            </View>
          </View>

          {loadingNews ? (
            <ActivityIndicator color={C.accentLt} style={{ marginVertical: 20 }} />
          ) : suggestions.length === 0 ? (
            <GlassCard style={s.emptyCard}>
              <Text style={s.emptyText}>Nenhuma sugestão por enquanto.</Text>
            </GlassCard>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.suggScroll} contentContainerStyle={s.suggRow}>
              {suggestions.map((a) => (
                <SuggestionCard key={a.id} article={a} />
              ))}
            </ScrollView>
          )}

          {/* Trending (Figma "Trending": cartão violeta) */}
          <LinearGradient
            colors={['rgba(124,109,255,0.55)', 'rgba(91,79,219,0.35)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.trendingCard}
          >
            <View style={s.trendingHead}>
              <Ionicons name="trending-up" color={C.text} size={18} />
              <Text style={s.trendingTitle}>Em alta</Text>
            </View>
            {loadingNews ? (
              <ActivityIndicator color={C.text} style={{ marginVertical: 12 }} />
            ) : trending.length === 0 ? (
              <Text style={s.trendingEmpty}>Sem destaques no momento.</Text>
            ) : (
              trending.map((a) => <NewsRow key={a.id} article={a} />)
            )}
          </LinearGradient>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: TAB_BAR_SPACE, width: '100%', maxWidth: 720, alignSelf: 'center' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 16, marginBottom: 20,
  },
  greeting: { color: C.textMuted, fontSize: 13 },
  username: { color: C.text, fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  avatarRing: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', ...shadow.glow },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.bgSolid, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: C.text, fontSize: 18, fontWeight: '700' },

  walletCard: { padding: 16, marginBottom: 24, borderRadius: R.xl },
  walletLoading: { height: 96, alignItems: 'center', justifyContent: 'center' },
  walletHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  walletLabel: { color: C.textMuted, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  walletSummary: { color: C.text, fontSize: 15, fontWeight: '600', marginTop: 2 },
  walletChips: { gap: 8, paddingTop: 14 },
  walletChip: {
    backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: C.border, minWidth: 120,
  },
  walletChipName: { color: C.text, fontWeight: '700', fontSize: 14 },
  walletChipCount: { color: C.textMuted, fontSize: 11, marginTop: 2 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { color: C.text, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  sectionBadge: { backgroundColor: C.accent, borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 2 },
  sectionBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  suggScroll: { marginHorizontal: -20 },
  suggRow: { paddingHorizontal: 20, gap: 12 },
  suggCard: { padding: 14, width: 200, minHeight: 130 },
  suggTickers: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  suggTicker: { backgroundColor: C.accentSoft, borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 3 },
  suggTickerText: { color: C.accentLt, fontSize: 11, fontWeight: '700' },
  suggTitle: { color: C.text, fontSize: 13, fontWeight: '600', lineHeight: 19, flex: 1 },
  suggSource: { color: C.textMuted, fontSize: 10, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.4 },
  emptyCard: { padding: 16 },
  emptyText: { color: C.textMuted, fontSize: 14 },

  trendingCard: {
    marginTop: 24, borderRadius: R.xl, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  trendingHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  trendingTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  trendingEmpty: { color: C.textSec, fontSize: 13, paddingVertical: 12 },

  newsRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.18)',
  },
  newsRowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.pinkLt, marginTop: 6, flexShrink: 0 },
  newsRowTitle: { color: C.text, fontSize: 13, lineHeight: 19, flex: 1 },
  tickerRow: { flexDirection: 'row', gap: 5, marginTop: 6 },
  tickerBadge: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 2,
  },
  tickerText: { color: C.text, fontSize: 10, fontWeight: '600' },
});
