import Constants from 'expo-constants';

const REALM = 'portfolio';
const CLIENT_ID = 'portfolio-api';

function getKeycloakBaseUrl(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:8080`;
  }
  return 'http://localhost:8080';
}

function tokenUrl(): string {
  return `${getKeycloakBaseUrl()}/realms/${REALM}/protocol/openid-connect/token`;
}

export interface KeycloakTokens {
  access_token: string;
  refresh_token: string;
}

export async function keycloakLogin(email: string, password: string): Promise<KeycloakTokens> {
  const res = await fetch(tokenUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: CLIENT_ID,
      username: email,
      password,
    }).toString(),
  });

  if (!res.ok) {
    throw new Error('Credenciais inválidas.');
  }

  return res.json();
}

export async function keycloakRefresh(refreshToken: string): Promise<KeycloakTokens | null> {
  const res = await fetch(tokenUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!res.ok) return null;
  return res.json();
}

export async function keycloakLogout(refreshToken: string): Promise<void> {
  await fetch(`${getKeycloakBaseUrl()}/realms/${REALM}/protocol/openid-connect/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      refresh_token: refreshToken,
    }).toString(),
  });
}
