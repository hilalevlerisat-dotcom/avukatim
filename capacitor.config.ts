import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.avukatasistanim.app',
  appName: 'Avukat Asistanım',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: true,
    url: 'https://avukatim.vercel.app'
  },
  ios: {
    contentInset: 'always',
    preferredContentMode: 'mobile'
  }
};

export default config;
