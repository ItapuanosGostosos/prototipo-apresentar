import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listPortfolios } from '../../src/services/portfolios';
import { listAnalyses, analysePortfolio } from '../../src/services/analyses';
import type { Analysis, PortfolioListItem, SentimentLabel } from '../../src/types';

const SENTIMENT_CONFIG: Record<
  SentimentLabel,
  { label: string; color: string; bg: string; border: string }
> = {
  positive: { label: 'Positivo', color: '#4ade80', bg: '#052e16', border: '#166534' },
  negative: { label: 'Negativo', color: '#f87171', bg: '#2d0707', border: '#7f1d1d' },
  neutral:  { label: 'Neutro',   color: '#fbbf24', bg: '#1c1407', border: '#713f12' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  completed:  { label: 'Concluído',   color: '#4ade80' },
  pending:    { label: 'Pendente',     color: '#fbbf24' },
  processing: { label: 'Processando', color: '#60a5fa' },
  failed:     { label: 'Falhou',       color: '#f87171' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ImpactBar({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 1);
  const color = pct >= 0.6 ? '#4ade80' : pct >= 0.35 ? '#fbbf24' : '#f87171';
  return (
    <View style={barStyles.wrapper}>
      <View style={[barStyles.fill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrapper: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    overflow: 'hidden',
    flex: 1,
  },
  fill: { height: '100%', borderRadius: 2 },
});

function AnalysisCard({ item }: { item: Analysis }) {
  const sentiment = item.result?.sentiment_label;
  const sentConf = sentiment ? SENTIMENT_CONFIG[sentiment] : null;
  const statusConf = STATUS_CONFIG[item.status] ?? { label: item.status, color: '#94a3b8' };

  function openArticle() {
    if (item.article_url) Linking.openURL(item.article_url);
  }

  return (
    <View style={cardStyles.card}>
      {/* Row: ticker + status + sentiment */}
      <View style={cardStyles.topRow}>
        <View style={cardStyles.tickerBadge}>
          <Text style={cardStyles.tickerText}>{item.ticker}</Text>
        </View>
        <Text style={[cardStyles.statusText, { color: statusConf.color }]}>
          {statusConf.label}
        </Text>
        {sentConf && (
          <View style={[cardStyles.sentimentBadge, { backgroundColor: sentConf.bg, borderColor: sentConf.border }]}>
            <Text style={[cardStyles.sentimentText, { color: sentConf.color }]}>
              {sentConf.label}
            </Text>
          </View>
        )}
      </View>

      {/* Article title */}
      <TouchableOpacity onPress={openArticle} activeOpacity={0.7}>
        <Text style={cardStyles.articleTitle} numberOfLines={2}>
          {item.article_title}
        </Text>
      </TouchableOpacity>

      {/* Impact score */}
      {item.result && (
        <>
          <View style={cardStyles.impactRow}>
            <Text style={cardStyles.impactLabel}>Impacto</Text>
            <ImpactBar score={item.result.impact_score} />
            <Text style={cardStyles.impactValue}>
              {(item.result.impact_score * 100).toFixed(0)}%
            </Text>
          </View>

          {/* Explanation */}
          <Text style={cardStyles.explanation} numberOfLines={3}>
            {item.result.explanation}
          </Text>

          {/* Signals */}
          {(item.result.positive_signals.length > 0 || item.result.negative_signals.length > 0) && (
            <View style={cardStyles.signalsRow}>
              {item.result.positive_signals.map((s) => (
                <View key={s} style={cardStyles.signalPos}>
                  <Text style={cardStyles.signalPosText}>{s.replace('word:', '')}</Text>
                </View>
              ))}
              {item.result.negative_signals.map((s) => (
                <View key={s} style={cardStyles.signalNeg}>
                  <Text style={cardStyles.signalNegText}>{s.replace('word:', '')}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Topics */}
          {item.result.detected_topics.length > 0 && (
            <View style={cardStyles.topicsRow}>
              {item.result.detected_topics.map((t) => (
                <View key={t} style={cardStyles.topicBadge}>
                  <Text style={cardStyles.topicText}>{t}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Footer */}
      <Text style={cardStyles.date}>
        {item.status === 'completed' ? `Concluído em ${formatDate(item.finished_at)}` : formatDate(item.created_at)}
      </Text>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12,
    gap: 8,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tickerBadge: {
    backgroundColor: '#0f172a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#475569',
  },
  tickerText: { color: '#f1f5f9', fontSize: 12, fontWeight: '700' },
  statusText: { fontSize: 11, fontWeight: '600' },
  sentimentBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  sentimentText: { fontSize: 11, fontWeight: '700' },
  articleTitle: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  impactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  impactLabel: { color: '#64748b', fontSize: 11, fontWeight: '500' },
  impactValue: { color: '#94a3b8', fontSize: 11, fontWeight: '600', minWidth: 28 },
  explanation: { color: '#64748b', fontSize: 12, lineHeight: 18 },
  signalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  signalPos: {
    backgroundColor: '#052e16',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#166534',
  },
  signalPosText: { color: '#4ade80', fontSize: 10, fontWeight: '600' },
  signalNeg: {
    backgroundColor: '#2d0707',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#7f1d1d',
  },
  signalNegText: { color: '#f87171', fontSize: 10, fontWeight: '600' },
  topicsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  topicBadge: {
    backgroundColor: '#1e1b4b',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  topicText: { color: '#818cf8', fontSize: 10, fontWeight: '600' },
  date: { color: '#334155', fontSize: 11, marginTop: 2 },
});

export default function AnalysesScreen() {
  const qc = useQueryClient();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);

  const { data: portfolios, isLoading: loadingPortfolios } = useQuery({
    queryKey: ['portfolios'],
    queryFn: listPortfolios,
  });

  const {
    data: analyses,
    isLoading: loadingAnalyses,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['analyses', selectedPortfolioId],
    queryFn: () => listAnalyses(selectedPortfolioId!),
    enabled: selectedPortfolioId !== null,
  });

  const analyseMutation = useMutation({
    mutationFn: () => analysePortfolio(selectedPortfolioId!),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['analyses', selectedPortfolioId] });
      Alert.alert(
        'Análise iniciada',
        `${data.articles_queued} artigos enfileirados. Os resultados aparecerão aqui em instantes.`,
      );
    },
    onError: (err: Error) => Alert.alert('Erro ao analisar', err.message),
  });

  const completed = (analyses ?? []).filter((a) => a.status === 'completed').length;
  const total = (analyses ?? []).length;

  if (loadingPortfolios) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#818cf8" size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Análises de IA</Text>
          {selectedPortfolioId && total > 0 && (
            <Text style={styles.headerSub}>{completed}/{total} concluídas</Text>
          )}
        </View>
        {selectedPortfolioId && (
          <TouchableOpacity
            style={[styles.triggerButton, analyseMutation.isPending && styles.triggerButtonPending]}
            onPress={() => analyseMutation.mutate()}
            disabled={analyseMutation.isPending}
          >
            {analyseMutation.isPending ? (
              <ActivityIndicator size="small" color="#818cf8" />
            ) : (
              <Text style={styles.triggerButtonText}>+ Analisar</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Portfolio selector */}
      {(portfolios ?? []).length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterRow}
        >
          {(portfolios ?? []).map((p: PortfolioListItem) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.chip, selectedPortfolioId === p.id && styles.chipActive]}
              onPress={() => setSelectedPortfolioId(p.id)}
            >
              <Text style={[styles.chipText, selectedPortfolioId === p.id && styles.chipTextActive]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      {!selectedPortfolioId ? (
        <View style={styles.centered}>
          <Text style={styles.placeholderEmoji}>🤖</Text>
          <Text style={styles.placeholderText}>
            Selecione um portfólio para ver as análises de sentimento geradas pela IA.
          </Text>
        </View>
      ) : loadingAnalyses ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#818cf8" size="large" />
          <Text style={styles.loadingText}>Carregando análises...</Text>
        </View>
      ) : (analyses ?? []).length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.placeholderEmoji}>📊</Text>
          <Text style={styles.placeholderText}>
            Nenhuma análise ainda.{'\n'}Toque em "+ Analisar" para iniciar a análise de IA.
          </Text>
        </View>
      ) : (
        <FlatList
          data={analyses}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <AnalysisCard item={item} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#f1f5f9' },
  headerSub: { color: '#475569', fontSize: 12, marginTop: 2 },
  triggerButton: {
    backgroundColor: '#1e1b4b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#4338ca',
    minWidth: 90,
    alignItems: 'center',
  },
  triggerButtonPending: { opacity: 0.6 },
  triggerButtonText: { color: '#818cf8', fontWeight: '600', fontSize: 14 },
  filterScroll: { height: 48, marginBottom: 8 },
  filterRow: {
    paddingHorizontal: 20,
    paddingRight: 20,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: { backgroundColor: '#1e1b4b', borderColor: '#818cf8' },
  chipText: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#818cf8', fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  loadingText: { color: '#475569', fontSize: 14, marginTop: 12 },
  placeholderEmoji: { fontSize: 48, marginBottom: 12 },
  placeholderText: { color: '#475569', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
