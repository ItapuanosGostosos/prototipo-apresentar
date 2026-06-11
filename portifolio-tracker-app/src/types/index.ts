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
