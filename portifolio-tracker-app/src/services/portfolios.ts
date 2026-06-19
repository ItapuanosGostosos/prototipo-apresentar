import { apiFetch } from './api';
import type {
  Portfolio,
  PortfolioListItem,
  CreatePortfolioPayload,
  Asset,
  CreateAssetPayload,
} from '../types';

// ─── Portfolios ──────────────────────────────────────────────────────────────

export async function listPortfolios(): Promise<PortfolioListItem[]> {
  return apiFetch<PortfolioListItem[]>('/portfolios/');
}

export async function getPortfolio(id: number): Promise<Portfolio> {
  return apiFetch<Portfolio>(`/portfolios/${id}`);
}

export async function createPortfolio(
  payload: CreatePortfolioPayload,
): Promise<Portfolio> {
  return apiFetch<Portfolio>('/portfolios/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updatePortfolio(
  id: number,
  payload: Partial<CreatePortfolioPayload>,
): Promise<Portfolio> {
  return apiFetch<Portfolio>(`/portfolios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePortfolio(id: number): Promise<void> {
  return apiFetch<void>(`/portfolios/${id}`, { method: 'DELETE' });
}

// ─── Assets ──────────────────────────────────────────────────────────────────

export async function listAssets(portfolioId: number): Promise<Asset[]> {
  return apiFetch<Asset[]>(`/portfolios/${portfolioId}/assets`);
}

export async function addAsset(
  portfolioId: number,
  payload: CreateAssetPayload,
): Promise<Asset> {
  return apiFetch<Asset>(`/portfolios/${portfolioId}/assets`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function removeAsset(
  portfolioId: number,
  assetId: number,
): Promise<void> {
  return apiFetch<void>(`/portfolios/${portfolioId}/assets/${assetId}`, {
    method: 'DELETE',
  });
}
