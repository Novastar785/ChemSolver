
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import '../src/i18n';
import { scheduleDailyNotifications } from '../src/utils/notifications';

import { NotificationPermissionModal } from '../src/components/NotificationPermissionModal';

import { SubscriptionService } from '../src/services/SubscriptionService';

export default function Layout() {
  useEffect(() => {
    SubscriptionService.init();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="camera" options={{ presentation: 'modal' }} />
          </Stack>

          <NotificationPermissionModal onPermissionGranted={() => {
            scheduleDailyNotifications();
          }} />

        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
