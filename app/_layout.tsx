import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Colors, Fonts, FontSizes, FontWeights, Spacing } from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { ProProvider } from '@/contexts/ProContext';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ PlayfairDisplay_700Bold });
  const [splashVisible, setSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!fontsLoaded) return;
    SplashScreen.hideAsync().catch(() => {});
    const timer = setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setSplashVisible(false));
    }, 2000);
    return () => clearTimeout(timer);
  }, [fontsLoaded, splashOpacity]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ProProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="verse/[id]"
            options={{
              title: '',
              headerBackTitle: '',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="deck/[id]"
            options={{
              title: '',
              headerBackTitle: '',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: Strings.settings.title,
              headerBackTitle: '',
              presentation: 'card',
            }}
          />
        </Stack>
        <StatusBar style="dark" />
        </ProProvider>
      </SafeAreaProvider>

      {splashVisible && (
        <Animated.View style={[styles.splash, { opacity: splashOpacity }]}>
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={styles.splashLogo}
            resizeMode="contain"
          />
          <Text style={styles.splashAppName}>{Strings.appName}</Text>
          <Text style={styles.splashTagline}>{Strings.tagline}</Text>
          <Text style={styles.splashReference}>{Strings.taglineReference}</Text>
        </Animated.View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  splashLogo: {
    width: 120,
    height: 120,
    marginBottom: Spacing.xl,
  },
  splashAppName: {
    fontSize: FontSizes.display,
    fontFamily: Fonts.wordmark,
    color: Colors.accent,
    letterSpacing: 3,
    marginBottom: Spacing.lg,
  },
  splashTagline: {
    fontSize: FontSizes.base,
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
    lineHeight: 24,
    marginBottom: Spacing.xs,
  },
  splashReference: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.sans,
    fontWeight: FontWeights.semibold,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
});
