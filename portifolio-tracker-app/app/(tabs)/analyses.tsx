import { useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, ScrollView, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { C, R, TAB_BAR_SPACE, CONTENT_MAX_WIDTH } from '../../src/theme';
import { DecoBackground } from '../../src/components/ui/DecoBackground';
import { Chip, EmptyState, GhostButton, GlassCard, ScreenHeader } from '../../src/components/ui/primitives';
import { UserAvatar } from '../../src/components/ui/UserAvatar';
import { listPortfolios } from '../../src/services/portfolios';
import { listAnalyses, analysePortfolio } from '../../src/services/analyses';
import type { Analysis, PortfolioListItem, SentimentLabel } from '../../src/types';
import {
  PERIODS, buildPeriodImpact, countsSentence, filterByPeriod, impactSentence,
  VERDICT_TEXT, type PeriodImpact, type PeriodKey, type TickerImpact, type Verdict,
} from '../../src/utils/sentiment';
import { notify } from '../../src/utils/feedback';

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

const VERDICT_COLOR: Record<Verdict, string> = {
  favorable: C.success,
  neutral: C.warning,
  unfavorable: '#FF8A8A',
};

/** Linha exibida: a análise + de quais carteiras aquele ticker faz parte. */
type Row = { analysis: Analysis; portfolioNames: string[] };

// ─── Barra divergente (impact_score vai de -1 a 1) ───────────────────────────

function NetBar({ net, height = 6 }: { net: number; height?: number }) {
  const clamped = Math.max(-1, Math.min(1, net));
  const half = Math.abs(clamped) * 50;
  const color = VERDICT_COLOR[clamped >= 0.15 ? 'favorable' : clamped <= -0.15 ? 'unfavorable' : 'neutral'];
  return (
    <View style={[b.track, { height, borderRadius: height / 2 }]}>
      <View style={b.zero} />
      <View
        style={[
          b.fill,
          { width: `${half}%` as any, backgroundColor: color },
          clamped >= 0 ? { left: '50%' } : { right: '50%' },
        ]}
      />
    </View>
  );
}

const b = StyleSheet.create({
  track: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', justifyContent: 'center' },
  zero: { position: 'absolute', left: '50%', width: 1, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.28)' },
  fill: { position: 'absolute', top: 0, bottom: 0 },
});

function signedPct(net: number): string {
  const v = Math.round(net * 100);
  return `${v > 0 ? '+' : ''}${v}%`;
}

// ─── Resumo de impacto do período ────────────────────────────────────────────

function TickerRow({ t }: { t: TickerImpact }) {
  const color = VERDICT_COLOR[t.verdict];
  return (
    <View style={s.tickerRow}>
      <View style={s.tickerRowHead}>
        <View style={s.tickerBadge}><Text style={s.tickerText}>{t.ticker}</Text></View>
        <Text style={s.tickerCounts} numberOfLines={1}>{countsSentence(t)}</Text>
        <Text style={[s.tickerVerdict, { color }]}>{signedPct(t.net)}</Text>
      </View>
      <View style={s.tickerBarRow}>
        <NetBar net={t.net} height={5} />
        <Text style={[s.tickerVerdictWord, { color }]}>{VERDICT_TEXT[t.verdict].short}</Text>
      </View>
    </View>
  );
}

function ImpactSummary({ impact, period }: { impact: PeriodImpact; period: PeriodKey }) {
  const color = VERDICT_COLOR[impact.verdict];
  const icon = impact.verdict === 'favorable'
    ? 'trending-up'
    : impact.verdict === 'unfavorable' ? 'trending-down' : 'remove-outline';

  return (
    <GlassCard style={s.summary} strong>
      <View style={s.summaryHead}>
        <Ionicons name="analytics-outline" size={16} color={C.accentLt} />
        <Text style={s.summaryTitle}>Impacto geral do período</Text>
        <View style={[s.verdictPill, { backgroundColor: color + '22', borderColor: color + '66' }]}>
          <Ionicons name={icon as any} size={12} color={color} />
          <Text style={[s.verdictPillText, { color }]}>{VERDICT_TEXT[impact.verdict].short}</Text>
        </View>
      </View>

      <Text style={s.summarySentence}>{impactSentence(impact, period)}</Text>

      {impact.total > 0 && (
        <>
          <View style={s.summaryBarRow}>
            <Text style={s.summaryBarEdge}>-100%</Text>
            <NetBar net={impact.net} height={8} />
            <Text style={s.summaryBarEdge}>+100%</Text>
          </View>

          <Text style={s.summaryCounts}>
            {countsSentence(impact)} · {impact.total} {impact.total === 1 ? 'notícia analisada' : 'notícias analisadas'}
          </Text>

          {impact.best && impact.tickers.length > 1 && (
            <View style={s.highlights}>
              <View style={s.highlight}>
                <Text style={s.highlightLabel}>Mais propício</Text>
                <Text style={[s.highlightValue, { color: VERDICT_COLOR[impact.best.verdict] }]}>
                  {impact.best.ticker} {signedPct(impact.best.net)}
                </Text>
              </View>
              {impact.worst && (
                <View style={s.highlight}>
                  <Text style={s.highlightLabel}>Mais adverso</Text>
                  <Text style={[s.highlightValue, { color: VERDICT_COLOR[impact.worst.verdict] }]}>
                    {impact.worst.ticker} {signedPct(impact.worst.net)}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={s.divider} />
          {impact.tickers.map((t) => <TickerRow key={t.ticker} t={t} />)}
        </>
      )}
    </GlassCard>
  );
}

// ─── Cartão de análise ───────────────────────────────────────────────────────

function AnalysisCard({ item, portfolioNames }: { item: Analysis; portfolioNames?: string[] }) {
  const sent = item.result?.sentiment_label;
  const sc   = sent ? SENT[sent] : null;
  const st   = STATUS[item.status] ?? { label: item.status, color: C.textMuted };
  const impact = item.result?.impact_score ?? 0;
  const positives = item.result?.positive_signals ?? [];
  const negatives = item.result?.negative_signals ?? [];
  const topics    = item.result?.detected_topics ?? [];

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

      {portfolioNames && portfolioNames.length > 0 && (
        <View style={s.walletRow}>
          <Ionicons name="wallet-outline" size={12} color={C.textMuted} />
          <Text style={s.walletText} numberOfLines={1}>{portfolioNames.join(' · ')}</Text>
        </View>
      )}

      <TouchableOpacity onPress={() => item.article_url && Linking.openURL(item.article_url)} accessibilityRole="link">
        <Text style={s.articleTitle} numberOfLines={2}>{item.article_title}</Text>
      </TouchableOpacity>

      {item.result && (
        <>
          <View style={s.impactRow}>
            <Text style={s.impactLabel}>Impacto</Text>
            <NetBar net={impact} />
            <Text style={s.impactValue}>{signedPct(impact)}</Text>
          </View>
          <Text style={s.explanation} numberOfLines={3}>{item.result.explanation}</Text>
          {(positives.length > 0 || negatives.length > 0) && (
            <View style={s.signals}>
              {positives.map((sg) => (
                <View key={sg} style={s.sigPos}><Text style={s.sigPosText}>{sg.replace('word:', '')}</Text></View>
              ))}
              {negatives.map((sg) => (
                <View key={sg} style={s.sigNeg}><Text style={s.sigNegText}>{sg.replace('word:', '')}</Text></View>
              ))}
            </View>
          )}
          {topics.length > 0 && (
            <View style={s.topics}>
              {topics.map((t) => (
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

// ─── Tela ────────────────────────────────────────────────────────────────────

/** De quanto em quanto tempo a tela se atualiza sozinha enquanto há fila. */
const POLL_MS = 4000;

const EM_ANDAMENTO: Analysis['status'][] = ['pending', 'processing'];

function temPendente(lista?: Analysis[]): boolean {
  return (lista ?? []).some((a) => EM_ANDAMENTO.includes(a.status));
}

/**
 * A análise é assíncrona: a API responde na hora e o worker vai concluindo as
 * linhas depois. Sem isto a tela ficava congelada no estado anterior até o
 * usuário puxar para atualizar. Enquanto houver análise na fila busca sozinha;
 * quando a última conclui, para de buscar.
 */
function pollEnquantoPendente(query: { state: { data?: Analysis[] } }): number | false {
  return temPendente(query.state.data) ? POLL_MS : false;
}

export default function AnalysesScreen() {
  const qc = useQueryClient();
  // null = "Todas as carteiras": é o estado inicial e mostra tudo, dizendo a origem.
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [period, setPeriod] = useState<PeriodKey>('1M');

  const { data: portfolios, isLoading: loadingP } = useQuery({ queryKey: ['portfolios'], queryFn: listPortfolios });
  const list = portfolios ?? [];
  const showingAll = selectedId === null;

  const single = useQuery({
    queryKey: ['analyses', selectedId],
    queryFn: () => listAnalyses(selectedId!),
    enabled: selectedId !== null,
    refetchInterval: pollEnquantoPendente,
  });

  const allQueries = useQueries({
    queries: list.map((p) => ({
      queryKey: ['analyses', p.id],
      queryFn: () => listAnalyses(p.id),
      enabled: showingAll,
      refetchInterval: pollEnquantoPendente,
    })),
  });

  const allStamp = allQueries.map((q) => q.dataUpdatedAt).join(',');

  /** Sem carteira selecionada, junta as análises de todas e marca de qual carteira vêm. */
  const rows: Row[] = useMemo(() => {
    if (!showingAll) {
      return (single.data ?? []).map((a) => ({ analysis: a, portfolioNames: [] }));
    }
    const merged = new Map<number, Row>();
    allQueries.forEach((q, i) => {
      const name = list[i]?.name ?? '';
      for (const a of q.data ?? []) {
        const existing = merged.get(a.id);
        if (existing) {
          if (name && !existing.portfolioNames.includes(name)) existing.portfolioNames.push(name);
        } else {
          merged.set(a.id, { analysis: a, portfolioNames: name ? [name] : [] });
        }
      }
    });
    return [...merged.values()].sort(
      (x, y) => new Date(y.analysis.created_at).getTime() - new Date(x.analysis.created_at).getTime(),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showingAll, single.data, allStamp, list]);

  /** Recorte do período escolhido nos chips (1S · 1M · 3M · 6M · 1A). */
  const visible = useMemo(() => {
    const kept = new Set(filterByPeriod(rows.map((r) => r.analysis), period).map((a) => a.id));
    return rows.filter((r) => kept.has(r.analysis.id));
  }, [rows, period]);

  const impact = useMemo(() => buildPeriodImpact(visible.map((r) => r.analysis)), [visible]);

  const analyseMutation = useMutation({
    mutationFn: async () => {
      const ids = showingAll ? list.map((p) => p.id) : [selectedId!];
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
          ? 'As notícias estão sendo analisadas. O progresso aparece aqui mesmo.'
          : `${tasks.length} carteiras enfileiradas. O progresso aparece aqui mesmo.`,
      );
    },
    onError: (e: Error) => notify('Erro', e.message),
  });

  function refetchAll() {
    if (showingAll) allQueries.forEach((q) => q.refetch());
    else single.refetch();
  }

  const isLoading    = showingAll ? allQueries.some((q) => q.isLoading)    : single.isLoading;
  const isRefetching = showingAll ? allQueries.some((q) => q.isRefetching) : single.isRefetching;

  const completed = visible.filter((r) => r.analysis.status === 'completed').length;
  const naFila = visible.length - completed;
  // Com fila em andamento a tela se atualiza sozinha; dizer isso evita que o
  // usuário ache que travou e fique puxando para atualizar.
  const progresso = naFila > 0
    ? `${completed} de ${visible.length} concluídas · analisando ${naFila}…`
    : `${completed} de ${visible.length} concluídas`;
  const subtitle = list.length === 0
    ? undefined
    : showingAll
      ? `Todas as carteiras · ${progresso}`
      : progresso;

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
          subtitle={subtitle}
          right={
            <View style={s.headerActions}>
              {list.length > 0 && (
                <GhostButton
                  label="Analisar"
                  icon="pulse"
                  onPress={() => analyseMutation.mutate()}
                  loading={analyseMutation.isPending}
                />
              )}
              <UserAvatar size={40} />
            </View>
          }
        />

        {/* Período (Figma: 1S · 1M · 3M · 6M · 1A) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipRow}>
          {PERIODS.map((p) => (
            <Chip key={p.key} label={p.key} active={period === p.key} onPress={() => setPeriod(p.key)} style={s.timeChip} />
          ))}
        </ScrollView>

        {/* Carteira — "Todas" é o padrão */}
        {list.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipScroll} contentContainerStyle={s.chipRow}>
            <Chip label="Todas" icon="albums-outline" active={showingAll} onPress={() => setSelectedId(null)} />
            {list.map((p: PortfolioListItem) => (
              <Chip key={p.id} label={p.name} icon="wallet-outline" active={selectedId === p.id} onPress={() => setSelectedId(p.id)} />
            ))}
          </ScrollView>
        )}

        {list.length === 0 ? (
          <View style={s.centered}>
            <EmptyState
              icon="wallet-outline"
              title="Nenhuma carteira ainda"
              description="Crie uma carteira na aba Carteira para ver as análises."
            />
          </View>
        ) : isLoading ? (
          <View style={s.centered}><ActivityIndicator color={C.accentLt} size="large" /></View>
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(r) => String(r.analysis.id)}
            contentContainerStyle={s.list}
            ListHeaderComponent={<ImpactSummary impact={impact} period={period} />}
            ListEmptyComponent={
              <View style={s.emptyList}>
                <EmptyState
                  icon="stats-chart-outline"
                  title="Nenhuma análise no período"
                  description={'Troque o período acima ou toque em "Analisar" para buscar notícias novas.'}
                />
              </View>
            }
            renderItem={({ item }) => (
              <AnalysisCard
                item={item.analysis}
                portfolioNames={showingAll ? item.portfolioNames : undefined}
              />
            )}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetchAll} tintColor={C.accentLt} colors={[C.accentLt]} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  page: { flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingBottom: TAB_BAR_SPACE / 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // flexShrink: 0 é obrigatório: o ScrollView do react-native-web nasce com
  // flexShrink 1 e a lista abaixo esmagava a linha de chips até sumir.
  chipScroll: { flexGrow: 0, flexShrink: 0, marginBottom: 6 },
  chipRow: { paddingHorizontal: 20, gap: 8, alignItems: 'center', paddingVertical: 4 },
  timeChip: { paddingHorizontal: 18 },

  list: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: TAB_BAR_SPACE },
  emptyList: { paddingVertical: 36 },

  // Resumo de impacto
  summary: { padding: 16, marginBottom: 14, gap: 10, borderRadius: R.xl },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryTitle: { color: C.text, fontSize: 15, fontWeight: '700', flex: 1 },
  verdictPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: R.pill,
    borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4,
  },
  verdictPillText: { fontSize: 11, fontWeight: '800' },
  summarySentence: { color: C.textSec, fontSize: 13, lineHeight: 19 },
  summaryBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  summaryBarEdge: { color: C.textMuted, fontSize: 10 },
  summaryCounts: { color: C.text, fontSize: 12, fontWeight: '600' },
  highlights: { flexDirection: 'row', gap: 10, marginTop: 2 },
  highlight: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: R.md,
    paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border,
  },
  highlightLabel: { color: C.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  highlightValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.border, marginVertical: 4 },

  tickerRow: { gap: 6, paddingVertical: 6 },
  tickerRowHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tickerCounts: { color: C.textSec, fontSize: 11, flex: 1 },
  tickerVerdict: { fontSize: 12, fontWeight: '700' },
  tickerBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tickerVerdictWord: { fontSize: 10, fontWeight: '700', minWidth: 54, textAlign: 'right' },

  // Cartão
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
  walletRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  walletText: { color: C.textMuted, fontSize: 11, flex: 1 },
  articleTitle: { color: C.text, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  impactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  impactLabel: { color: C.textMuted, fontSize: 11 },
  impactValue: { color: C.textSec, fontSize: 11, fontWeight: '600', minWidth: 36, textAlign: 'right' },
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
