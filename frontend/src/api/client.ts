import axios from 'axios';
import { Platform } from 'react-native';

// Default base URL by platform. Android emulators can't reach the host via
// `localhost`, so they use the special 10.0.2.2 alias instead. iOS
// simulators and web share the host network, so `localhost` works there.
// Testing on a physical device via Expo Go? Set EXPO_PUBLIC_API_URL to your
// machine's LAN IP, e.g. http://192.168.1.23:8000
function defaultBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'android') return 'http://10.0.2.2:8000';
  return 'http://localhost:8000';
}

export const apiClient = axios.create({
  baseURL: defaultBaseUrl(),
  timeout: 10000,
  headers: { 'content-type': 'application/json' },
});
