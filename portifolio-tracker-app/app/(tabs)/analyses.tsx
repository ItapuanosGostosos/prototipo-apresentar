import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { C, R, TAB_BAR_SPACE } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
import { Chip, EmptyState, GhostButton, GlassCard, ScreenHeader } from '../../src/components/ui/primitives';
import { listPortfolios } from '../../src/services/portfolios';
import { listAnalyses, analysePortfolio } from '../../src/services/analyses';
import type { Analysis, PortfolioListItem, SentimentLabel } from '../../src/types';

const SENT: Record<SentimentLabel, { label: string; color: string; bg: string }> = {
  positive: { label: 'Positivo', color: C.success, bg: C.successSoft },
  negative: { label: 'Negativo', color: '#FF8A8A', bg: C.dangerSoft },
  neutral:  { label: 'Neutro',   color: C.warning, bg: C.warningSoft },
};

const STATUS: Record<string, { label: string; color: string }> = {
  completed:  { label: 'Concluído',   color: C.success },
  pending:    { label: 'Pendente',    color: C.warning },
  processing: { label: 'Processando', color: C.info },
  failed:     { label: 'Falhou',      color: '#FF8A8A' },
};

const TIME_FILTERS = ['1S', '1M', '3M', '6M', '1A'];

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 1);
  const color = pct >= 0.6 ? C.success : pct >= 0.35 ? C.warning : '#FF8A8A';
  return (
    <View style={b.wrap}>
      <View style={[b.fill, { width: `${Math.round(pct * 100)}%` as any, backgroundColor: color }]} />
    </View>
  );
}
const b = StyleSheet.create({
  wrap: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});

function AnalysisCard({ item }: { item: Analysis }) {
  const sent = item.result?.sentiment_label;
  const sc   = sent ? SENT[sent] : null;
  const st   = STATUS[item.status] ?? { label: item.status, color: C.textMuted };

  return (
    <GlassCard style={s.card}>
      <View style={s.cardTop}>
        <View style={s.tickerBadge}><Text style={s.tickerText}>{item.ticker}</Text></View>
        <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
        {sc && (
          <View style={[s.sentBadge, { backgroundColor: sc.bg, borderColor: sc.color + '55' }]}>
            <Text style={[s.sentText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={() => item.article_url && Linking.openURL(item.article_url)} accessibilityRole="link">
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
    </GlassCard>
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
      Alert.alert('Análise iniciada', `Tarefa ${data.task_id} enfileirada.\nAtualize em instantes.`);
    },
    onError: (e: Error) => Alert.alert('Erro', e.message),
  });

  const completed = (analyses ?? []).filter((a) => a.status === 'completed').length;
  const total = (analyses ?? []).length;

  if (loadingP) {
    return (
      <View style={[s.root, s.centered]}>
        <DecoBackground />
        <ActivityIndicator color={C.accentLt} size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <DecoBackground />
      <SafeAreaView style={s.page} edges={['top', 'left', 'right']}>
        <ScreenHeader
          title="Analytics"
          subtitle={selectedId && total > 0 ? `${completed} de ${total} concluídas` : undefined}
          right={
            selectedId ? (
              <GhostButton label="Analisar" icon="pulse" onPress={() => analyseMutation.mutate()} loading={analyseMutation.isPending} />
            ) : undefined
          }
        />

        {/* Período (Figma: 1S · 1M · 3M · 6M · 1A) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipRow}>
          {TIME_FILTERS.map((f) => (
            <Chip key={f} label={f} active={timeFilter === f} onPress={() => setTimeFilter(f)} style={s.timeChip} />
          ))}
        </ScrollView>

        {/* Portfólio */}
        {(portfolios ?? []).length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipRow}>
            {(portfolios ?? []).map((p: PortfolioListItem) => (
              <Chip key={p.id} label={p.name} icon="wallet-outline" active={selectedId === p.id} onPress={() => setSelectedId(p.id)} />
            ))}
          </ScrollView>
        )}

        {!selectedId ? (
          <View style={s.centered}>
            <EmptyState icon="pie-chart-outline" title="Escolha um portfólio" description="Selecione um portfólio para ver as análises de sentimento." />
          </View>
        ) : isLoading ? (
          <View style={s.centered}><ActivityIndicator color={C.accentLt} size="large" /></View>
        ) : !analyses?.length ? (
          <View style={s.centered}>
            <EmptyState icon="stats-chart-outline" title="Nenhuma análise ainda" description='Toque em "Analisar" para iniciar.' />
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
  page: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: TAB_BAR_SPACE / 2 },

  chipScroll: { flexGrow: 0, marginBottom: 6 },
  chipRow: { paddingHorizontal: 20, gap: 8, alignItems: 'center', paddingVertical: 4 },
  timeChip: { paddingHorizontal: 18 },

  list: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: TAB_BAR_SPACE },
  card: { padding: 14, marginBottom: 12, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tickerBadge: {
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: C.border,
  },
  tickerText: { color: C.text, fontSize: 12, fontWeight: '700' },
  statusText: { fontSize: 11, fontWeight: '600' },
  sentBadge: { marginLeft: 'auto', borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 3, borderWidth: 1 },
  sentText: { fontSize: 11, fontWeight: '700' },
  articleTitle: { color: C.text, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  impactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  impactLabel: { color: C.textMuted, fontSize: 11 },
  impactValue: { color: C.textSec, fontSize: 11, fontWeight: '600', minWidth: 28, textAlign: 'right' },
  explanation: { color: C.textSec, fontSize: 12, lineHeight: 18 },
  signals: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  sigPos: { backgroundColor: C.successSoft, borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 2 },
  sigPosText: { color: C.success, fontSize: 10, fontWeight: '600' },
  sigNeg: { backgroundColor: C.dangerSoft, borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 2 },
  sigNegText: { color: '#FF8A8A', fontSize: 10, fontWeight: '600' },
  topics: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  topic: { backgroundColor: C.accentSoft, borderRadius: R.pill, paddingHorizontal: 8, paddingVertical: 2 },
  topicText: { color: C.accentLt, fontSize: 10, fontWeight: '600' },
  dateText: { color: C.textMuted, fontSize: 11, marginTop: 2 },
});
