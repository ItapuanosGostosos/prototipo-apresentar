import { apiFetch, tokenStorage } from './api';
import { keycloakLogin, keycloakLogout } from './keycloak';
import type { ChangePasswordPayload, LoginPayload, RegisterPayload, UpdateProfilePayload, User } from '../types';

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

export async function updateMe(payload: UpdateProfilePayload): Promise<User> {
  return apiFetch<User>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiFetch<{ detail: string }>('/auth/me/change-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
