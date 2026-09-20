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
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { C, R, TAB_BAR_SPACE, CONTENT_MAX_WIDTH, shadow } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
import { Chip, EmptyState, GhostButton, GlassCard, Input, ScreenHeader } from '../../src/components/ui/primitives';
import { getGlobalNews, getPortfolioNews } from '../../src/services/news';
import { listPortfolios } from '../../src/services/portfolios';
import { analysePortfolio } from '../../src/services/analyses';
import { UserAvatar } from '../../src/components/ui/UserAvatar';
import type { NewsArticle, PortfolioListItem } from '../../src/types';
import { notify } from '../../src/utils/feedback';

type FilterMode = 'all' | 'portfolio' | 'ticker';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function TickerPills({ tickers, max = 3 }: { tickers: string[]; max?: number }) {
  if (tickers.length === 0) return null;
  const shown = tickers.slice(0, max);
  const rest = tickers.length - shown.length;
  return (
    <View style={s.tickerRow}>
      {shown.map((t) => (
        <View key={t} style={s.tickerBadge}><Text style={s.tickerText}>{t}</Text></View>
      ))}
      {rest > 0 ? <View style={s.tickerBadge}><Text style={s.tickerText}>+{rest}</Text></View> : null}
    </View>
  );
}

/** Destaque (Figma "News Screen"): imagem grande com gradiente e botão "Analise com IA". */
function FeaturedCard({ article, onAnalyse, pending }: { article: NewsArticle; onAnalyse: () => void; pending: boolean }) {
  return (
    <TouchableOpacity style={s.featured} onPress={() => Linking.openURL(article.url)} activeOpacity={0.85} accessibilityRole="link">
      {article.thumbnail_url ? (
        <Image source={{ uri: article.thumbnail_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[C.accentDk, C.bgMid]} style={StyleSheet.absoluteFill} />
      )}
      <LinearGradient
        colors={['rgba(10,7,20,0)', 'rgba(10,7,20,0.55)', 'rgba(10,7,20,0.96)']}
        locations={[0.15, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.featuredBody}>
        <View style={s.meta}>
          {article.source && <Text style={s.metaSource}>{article.source.name}</Text>}
          <Text style={s.metaDate}>{formatDate(article.published_at)}</Text>
        </View>
        <Text style={s.featuredTitle} numberOfLines={3}>{article.title}</Text>
        <View style={s.featuredFooter}>
          <TickerPills tickers={article.tickers} />
          <TouchableOpacity
            style={[s.analyseBtn, pending && { opacity: 0.5 }]}
            onPress={(e) => { e.stopPropagation?.(); onAnalyse(); }}
            disabled={pending}
            accessibilityRole="button"
          >
            {pending
              ? <ActivityIndicator size="small" color={C.textOnLight} />
              : <>
                  <Ionicons name="sparkles" size={14} color={C.textOnLight} />
                  <Text style={s.analyseBtnText}>Analise com IA</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ArticleCard({ article, onAnalyse, pending }: { article: NewsArticle; onAnalyse: () => void; pending: boolean }) {
  return (
    <TouchableOpacity onPress={() => Linking.openURL(article.url)} activeOpacity={0.8} accessibilityRole="link">
      <GlassCard style={s.card}>
        <View style={s.cardBody}>
          <View style={s.meta}>
            {article.source && <Text style={s.metaSource}>{article.source.name}</Text>}
            <Text style={s.metaDate}>{formatDate(article.published_at)}</Text>
          </View>
          <Text style={s.cardTitle} numberOfLines={3}>{article.title}</Text>
          <View style={s.cardFooter}>
            <TickerPills tickers={article.tickers} max={2} />
            <TouchableOpacity
              style={[s.cardAnalyseBtn, pending && { opacity: 0.5 }]}
              onPress={(e) => { e.stopPropagation?.(); onAnalyse(); }}
              disabled={pending}
              accessibilityLabel="Analisar com IA"
            >
              <Ionicons name="sparkles" size={12} color={C.accentLt} />
              <Text style={s.cardAnalyseBtnText}>IA</Text>
            </TouchableOpacity>
          </View>
        </View>
        {article.thumbnail_url ? (
          <Image source={{ uri: article.thumbnail_url }} style={s.cardThumb} resizeMode="cover" />
        ) : (
          <View style={[s.cardThumb, s.cardThumbPlaceholder]}>
            <Ionicons name="newspaper-outline" size={24} color={C.textMuted} />
          </View>
        )}
      </GlassCard>
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
    mutationFn: async (ids: number[]) => {
      const tasks: string[] = [];
      for (const id of ids) {
        const res = await analysePortfolio(id);
        tasks.push(res.task_id);
      }
      return tasks;
    },
    onSuccess: (tasks) => {
      qc.invalidateQueries({ queryKey: ['analyses'] });
      notify(
        'Análise iniciada',
        tasks.length === 1
          ? `Tarefa ${tasks[0]} enfileirada. Veja os resultados em Analytics.`
          : `${tasks.length} carteiras enfileiradas. Veja os resultados em Analytics.`,
      );
    },
    onError: (err: Error) => notify('Erro', err.message),
  });

  /** Sem carteira escolhida no filtro, analisa todas as carteiras do usuário. */
  function handleAnalyse() {
    const list = portfolios ?? [];
    if (!list.length) { notify('Sem carteiras', 'Crie uma carteira primeiro na aba Carteira.'); return; }
    if (filterMode === 'portfolio' && selectedPortfolioId) { analyseMutation.mutate([selectedPortfolioId]); return; }
    analyseMutation.mutate(list.map((p) => p.id));
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
      <SafeAreaView style={s.page} edges={['top', 'left', 'right']}>
        <ScreenHeader
          title="Notícias"
          subtitle={articles.length > 0 ? `${articles.length} artigos` : undefined}
          right={
            <View style={s.headerActions}>
              <GhostButton
                label="Analisar"
                icon="sparkles-outline"
                onPress={handleAnalyse}
                loading={analyseMutation.isPending}
              />
              <UserAvatar size={40} />
            </View>
          }
        />

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterRow}>
          <Chip label="Todos" active={filterMode === 'all'} onPress={() => setFilterMode('all')} />
          <Chip label="Por ticker" icon="search-outline" active={filterMode === 'ticker'} onPress={() => setFilterMode('ticker')} />
          {(portfolios ?? []).map((p: PortfolioListItem) => (
            <Chip
              key={p.id}
              label={p.name}
              icon="wallet-outline"
              active={filterMode === 'portfolio' && selectedPortfolioId === p.id}
              onPress={() => { setFilterMode('portfolio'); setSelectedPortfolioId(p.id); }}
            />
          ))}
        </ScrollView>

        {filterMode === 'ticker' && (
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={18} color={C.textMuted} style={s.searchIcon} />
            <Input
              style={s.searchInput}
              placeholder="Buscar por ticker (ex: PETR4, BTC)"
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
        ) : filterMode === 'portfolio' && !selectedPortfolioId ? (
          <View style={s.centered}>
            <EmptyState icon="wallet-outline" title="Escolha um portfólio" description="Selecione um portfólio acima para ver as notícias." />
          </View>
        ) : articles.length === 0 ? (
          <View style={s.centered}>
            <EmptyState
              icon="newspaper-outline"
              title="Nenhuma notícia encontrada"
              description={filterMode === 'ticker' && tickerSearch ? `Nada para "${tickerSearch}".` : 'Volte mais tarde para ver atualizações.'}
            />
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
  // Largura máxima do conteúdo em telas largas (web/tablet)
  page: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  filterScroll: { flexGrow: 0, marginBottom: 8 },
  filterRow: { paddingHorizontal: 20, gap: 8, alignItems: 'center', paddingVertical: 4 },
  searchWrap: { paddingHorizontal: 20, marginBottom: 8, position: 'relative' },
  searchIcon: { position: 'absolute', left: 34, top: 15, zIndex: 1 },
  searchInput: { paddingLeft: 42, height: 48 },
  list: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: TAB_BAR_SPACE },

  meta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaSource: { color: C.accentLt, fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  metaDate: { color: C.textMuted, fontSize: 11 },
  tickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flexShrink: 1 },
  tickerBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: C.border,
  },
  tickerText: { color: C.text, fontSize: 11, fontWeight: '600' },

  // Destaque
  featured: {
    height: 300, borderRadius: R.xl, overflow: 'hidden', marginBottom: 16, backgroundColor: C.bgMid, ...shadow.soft,
  },
  featuredBody: { flex: 1, justifyContent: 'flex-end', padding: 20, gap: 8 },
  featuredTitle: { color: C.text, fontSize: 21, fontWeight: '700', lineHeight: 28, letterSpacing: -0.3 },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 },
  analyseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF',
    borderRadius: R.pill, paddingHorizontal: 14, height: 34,
  },
  analyseBtnText: { color: C.textOnLight, fontSize: 12, fontWeight: '700' },

  // Linha de notícia
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 10 },
  cardBody: { flex: 1, gap: 6 },
  cardTitle: { color: C.text, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardAnalyseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accentSoft, borderRadius: R.pill,
    paddingHorizontal: 10, height: 26, borderWidth: 1, borderColor: 'rgba(139,124,255,0.5)',
  },
  cardAnalyseBtnText: { color: C.accentLt, fontSize: 10, fontWeight: '800' },
  cardThumb: { width: 88, height: 88, borderRadius: R.md, backgroundColor: C.bgCardLt },
  cardThumbPlaceholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: TAB_BAR_SPACE / 2 },
  loadingText: { color: C.textMuted, fontSize: 14, marginTop: 12 },
});
