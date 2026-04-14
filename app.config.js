// app.config.js — dynamic Expo config
//
// KEY VISIBILITY GUIDE:
//
// INTENTIONALLY PUBLIC (safe to expose in JS bundle):
//   EXPO_PUBLIC_API_URL              — your own API Gateway URL, no secret value
//   EXPO_PUBLIC_COGNITO_USER_POOL_ID — Cognito public identifier, not a secret
//   EXPO_PUBLIC_COGNITO_CLIENT_ID    — Cognito public client ID, not a secret
//   EXPO_PUBLIC_AWS_REGION           — region string, not a secret
//
// NATIVE-BUILD ONLY (injected into AndroidManifest / Info.plist, NOT the JS bundle):
//   GOOGLE_MAPS_API_KEY              — needed by react-native-maps tile renderer;
//                                      read here via process.env (no EXPO_PUBLIC_ prefix)
//                                      so it is never inlined into the compiled JS bundle.
//                                      Restrict this key in Google Cloud Console to:
//                                        iOS:     bundle ID  com.roamly.app
//                                        Android: package    com.roamly.app  + release SHA-1
//
// SERVER-SIDE ONLY (never in this file or any frontend .env):
//   ANTHROPIC_API_KEY                — lives exclusively in backend/.env and AWS Lambda
//   backend GOOGLE_MAPS_API_KEY      — lives exclusively in backend/.env and AWS Lambda

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'Roamly',
    slug: 'roamly-native',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'roamly',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.roamly.app',
      config: {
        // Read from env — NOT an EXPO_PUBLIC_ var, so it goes into the native
        // build config only and is never inlined into the JS bundle.
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      package: 'com.roamly.app',
    },
    plugins: [
      'expo-router',
      [
        'react-native-maps',
        {
          // Same as ios — native-only, not in JS bundle.
          googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#1D9E75',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: "e407262d-0c16-46a6-b7c4-d31b258b130f"
      }
    },
  },
};
