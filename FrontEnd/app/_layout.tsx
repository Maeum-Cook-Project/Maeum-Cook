
import 'react-native-reanimated';
import { useFonts } from 'expo-font';
import React, { useEffect, useState } from 'react';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Stack, router } from 'expo-router';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TimerProvider } from '@/contexts/TimerContext';
import {WebSocketProvider} from '@/contexts/WebSocketContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const onboardingStatus = await AsyncStorage.getItem('onboarding_completed');
        console.log('Onboarding status from AsyncStorage:', onboardingStatus);
        
        if (onboardingStatus === 'true') {
          setHasCompletedOnboarding(true);
        } else {
          setHasCompletedOnboarding(false);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setHasCompletedOnboarding(false);
      } finally {
        setIsReady(true);
      }
    };

    checkOnboarding();
  }, []);

  useEffect(() => {
    if (loaded && isReady) {
      SplashScreen.hideAsync();
      
      // Navigate to appropriate screen based on onboarding status
      if (!hasCompletedOnboarding) {
        console.log('Navigating to onboarding');
        router.replace('/onboarding');
      } else {
        console.log('Navigating to home');
        router.replace('/(tabs)/(home)');
      }
    }
  }, [loaded, isReady, hasCompletedOnboarding]);

  if (!loaded || !isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WebSocketProvider>
        <TimerProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <SystemBars style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </TimerProvider>
      </WebSocketProvider>
    </GestureHandlerRootView>
  );
}
