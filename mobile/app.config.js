const appName = process.env.EXPO_APP_NAME || 'Fikir Kutusu';
const appSlug = process.env.EXPO_APP_SLUG || 'fikir-kutusu';
const androidPackage = process.env.EXPO_ANDROID_PACKAGE || 'com.yksel.fikirkutusu';
const iosBundleIdentifier = process.env.EXPO_IOS_BUNDLE_IDENTIFIER || 'com.yksel.fikirkutusu';
const admobAndroidAppId = process.env.ADMOB_ANDROID_APP_ID || 'ca-app-pub-3940256099942544~3347511713';
const admobIosAppId = process.env.ADMOB_IOS_APP_ID || undefined;

module.exports = {
  expo: {
    name: appName,
    slug: appSlug,
    version: '1.0.0',
    scheme: 'fikirkutusu',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'dark',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#060a12',
    },
    assetBundlePatterns: ['**/*'],
    plugins: [
      'expo-web-browser',
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: admobAndroidAppId,
          ...(admobIosAppId ? { iosAppId: admobIosAppId } : {}),
        },
      ],
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: iosBundleIdentifier,
    },
    android: {
      package: androidPackage,
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
        projectId: process.env.EXPO_EAS_PROJECT_ID || 'f553e6b3-5e8a-464d-a38c-82fcbe31ff45',
      },
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL,
    },
  },
};
