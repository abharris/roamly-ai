import 'react-native-get-random-values';
import React from 'react';
import { Stack } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import { configureAmplify } from '../src/config/amplify';
import { queryClient } from '../src/config/queryClient';
import { requestNotificationPermissions } from '../src/utils/notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
import {
  useFonts,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from '@expo-google-fonts/dm-mono';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '../src/theme';

configureAmplify();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    DMMono_400Regular,
    DMMono_500Medium,
    ...Ionicons.font,
  });
  React.useEffect(() => {
    requestNotificationPermissions();
  }, []);


  if (!fontsLoaded) {
    return <View style={styles.loading}><ActivityIndicator color={Colors.teal} /></View>;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
