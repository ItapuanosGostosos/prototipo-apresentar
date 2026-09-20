import type { Analysis } from '../types';

// ─── Período ─────────────────────────────────────────────────────────────────

export type PeriodKey = '1S' | '1M' | '3M' | '6M' | '1A';

export const PERIODS: { key: PeriodKey; days: number; long: string }[] = [
  { key: '1S', days: 7,   long: 'da última semana' },
  { key: '1M', days: 30,  long: 'do último mês' },
  { key: '3M', days: 90,  long: 'dos últimos 3 meses' },
  { key: '6M', days: 180, long: 'dos últimos 6 meses' },
  { key: '1A', days: 365, long: 'do último ano' },
];

export function periodLabel(key: PeriodKey): string {
  return PERIODS.find((p) => p.key === key)?.long ?? 'período';
}

/** Data de referência da análise: quando terminou ou, se pendente, quando foi criada. */
export function analysisDate(a: Analysis): number {
  return new Date(a.finished_at ?? a.created_at).getTime();
}

export function filterByPeriod(list: Analysis[], key: PeriodKey): Analysis[] {
  const days = PERIODS.find((p) => p.key === key)?.days ?? 30;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return list.filter((a) => {
    const t = analysisDate(a);
    return Number.isNaN(t) || t >= cutoff;
  });
}

// ─── Impacto agregado ────────────────────────────────────────────────────────

/**
 * `impact_score` vem do motor de sentimento no intervalo -1..1 e usa os mesmos
 * cortes do backend (`sentiment_ai/engine/analyzer.py`): >= 0.15 positivo,
 * <= -0.15 negativo, entre os dois neutro.
 */
export const IMPACT_THRESHOLD = 0.15;

export type Verdict = 'favorable' | 'neutral' | 'unfavorable';

export interface TickerImpact {
  ticker: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  /** Média dos impact_score no período, de -1 (ruim) a 1 (bom). */
  net: number;
  verdict: Verdict;
}

export interface PeriodImpact {
  net: number;
  verdict: Verdict;
  positive: number;
  neutral: number;
  negative: number;
  /** Notícias analisadas com resultado no período. */
  total: number;
  tickers: TickerImpact[];
  best: TickerImpact | null;
  worst: TickerImpact | null;
}

export function verdictOf(net: number): Verdict {
  if (net >= IMPACT_THRESHOLD) return 'favorable';
  if (net <= -IMPACT_THRESHOLD) return 'unfavorable';
  return 'neutral';
}

export const VERDICT_TEXT: Record<Verdict, { title: string; short: string }> = {
  favorable:   { title: 'Cenário favorável',    short: 'Propício' },
  neutral:     { title: 'Cenário neutro',       short: 'Neutro' },
  unfavorable: { title: 'Cenário desfavorável', short: 'Adverso' },
};

/** Agrega as análises concluídas em um panorama de impacto por ticker e geral. */
export function buildPeriodImpact(analyses: Analysis[]): PeriodImpact {
  const byTicker = new Map<string, TickerImpact & { sum: number }>();
  let sum = 0;
  let positive = 0;
  let neutral = 0;
  let negative = 0;
  let total = 0;

  for (const a of analyses) {
    const r = a.result;
    if (!r) continue;

    const ticker = (a.ticker || r.ticker || '—').toUpperCase();
    let entry = byTicker.get(ticker);
    if (!entry) {
      entry = { ticker, positive: 0, neutral: 0, negative: 0, total: 0, net: 0, verdict: 'neutral', sum: 0 };
      byTicker.set(ticker, entry);
    }

    const impact = typeof r.impact_score === 'number' ? r.impact_score : 0;
    entry.sum += impact;
    entry.total += 1;
    sum += impact;
    total += 1;

    if (r.sentiment_label === 'positive') { entry.positive += 1; positive += 1; }
    else if (r.sentiment_label === 'negative') { entry.negative += 1; negative += 1; }
    else { entry.neutral += 1; neutral += 1; }
  }

  const tickers = [...byTicker.values()]
    .map((t) => {
      const net = t.total > 0 ? t.sum / t.total : 0;
      return { ticker: t.ticker, positive: t.positive, neutral: t.neutral, negative: t.negative, total: t.total, net, verdict: verdictOf(net) };
    })
    .sort((a, b) => b.net - a.net);

  const net = total > 0 ? sum / total : 0;

  return {
    net,
    verdict: verdictOf(net),
    positive,
    neutral,
    negative,
    total,
    tickers,
    best: tickers.length > 0 ? tickers[0] : null,
    worst: tickers.length > 1 ? tickers[tickers.length - 1] : null,
  };
}

/** "3 positivas, 1 neutra e 1 negativa" */
export function countsSentence(t: { positive: number; neutral: number; negative: number }): string {
  const parts: string[] = [];
  if (t.positive) parts.push(`${t.positive} ${t.positive === 1 ? 'positiva' : 'positivas'}`);
  if (t.neutral)  parts.push(`${t.neutral} ${t.neutral === 1 ? 'neutra' : 'neutras'}`);
  if (t.negative) parts.push(`${t.negative} ${t.negative === 1 ? 'negativa' : 'negativas'}`);
  if (parts.length === 0) return 'sem notícias analisadas';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

/** Frase de resumo geral do período, no formato pedido pelo produto. */
export function impactSentence(imp: PeriodImpact, period: PeriodKey): string {
  const when = periodLabel(period);
  if (imp.total === 0) return `Nenhuma notícia analisada ${when.replace(/^d/, 'n')}.`;
  const pct = Math.round(Math.abs(imp.net) * 100);
  if (imp.verdict === 'favorable') {
    return `No geral, as notícias ${when} pesam a favor (${pct}% de impacto positivo médio).`;
  }
  if (imp.verdict === 'unfavorable') {
    return `No geral, as notícias ${when} pesam contra (${pct}% de impacto negativo médio).`;
  }
  return `No geral, as notícias ${when} se equilibram — sem tendência clara.`;
}
