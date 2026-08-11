import { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { C } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
import { getGlobalNews, getPortfolioNews } from '../../src/services/news';
import { listPortfolios } from '../../src/services/portfolios';
import { analysePortfolio } from '../../src/services/analyses';
import type { NewsArticle, PortfolioListItem } from '../../src/types';

type FilterMode = 'all' | 'portfolio' | 'ticker';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function FeaturedCard({ article, onAnalyse, pending }: { article: NewsArticle; onAnalyse: () => void; pending: boolean }) {
  return (
    <TouchableOpacity style={s.featured} onPress={() => Linking.openURL(article.url)} activeOpacity={0.85}>
      {article.thumbnail_url ? (
        <Image source={{ uri: article.thumbnail_url }} style={s.featuredImg} resizeMode="cover" />
      ) : (
        <View style={[s.featuredImg, { backgroundColor: C.bgCardLt }]} />
      )}
      <View style={s.featuredOverlay}>
        {article.tickers.length > 0 && (
          <View style={s.tickerRow}>
            {article.tickers.slice(0, 3).map((t) => (
              <View key={t} style={s.tickerBadge}>
                <Text style={s.tickerText}>{t}</Text>
              </View>
            ))}
          </View>
        )}
        <Text style={s.featuredTitle} numberOfLines={3}>{article.title}</Text>
        <View style={s.featuredFooter}>
          {article.source && <Text style={s.featuredSource}>{article.source.name}</Text>}
          <TouchableOpacity
            style={[s.analyseBtn, pending && { opacity: 0.5 }]}
            onPress={(e) => { e.stopPropagation?.(); onAnalyse(); }}
            disabled={pending}
          >
            {pending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.analyseBtnText}>Analisar com IA</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ArticleCard({ article, onAnalyse, pending }: { article: NewsArticle; onAnalyse: () => void; pending: boolean }) {
  return (
    <TouchableOpacity style={s.card} onPress={() => Linking.openURL(article.url)} activeOpacity={0.8}>
      {article.thumbnail_url ? (
        <Image source={{ uri: article.thumbnail_url }} style={s.cardThumb} resizeMode="cover" />
      ) : (
        <View style={[s.cardThumb, { backgroundColor: C.bgCardLt }]} />
      )}
      <View style={s.cardBody}>
        {article.source && <Text style={s.cardSource}>{article.source.name}</Text>}
        <Text style={s.cardTitle} numberOfLines={3}>{article.title}</Text>
        <View style={s.cardFooter}>
          <Text style={s.cardDate}>{formatDate(article.published_at)}</Text>
          <TouchableOpacity
            style={[s.cardAnalyseBtn, pending && { opacity: 0.5 }]}
            onPress={(e) => { e.stopPropagation?.(); onAnalyse(); }}
            disabled={pending}
          >
            <Text style={s.cardAnalyseBtnText}>IA</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NewsScreen() {
  const qc = useQueryClient();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [tickerSearch, setTickerSearch] = useState('');

  const { data: portfolios } = useQuery({ queryKey: ['portfolios'], queryFn: listPortfolios });

  const { data: globalNews, isLoading: loadingGlobal, refetch: refetchGlobal, isRefetching: rg } = useQuery({
    queryKey: ['news', 'global'],
    queryFn: getGlobalNews,
    enabled: filterMode !== 'portfolio',
  });

  const { data: portfolioNews, isLoading: loadingPortfolio, refetch: refetchPortfolio, isRefetching: rp } = useQuery({
    queryKey: ['news', 'portfolio', selectedPortfolioId],
    queryFn: () => getPortfolioNews(selectedPortfolioId!),
    enabled: filterMode === 'portfolio' && selectedPortfolioId !== null,
  });

  const analyseMutation = useMutation({
    mutationFn: (id: number) => analysePortfolio(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['analyses'] });
      Alert.alert('Análise iniciada', `${data.articles_queued} artigos enfileirados.\nVeja os resultados em Análises.`);
    },
    onError: (err: Error) => Alert.alert('Erro', err.message),
  });

  function handleAnalyse() {
    const list = portfolios ?? [];
    if (!list.length) { Alert.alert('Sem portfólios', 'Crie um portfólio primeiro.'); return; }
    if (filterMode === 'portfolio' && selectedPortfolioId) { analyseMutation.mutate(selectedPortfolioId); return; }
    if (list.length === 1) { analyseMutation.mutate(list[0].id); return; }
    Alert.alert('Analisar', 'Escolha o portfólio:', [
      ...list.map((p) => ({ text: p.name, onPress: () => analyseMutation.mutate(p.id) })),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  }

  const rawArticles: NewsArticle[] = filterMode === 'portfolio' ? (portfolioNews ?? []) : (globalNews ?? []);
  const articles = useMemo(() => {
    if (filterMode !== 'ticker' || !tickerSearch.trim()) return rawArticles;
    const t = tickerSearch.trim().toUpperCase();
    return rawArticles.filter((a) => a.tickers.some((tk) => tk.includes(t)));
  }, [rawArticles, filterMode, tickerSearch]);

  const isLoading  = filterMode === 'portfolio' ? loadingPortfolio : loadingGlobal;
  const isRefreshing = filterMode === 'portfolio' ? rp : rg;
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>Notícias</Text>
          <TouchableOpacity
            style={[s.analyseHeaderBtn, analyseMutation.isPending && { opacity: 0.5 }]}
            onPress={handleAnalyse}
            disabled={analyseMutation.isPending}
          >
            {analyseMutation.isPending
              ? <ActivityIndicator size="small" color={C.accentLt} />
              : <Text style={s.analyseHeaderBtnText}>Analisar</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
          {(['all', 'ticker'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[s.chip, filterMode === mode && s.chipActive]}
              onPress={() => setFilterMode(mode)}
            >
              <Text style={[s.chipText, filterMode === mode && s.chipTextActive]}>
                {mode === 'all' ? 'Todos' : 'Por ticker'}
              </Text>
            </TouchableOpacity>
          ))}
          {(portfolios ?? []).map((p: PortfolioListItem) => (
            <TouchableOpacity
              key={p.id}
              style={[s.chip, filterMode === 'portfolio' && selectedPortfolioId === p.id && s.chipActive]}
              onPress={() => { setFilterMode('portfolio'); setSelectedPortfolioId(p.id); }}
            >
              <Text style={[s.chipText, filterMode === 'portfolio' && selectedPortfolioId === p.id && s.chipTextActive]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filterMode === 'ticker' && (
          <View style={s.searchWrap}>
            <TextInput
              style={s.searchInput}
              placeholder="Ex: PETR4, BTC..."
              placeholderTextColor={C.textMuted}
              value={tickerSearch}
              onChangeText={setTickerSearch}
              autoCapitalize="characters"
            />
          </View>
        )}

        {isLoading ? (
          <View style={s.centered}>
            <ActivityIndicator color={C.accentLt} size="large" />
            <Text style={s.loadingText}>Buscando notícias...</Text>
          </View>
        ) : articles.length === 0 ? (
          <View style={s.centered}>
            <Text style={s.emptyEmoji}>📭</Text>
            <Text style={s.emptyText}>Nenhuma notícia encontrada.</Text>
          </View>
        ) : (
          <FlatList
            data={rest}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              featured ? (
                <FeaturedCard article={featured} onAnalyse={handleAnalyse} pending={analyseMutation.isPending} />
              ) : null
            }
            renderItem={({ item }) => (
              <ArticleCard article={item} onAnalyse={handleAnalyse} pending={analyseMutation.isPending} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => filterMode === 'portfolio' ? refetchPortfolio() : refetchGlobal()}
                tintColor={C.accentLt}
                colors={[C.accentLt]}
              />
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: { color: C.text, fontSize: 24, fontWeight: '700' },
  analyseHeaderBtn: {
    backgroundColor: C.bgCard, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1, borderColor: C.border, minWidth: 80, alignItems: 'center',
  },
  analyseHeaderBtnText: { color: C.accentLt, fontSize: 13, fontWeight: '600' },
  filterScroll: { height: 44, marginBottom: 6 },
  filterRow: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  chip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border,
  },
  chipActive: { backgroundColor: '#2e1065', borderColor: C.accent },
  chipText: { color: C.textMuted, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: C.accentLt, fontWeight: '600' },
  searchWrap: { paddingHorizontal: 20, marginBottom: 8 },
  searchInput: {
    backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border,
    borderRadius: 10, padding: 12, color: C.text, fontSize: 14,
  },
  list: { paddingHorizontal: 20, paddingBottom: 24 },

  // Featured
  featured: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
  },
  featuredImg: { width: '100%', height: 220, backgroundColor: C.bgCard },
  featuredOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(12,9,33,0.82)', padding: 14,
  },
  tickerRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tickerBadge: {
    backgroundColor: 'rgba(124,58,237,0.45)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: C.accent,
  },
  tickerText: { color: C.accentLt, fontSize: 11, fontWeight: '700' },
  featuredTitle: { color: C.text, fontSize: 15, fontWeight: '700', lineHeight: 22, marginBottom: 10 },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredSource: { color: C.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  analyseBtn: {
    backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5,
  },
  analyseBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Article card
  card: {
    flexDirection: 'row', backgroundColor: C.bgCard, borderRadius: 14,
    overflow: 'hidden', borderWidth: 1, borderColor: C.border, marginBottom: 10,
  },
  cardThumb: { width: 90, height: 90 },
  cardBody: { flex: 1, padding: 10, justifyContent: 'space-between' },
  cardSource: { color: C.accent, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  cardTitle: { color: C.text, fontSize: 13, fontWeight: '600', lineHeight: 18, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardDate: { color: C.textMuted, fontSize: 11 },
  cardAnalyseBtn: {
    backgroundColor: C.accentDk, borderRadius: 6, paddingHorizontal: 8,
    paddingVertical: 3, borderWidth: 1, borderColor: C.accent,
  },
  cardAnalyseBtnText: { color: C.accentLt, fontSize: 10, fontWeight: '800' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  loadingText: { color: C.textMuted, fontSize: 14, marginTop: 12 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: C.textMuted, fontSize: 14, textAlign: 'center' },
});
