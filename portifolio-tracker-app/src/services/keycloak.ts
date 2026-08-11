import { getApiBaseUrl } from './api';

export interface KeycloakTokens {
  access_token: string;
  refresh_token: string;
}

export async function keycloakLogin(email: string, password: string): Promise<KeycloakTokens> {
  const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error('Credenciais inválidas.');
  }

  const data = await res.json();
  return { access_token: data.access, refresh_token: data.refresh };
}

export async function keycloakRefresh(refreshToken: string): Promise<KeycloakTokens | null> {
  const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: refreshToken }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return { access_token: data.access, refresh_token: data.refresh };
}

export async function keycloakLogout(_refreshToken: string): Promise<void> {
  // logout is handled client-side by clearing tokens
}
