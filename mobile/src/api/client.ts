import axios from 'axios';
import Constants from 'expo-constants';

// Intelligent Base URL resolution:
// 1. Explicit EXPO_PUBLIC_API_URL if defined
// 2. Host URI from Expo Constants (auto-detects developer machine IP when testing via Expo Go)
// 3. Fallback to 192.168.1.6:8000 or 10.0.2.2:8000 for emulator
function resolveBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // When running inside Expo Go, Constants.expoConfig?.hostUri or experienceUrl has the dev machine IP
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      return `http://${ip}:8000`;
    }
  }

  return 'http://192.168.1.6:8000';
}

const BASE_URL = resolveBaseUrl();

console.log('[CookWise API] Configured baseURL:', BASE_URL);

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 90_000, // Gemini LLM synthesis can take ~15-30s
  headers: { Accept: 'application/json' },
});

// Normalize every error into a human-readable message
export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      // Network / timeout
      return err.code === 'ECONNABORTED'
        ? 'The request timed out. The server may be waking up — please try again.'
        : `Cannot reach server at ${BASE_URL}. Check your connection and ensure the backend is running.`;
    }
    const data = err.response.data as { detail?: string } | undefined;
    if (data?.detail) return data.detail;
    return `Server error ${err.response.status}`;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}
