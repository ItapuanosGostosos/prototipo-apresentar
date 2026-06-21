import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { C } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
import { useAuthStore } from '../../src/store/authStore';
import { listPortfolios } from '../../src/services/portfolios';
import { getGlobalNews } from '../../src/services/news';
import type { NewsArticle, PortfolioListItem } from '../../src/types';

function Avatar({ name }: { name: string }) {
  return (
    <View style={s.avatar}>
      <Text style={s.avatarText}>{name[0]?.toUpperCase() ?? 'U'}</Text>
    </View>
  );
}

function WalletCard({ portfolios }: { portfolios: PortfolioListItem[] }) {
  const router = useRouter();
  if (portfolios.length === 0) {
    return (
      <TouchableOpacity style={s.walletCard} onPress={() => router.push('/(tabs)/portfolios')}>
        <Text style={s.walletLabel}>Minha Carteira</Text>
        <Text style={s.walletEmpty}>Crie seu primeiro portfólio</Text>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity style={s.walletCard} onPress={() => router.push('/(tabs)/portfolios')}>
      <Text style={s.walletLabel}>Minha Carteira</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
        {portfolios.map((p) => (
          <View key={p.id} style={s.walletChip}>
            <Text style={s.walletChipName}>{p.name}</Text>
            <Text style={s.walletChipCount}>{p.asset_count} ativos</Text>
          </View>
        ))}
      </ScrollView>
    </TouchableOpacity>
  );
}

function NewsRow({ article }: { article: NewsArticle }) {
  return (
    <TouchableOpacity style={s.newsRow} onPress={() => Linking.openURL(article.url)}>
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
    <TouchableOpacity style={s.suggCard} onPress={() => Linking.openURL(article.url)}>
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
      {article.source && (
        <Text style={s.suggSource}>{article.source.name}</Text>
      )}
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
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.greeting}>Olá,</Text>
              <Text style={s.username}>{username}</Text>
            </View>
            <Avatar name={username} />
          </View>

          {/* Wallet card */}
          {loadingPortfolios ? (
            <View style={[s.walletCard, { justifyContent: 'center', alignItems: 'center', height: 100 }]}>
              <ActivityIndicator color={C.accentLt} />
            </View>
          ) : (
            <WalletCard portfolios={portfolios ?? []} />
          )}

          {/* Suggestions */}
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Sugestões Portfolio Tracker</Text>
            <View style={s.sectionBadge}>
              <Text style={s.sectionBadgeText}>IA</Text>
            </View>
          </View>

          {loadingNews ? (
            <ActivityIndicator color={C.accentLt} style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.suggScroll}>
              {suggestions.map((a) => (
                <SuggestionCard key={a.id} article={a} />
              ))}
            </ScrollView>
          )}

          {/* Trending */}
          <Text style={[s.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Em Alta</Text>

          {loadingNews ? (
            <ActivityIndicator color={C.accentLt} />
          ) : (
            trending.map((a) => <NewsRow key={a.id} article={a} />)
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 24,
  },
  greeting: { color: C.textMuted, fontSize: 13 },
  username: { color: C.text, fontSize: 22, fontWeight: '700' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accentDk,
    borderWidth: 2,
    borderColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: C.accentLt, fontSize: 18, fontWeight: '700' },

  walletCard: {
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 28,
  },
  walletLabel: { color: C.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  walletEmpty: { color: C.textSec, fontSize: 15, marginTop: 10 },
  walletChip: {
    backgroundColor: C.bgCardLt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  walletChipName: { color: C.text, fontWeight: '700', fontSize: 14 },
  walletChipCount: { color: C.textMuted, fontSize: 11, marginTop: 2 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  sectionBadge: {
    backgroundColor: C.accent,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sectionBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  suggScroll: { marginHorizontal: -20, paddingLeft: 20 },
  suggCard: {
    backgroundColor: C.bgCard,
    borderRadius: 16,
    padding: 14,
    width: 200,
    marginRight: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  suggTickers: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  suggTicker: {
    backgroundColor: C.accentDk,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  suggTickerText: { color: C.accentLt, fontSize: 11, fontWeight: '700' },
  suggTitle: { color: C.text, fontSize: 13, fontWeight: '600', lineHeight: 19, flex: 1 },
  suggSource: { color: C.textMuted, fontSize: 10, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.4 },

  newsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  newsRowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
    marginTop: 6,
    flexShrink: 0,
  },
  newsRowTitle: { color: C.textSec, fontSize: 13, lineHeight: 19, flex: 1 },
  tickerRow: { flexDirection: 'row', gap: 5, marginTop: 6 },
  tickerBadge: {
    backgroundColor: C.bgCardLt,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: C.border,
  },
  tickerText: { color: C.textMuted, fontSize: 10, fontWeight: '600' },
});
