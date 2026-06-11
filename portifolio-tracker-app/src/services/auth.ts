import { apiFetch, tokenStorage } from './api';
import { keycloakLogin, keycloakLogout } from './keycloak';
import type { LoginPayload, RegisterPayload, User } from '../types';

export async function login(payload: LoginPayload): Promise<void> {
  const tokens = await keycloakLogin(payload.email, payload.password);
  await tokenStorage.set(tokens.access_token, tokens.refresh_token);
}

export async function register(payload: RegisterPayload): Promise<User> {
  return apiFetch<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe(): Promise<User> {
  return apiFetch<User>('/auth/me');
}

export async function logout(): Promise<void> {
  const refresh = await tokenStorage.getRefresh();
  if (refresh) {
    await keycloakLogout(refresh).catch(() => {});
  }
  await tokenStorage.clear();
}
