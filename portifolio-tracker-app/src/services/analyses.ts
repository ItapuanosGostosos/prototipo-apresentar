import { apiFetch } from './api';
import type { Analysis, AnalysePortfolioResponse } from '../types';

export async function analysePortfolio(
  portfolioId: number,
): Promise<AnalysePortfolioResponse> {
  return apiFetch<AnalysePortfolioResponse>(`/portfolios/${portfolioId}/analyse`, {
    method: 'POST',
  });
}

export async function listAnalyses(portfolioId: number): Promise<Analysis[]> {
  return apiFetch<Analysis[]>(`/portfolios/${portfolioId}/analyses`);
}
