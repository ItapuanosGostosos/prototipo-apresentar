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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getGlobalNews, getPortfolioNews } from '../../src/services/news';
import { listPortfolios } from '../../src/services/portfolios';
import { analysePortfolio } from '../../src/services/analyses';
import { NewsCard } from '../../src/components/news/NewsCard';
import type { NewsArticle, PortfolioListItem } from '../../src/types';

type FilterMode = 'all' | 'portfolio' | 'ticker';

export default function NewsScreen() {
  const qc = useQueryClient();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [tickerSearch, setTickerSearch] = useState('');

  const { data: portfolios } = useQuery({
    queryKey: ['portfolios'],
    queryFn: listPortfolios,
  });

  const {
    data: globalNews,
    isLoading: loadingGlobal,
    refetch: refetchGlobal,
    isRefetching: refetchingGlobal,
  } = useQuery({
    queryKey: ['news', 'global'],
    queryFn: getGlobalNews,
    enabled: filterMode !== 'portfolio',
  });

  const {
    data: portfolioNews,
    isLoading: loadingPortfolio,
    refetch: refetchPortfolio,
    isRefetching: refetchingPortfolio,
  } = useQuery({
    queryKey: ['news', 'portfolio', selectedPortfolioId],
    queryFn: () => getPortfolioNews(selectedPortfolioId!),
    enabled: filterMode === 'portfolio' && selectedPortfolioId !== null,
  });

  const analyseMutation = useMutation({
    mutationFn: (portfolioId: number) => analysePortfolio(portfolioId),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['analyses'] });
      Alert.alert(
        'Análise iniciada',
        `${data.articles_queued} artigos enfileirados para análise de IA.\nVeja os resultados na aba Análises.`,
      );
    },
    onError: (err: Error) =>
      Alert.alert('Erro ao analisar', err.message),
  });

  function handleAnalyse() {
    const list = portfolios ?? [];
    if (list.length === 0) {
      Alert.alert('Sem portfólios', 'Crie um portfólio com ativos primeiro.');
      return;
    }
    if (filterMode === 'portfolio' && selectedPortfolioId) {
      analyseMutation.mutate(selectedPortfolioId);
      return;
    }
    if (list.length === 1) {
      analyseMutation.mutate(list[0].id);
      return;
    }
    Alert.alert(
      'Analisar portfólio',
      'Escolha o portfólio para análise de IA:',
      [
        ...list.map((p) => ({
          text: p.name,
          onPress: () => analyseMutation.mutate(p.id),
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  }

  const rawArticles: NewsArticle[] =
    filterMode === 'portfolio' ? (portfolioNews ?? []) : (globalNews ?? []);

  const articles = useMemo(() => {
    if (filterMode !== 'ticker' || !tickerSearch.trim()) return rawArticles;
    const term = tickerSearch.trim().toUpperCase();
    return rawArticles.filter((a) =>
      a.tickers.some((t) => t.includes(term)),
    );
  }, [rawArticles, filterMode, tickerSearch]);

  const isLoading = filterMode === 'portfolio' ? loadingPortfolio : loadingGlobal;
  const isRefreshing = filterMode === 'portfolio' ? refetchingPortfolio : refetchingGlobal;

  function handleRefresh() {
    if (filterMode === 'portfolio') refetchPortfolio();
    else refetchGlobal();
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notícias</Text>
        <View style={styles.headerRight}>
          {articles.length > 0 && (
            <Text style={styles.headerCount}>{articles.length} artigos</Text>
          )}
          <TouchableOpacity
            style={[styles.analyseHeaderButton, analyseMutation.isPending && styles.analyseHeaderButtonPending]}
            onPress={handleAnalyse}
            disabled={analyseMutation.isPending}
          >
            {analyseMutation.isPending ? (
              <ActivityIndicator size="small" color="#818cf8" />
            ) : (
              <Text style={styles.analyseHeaderButtonText}>Analisar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros de modo */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'all' && styles.filterChipActive]}
          onPress={() => setFilterMode('all')}
        >
          <Text style={[styles.filterChipText, filterMode === 'all' && styles.filterChipTextActive]}>
            Todos os ativos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterMode === 'ticker' && styles.filterChipActive]}
          onPress={() => setFilterMode('ticker')}
        >
          <Text style={[styles.filterChipText, filterMode === 'ticker' && styles.filterChipTextActive]}>
            Por ticker
          </Text>
        </TouchableOpacity>

        {(portfolios ?? []).map((p: PortfolioListItem) => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.filterChip,
              filterMode === 'portfolio' && selectedPortfolioId === p.id && styles.filterChipActive,
            ]}
            onPress={() => {
              setFilterMode('portfolio');
              setSelectedPortfolioId(p.id);
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                filterMode === 'portfolio' && selectedPortfolioId === p.id && styles.filterChipTextActive,
              ]}
            >
              {p.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Busca por ticker */}
      {filterMode === 'ticker' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por ticker (ex: PETR4)"
            placeholderTextColor="#475569"
            value={tickerSearch}
            onChangeText={setTickerSearch}
            autoCapitalize="characters"
          />
        </View>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#818cf8" size="large" />
          <Text style={styles.loadingText}>Buscando notícias...</Text>
        </View>
      ) : filterMode === 'portfolio' && !selectedPortfolioId ? (
        <View style={styles.centered}>
          <Text style={styles.placeholderEmoji}>💼</Text>
          <Text style={styles.placeholderText}>
            Selecione um portfólio acima para ver as notícias.
          </Text>
        </View>
      ) : articles.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.placeholderEmoji}>📭</Text>
          <Text style={styles.placeholderText}>
            {filterMode === 'ticker' && tickerSearch
              ? `Nenhuma notícia para "${tickerSearch}".`
              : 'Nenhuma notícia encontrada.\nVolte mais tarde.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={articles}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <NewsCard
              article={item}
              onAnalyse={handleAnalyse}
              analysisPending={analyseMutation.isPending}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#818cf8"
              colors={['#818cf8']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#f1f5f9' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerCount: { color: '#475569', fontSize: 13 },
  analyseHeaderButton: {
    backgroundColor: '#1e1b4b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#4338ca',
    minWidth: 80,
    alignItems: 'center',
  },
  analyseHeaderButtonPending: { opacity: 0.6 },
  analyseHeaderButtonText: { color: '#818cf8', fontSize: 13, fontWeight: '600' },
  filterScroll: { height: 48, marginBottom: 8 },
  filterRow: {
    paddingHorizontal: 20,
    paddingRight: 20,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterChipActive: { backgroundColor: '#1e1b4b', borderColor: '#818cf8' },
  filterChipText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  filterChipTextActive: { color: '#818cf8', fontWeight: '600' },
  searchContainer: { paddingHorizontal: 20, marginBottom: 8 },
  searchInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    padding: 12,
    color: '#f1f5f9',
    fontSize: 14,
  },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: { color: '#475569', fontSize: 14, marginTop: 12 },
  placeholderEmoji: { fontSize: 48, marginBottom: 12 },
  placeholderText: { color: '#475569', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
