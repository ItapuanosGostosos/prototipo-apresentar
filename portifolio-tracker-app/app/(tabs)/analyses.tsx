import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { C } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
import { listPortfolios } from '../../src/services/portfolios';
import { listAnalyses, analysePortfolio } from '../../src/services/analyses';
import type { Analysis, PortfolioListItem, SentimentLabel } from '../../src/types';

const SENT: Record<SentimentLabel, { label: string; color: string; bg: string }> = {
  positive: { label: 'Positivo', color: '#4ade80', bg: '#052e16' },
  negative: { label: 'Negativo', color: '#f87171', bg: '#2d0707' },
  neutral:  { label: 'Neutro',   color: '#fbbf24', bg: '#1c1407' },
};

const STATUS: Record<string, { label: string; color: string }> = {
  completed:  { label: 'Concluído',   color: '#4ade80' },
  pending:    { label: 'Pendente',     color: '#fbbf24' },
  processing: { label: 'Processando', color: '#60a5fa' },
  failed:     { label: 'Falhou',      color: '#f87171' },
};

const TIME_FILTERS = ['1S', '1M', '3M', '6M', '1A'];

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 1);
  const color = pct >= 0.6 ? '#4ade80' : pct >= 0.35 ? '#fbbf24' : '#f87171';
  return (
    <View style={b.wrap}>
      <View style={[b.fill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}
const b = StyleSheet.create({
  wrap: { flex: 1, height: 4, backgroundColor: C.border, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
});

function AnalysisCard({ item }: { item: Analysis }) {
  const sent = item.result?.sentiment_label;
  const sc   = sent ? SENT[sent] : null;
  const st   = STATUS[item.status] ?? { label: item.status, color: C.textMuted };

  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.tickerBadge}><Text style={s.tickerText}>{item.ticker}</Text></View>
        <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
        {sc && (
          <View style={[s.sentBadge, { backgroundColor: sc.bg }]}>
            <Text style={[s.sentText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={() => item.article_url && Linking.openURL(item.article_url)}>
        <Text style={s.articleTitle} numberOfLines={2}>{item.article_title}</Text>
      </TouchableOpacity>

      {item.result && (
        <>
          <View style={s.impactRow}>
            <Text style={s.impactLabel}>Impacto</Text>
            <ScoreBar score={item.result.impact_score} />
            <Text style={s.impactValue}>{(item.result.impact_score * 100).toFixed(0)}%</Text>
          </View>
          <Text style={s.explanation} numberOfLines={3}>{item.result.explanation}</Text>
          {(item.result.positive_signals.length > 0 || item.result.negative_signals.length > 0) && (
            <View style={s.signals}>
              {item.result.positive_signals.map((sg) => (
                <View key={sg} style={s.sigPos}><Text style={s.sigPosText}>{sg.replace('word:', '')}</Text></View>
              ))}
              {item.result.negative_signals.map((sg) => (
                <View key={sg} style={s.sigNeg}><Text style={s.sigNegText}>{sg.replace('word:', '')}</Text></View>
              ))}
            </View>
          )}
          {item.result.detected_topics.length > 0 && (
            <View style={s.topics}>
              {item.result.detected_topics.map((t) => (
                <View key={t} style={s.topic}><Text style={s.topicText}>{t}</Text></View>
              ))}
            </View>
          )}
        </>
      )}

      <Text style={s.dateText}>
        {item.status === 'completed' && item.finished_at
          ? new Date(item.finished_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
          : new Date(item.created_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' })}
      </Text>
    </View>
  );
}

export default function AnalysesScreen() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState('1M');

  const { data: portfolios, isLoading: loadingP } = useQuery({ queryKey: ['portfolios'], queryFn: listPortfolios });

  const { data: analyses, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['analyses', selectedId],
    queryFn: () => listAnalyses(selectedId!),
    enabled: selectedId !== null,
  });

  const analyseMutation = useMutation({
    mutationFn: () => analysePortfolio(selectedId!),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['analyses', selectedId] });
      Alert.alert('Análise iniciada', `${data.articles_queued} artigos enfileirados.\nAtualize em instantes.`);
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  });

  const completed = (analyses ?? []).filter((a) => a.status === 'completed').length;
  const total = (analyses ?? []).length;

  if (loadingP) return <View style={[s.root, s.centered]}><ActivityIndicator color={C.accentLt} size="large" /></View>;

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Analytics</Text>
            {selectedId && total > 0 && (
              <Text style={s.headerSub}>{completed} de {total} concluídas</Text>
            )}
          </View>
          {selectedId && (
            <TouchableOpacity
              style={[s.triggerBtn, analyseMutation.isPending && { opacity: 0.5 }]}
              onPress={() => analyseMutation.mutate()}
              disabled={analyseMutation.isPending}
            >
              {analyseMutation.isPending
                ? <ActivityIndicator size="small" color={C.accentLt} />
                : <>
                    <Ionicons name="pulse" color={C.accentLt} size={14} />
                    <Text style={s.triggerBtnText}>Analisar</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </View>

        {/* Time filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.timeScroll} contentContainerStyle={s.timeRow}>
          {TIME_FILTERS.map((f) => (
            <TouchableOpacity key={f} style={[s.timeChip, timeFilter === f && s.timeChipActive]} onPress={() => setTimeFilter(f)}>
              <Text style={[s.timeChipText, timeFilter === f && s.timeChipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Portfolio selector */}
        {(portfolios ?? []).length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipRow}>
            {(portfolios ?? []).map((p: PortfolioListItem) => (
              <TouchableOpacity
                key={p.id}
                style={[s.chip, selectedId === p.id && s.chipActive]}
                onPress={() => setSelectedId(p.id)}
              >
                <Text style={[s.chipText, selectedId === p.id && s.chipTextActive]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {!selectedId ? (
          <View style={s.centered}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🤖</Text>
            <Text style={s.emptyText}>Selecione um portfólio para ver as análises de sentimento.</Text>
          </View>
        ) : isLoading ? (
          <View style={s.centered}><ActivityIndicator color={C.accentLt} size="large" /></View>
        ) : !analyses?.length ? (
          <View style={s.centered}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
            <Text style={s.emptyText}>Nenhuma análise ainda.{'\n'}Toque em "Analisar" para iniciar.</Text>
          </View>
        ) : (
          <FlatList
            data={analyses}
            keyExtractor={(i) => String(i.id)}
            contentContainerStyle={s.list}
            renderItem={({ item }) => <AnalysisCard item={item} />}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={C.accentLt} colors={[C.accentLt]} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { color: C.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  headerTitle: { color: C.text, fontSize: 24, fontWeight: '700' },
  headerSub: { color: C.textMuted, fontSize: 12, marginTop: 2 },
  triggerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.bgCard, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: C.border,
  },
  triggerBtnText: { color: C.accentLt, fontWeight: '600', fontSize: 14 },

  timeScroll: { height: 40, marginBottom: 4 },
  timeRow: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  timeChip: {
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border,
  },
  timeChipActive: { backgroundColor: '#1e0d4e', borderColor: C.accent },
  timeChipText: { color: C.textMuted, fontSize: 13, fontWeight: '600' },
  timeChipTextActive: { color: C.accentLt },

  chipScroll: { height: 44, marginBottom: 8 },
  chipRow: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  chip: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.border,
  },
  chipActive: { backgroundColor: '#1e0d4e', borderColor: C.accent },
  chipText: { color: C.textMuted, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: C.accentLt, fontWeight: '600' },

  list: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    backgroundColor: C.bgCard, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: C.border, marginBottom: 12, gap: 8,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tickerBadge: {
    backgroundColor: C.bgCardLt, borderRadius: 6, paddingHorizontal: 8,
    paddingVertical: 3, borderWidth: 1, borderColor: C.borderLt,
  },
  tickerText: { color: C.text, fontSize: 12, fontWeight: '700' },
  statusText: { fontSize: 11, fontWeight: '600' },
  sentBadge: { marginLeft: 'auto', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  sentText: { fontSize: 11, fontWeight: '700' },
  articleTitle: { color: C.textSec, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  impactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  impactLabel: { color: C.textMuted, fontSize: 11 },
  impactValue: { color: C.textMuted, fontSize: 11, fontWeight: '600', minWidth: 28 },
  explanation: { color: C.textMuted, fontSize: 12, lineHeight: 18 },
  signals: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  sigPos: { backgroundColor: '#052e16', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#166534' },
  sigPosText: { color: '#4ade80', fontSize: 10, fontWeight: '600' },
  sigNeg: { backgroundColor: '#2d0707', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#7f1d1d' },
  sigNegText: { color: '#f87171', fontSize: 10, fontWeight: '600' },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  topic: { backgroundColor: '#1e0d4e', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: C.accent },
  topicText: { color: C.accentLt, fontSize: 10, fontWeight: '600' },
  dateText: { color: C.border, fontSize: 11, marginTop: 2 },
});
