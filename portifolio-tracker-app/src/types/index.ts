// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  username: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// ─── Portfolio ───────────────────────────────────────────────────────────────

export type AssetType = 'stock' | 'fii' | 'crypto' | 'etf' | 'bdr';

export interface Asset {
  id: number;
  ticker: string;
  name: string;
  asset_type: AssetType;
  created_at: string;
}

export interface Portfolio {
  id: number;
  name: string;
  asset_count: number;
  assets: Asset[];
  created_at: string;
  updated_at: string;
}

export interface PortfolioListItem {
  id: number;
  name: string;
  asset_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePortfolioPayload {
  name: string;
}

export interface CreateAssetPayload {
  ticker: string;
  name: string;
  asset_type: AssetType;
}

// ─── News ────────────────────────────────────────────────────────────────────

export interface NewsSource {
  id: number;
  name: string;
  slug: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  url: string;
  thumbnail_url: string;
  published_at: string;
  source: NewsSource | null;
  tickers: string[];
}

// ─── Analysis ────────────────────────────────────────────────────────────────

export type SentimentLabel = 'positive' | 'negative' | 'neutral';
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AnalysisResult {
  analysis_id: number;
  article_id: number;
  ticker: string;
  company_name: string;
  sentiment_label: SentimentLabel;
  text_sentiment_score: number;
  impact_score: number;
  confidence: number;
  relevance_score: number;
  adjustment_score: number;
  positive_signals: string[];
  negative_signals: string[];
  detected_topics: string[];
  explanation: string;
  language: string;
  model_version: string;
  processing_time_ms: number;
  processed_at: string;
}

export interface Analysis {
  id: number;
  ticker: string;
  status: AnalysisStatus;
  result: AnalysisResult | null;
  model_version: string | null;
  attempts: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  article_title: string;
  article_url: string;
}

export interface AnalysePortfolioResponse {
  articles_queued: number;
  analyses: Analysis[];
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type Platform = 'android' | 'ios';

export interface DeviceTokenPayload {
  token: string;
  platform: Platform;
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}
