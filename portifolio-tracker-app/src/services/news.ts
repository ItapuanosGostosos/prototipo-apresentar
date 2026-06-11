import { apiFetch } from './api';
import type { NewsArticle } from '../types';

export async function getGlobalNews(): Promise<NewsArticle[]> {
  return apiFetch<NewsArticle[]>('/news');
}

export async function getPortfolioNews(
  portfolioId: number,
): Promise<NewsArticle[]> {
  return apiFetch<NewsArticle[]>(`/news/portfolio/${portfolioId}`);
}
