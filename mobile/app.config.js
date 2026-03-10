const appName = process.env.EXPO_APP_NAME || 'Fikir Kutusu';
const appSlug = process.env.EXPO_APP_SLUG || 'fikir-kutusu';
const androidPackage = process.env.EXPO_ANDROID_PACKAGE || 'com.yksel.fikirkutusu';
const iosBundleIdentifier = process.env.EXPO_IOS_BUNDLE_IDENTIFIER || 'com.yksel.fikirkutusu';

module.exports = {
  expo: {
    name: appName,
    slug: appSlug,
    version: '1.0.0',
    scheme: 'fikirkutusu',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#060a12',
    },
    updates: {
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: iosBundleIdentifier,
    },
    android: {
      package: androidPackage,
      versionCode: 1,
      permissions: ['INTERNET'],
      adaptiveIcon: {
        backgroundColor: '#060a12',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [{ scheme: 'fikirkutusu' }],
          category: ['DEFAULT', 'BROWSABLE'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: process.env.EXPO_EAS_PROJECT_ID,
      },
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL,
    },
  },
};