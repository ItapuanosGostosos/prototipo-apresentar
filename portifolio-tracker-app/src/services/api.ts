import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const KEYCLOAK_REALM = 'portfolio';
const KEYCLOAK_CLIENT_ID = 'portfolio-api';

function getHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  return hostUri ? hostUri.split(':')[0] : 'localhost';
}

export function getApiBaseUrl(): string {
  return `http://${getHost()}:8000/api`;
}

export function getKeycloakTokenUrl(): string {
  return `http://${getHost()}:8080/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
}

export const API_BASE_URL = getApiBaseUrl();

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@portifolio:access_token',
  REFRESH_TOKEN: '@portifolio:refresh_token',
};

export const tokenStorage = {
  async getAccess(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
  async getRefresh(): Promise<string | null> {
    return AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
  async set(access: string, refresh: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
  },
  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  },
};

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await tokenStorage.getRefresh();
  if (!refresh) return null;

  const res = await fetch(getKeycloakTokenUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: KEYCLOAK_CLIENT_ID,
      refresh_token: refresh,
    }).toString(),
  });

  if (!res.ok) {
    await tokenStorage.clear();
    return null;
  }

  const data = await res.json();
  await tokenStorage.set(data.access_token, data.refresh_token);
  return data.access_token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = await tokenStorage.getAccess();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, options, false);
    }
    throw new Error('UNAUTHORIZED');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const json = await res.json();

  if (!res.ok) {
    const message =
      json?.detail ||
      Object.values(json).flat().join(' ') ||
      'Erro desconhecido';
    throw new Error(message as string);
  }

  return json as T;
}
