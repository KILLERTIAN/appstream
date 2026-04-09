import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const STREAM_URL_KEY = '@appstream_server_url';

function getConfigStreamUrl() {
  // Prefer runtime config (app.config.ts → expo.extra) because it is reliably
  // available in dev builds even when Metro env injection is stale.
  const extra: any = (Constants.expoConfig as any)?.extra ?? (Constants.manifest as any)?.extra ?? {};
  const fromExtra = extra?.EXPO_PUBLIC_STREAM_URL;
  if (typeof fromExtra === 'string' && fromExtra.trim()) return fromExtra.trim().replace(/\/$/, '');

  const envUrl = process.env.EXPO_PUBLIC_STREAM_URL;
  if (typeof envUrl === 'string' && envUrl.trim()) return envUrl.trim().replace(/\/$/, '');

  return null;
}

function getDefaultStreamUrl() {
  const configured = getConfigStreamUrl();
  if (configured) return configured;

  // Emulators/simulators run "behind" the host:
  // - Android emulator reaches the host via 10.0.2.2
  // - iOS simulator can use localhost
  if (Platform.OS === 'android' && Constants.isDevice === false) return 'http://10.0.2.2:8080';
  if (Platform.OS === 'ios' && Constants.isDevice === false) return 'http://localhost:8080';

  // Physical devices should set this explicitly in-app (or via EXPO_PUBLIC_STREAM_URL).
  return 'http://localhost:8080';
}

export const getStreamUrl = async () => {
  // If you provide a hosted URL (Cloudflare/ngrok/etc) via env var, always prefer it.
  // This avoids the simulator being "stuck" on a previously saved localhost URL.
  const configured = getConfigStreamUrl();
  if (configured) return configured;

  try {
    const value = await AsyncStorage.getItem(STREAM_URL_KEY);
    // If the user previously saved a LAN IP, it commonly breaks emulators.
    // Prefer the platform-specific default for simulators/emulators unless the user
    // explicitly set something else afterward.
    const normalized = (value || '').replace(/\/$/, '');
    if (normalized && Constants.isDevice === false && /^http:\/\/192\.168\./.test(normalized)) {
      return getDefaultStreamUrl();
    }

    return (normalized || getDefaultStreamUrl()).replace(/\/$/, '');
  } catch (e) {
    return getDefaultStreamUrl();
  }
};

export const setStreamUrl = async (url: string) => {
  try {
    await AsyncStorage.setItem(STREAM_URL_KEY, url);
  } catch (e) {
    // Error saving data
  }
};
