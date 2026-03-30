const appName = process.env.EXPO_APP_NAME || 'Fikir Kutusu';
const appSlug = process.env.EXPO_APP_SLUG || 'fikir-kutusu';
const androidPackage = process.env.EXPO_ANDROID_PACKAGE || 'com.yksel.fikirkutusu';
const iosBundleIdentifier = process.env.EXPO_IOS_BUNDLE_IDENTIFIER || 'com.yksel.fikirkutusu';
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '563317995480-8rah7362kjqlep9s6uo5bghqtj0nc87l.apps.googleusercontent.com';
const androidAdMobAppId = process.env.ADMOB_ANDROID_APP_ID;
const iosAdMobAppId = process.env.ADMOB_IOS_APP_ID;
const iosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME
  || `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`;

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
      [
        '@react-native-google-signin/google-signin',
        { iosUrlScheme },
      ],
      [
        'react-native-google-mobile-ads',
        {
          androidAppId: androidAdMobAppId,
          iosAppId: iosAdMobAppId,
          optimizeInitialization: true,
          optimizeAdLoading: true,
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
        {
          action: 'VIEW',
          data: [{ scheme: androidPackage }],
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
