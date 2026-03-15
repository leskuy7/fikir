import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fikirkutusu.app',
  appName: 'Fikir Kutusu',
  webDir: 'dist',
  server: {
    // Production'da bu satırı kaldır, sadece geliştirme için
    // url: 'http://192.168.1.X:5173',
    // cleartext: true,
  },
  plugins: {
    AdMob: {
      // Android AdMob App ID — AdMob hesabından alacaksın
      appId: 'ca-app-pub-XXXXX~XXXXX',
    },
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
};

export default config;
