import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL não foi encontrada no arquivo .env'
  );
}

if (!supabasePublishableKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY não foi encontrada no arquivo .env'
  );
}

/*
  Armazenamento compatível com:
  - Android
  - iOS
  - Web
  - Renderização do Expo Router
*/

const storage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') {
        return null;
      }

      return window.localStorage.getItem(key);
    }

    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;

    return AsyncStorage.getItem(key);
  },

  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      }

      return;
    }

    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;

    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }

      return;
    }

    const AsyncStorage =
      require('@react-native-async-storage/async-storage').default;

    await AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);