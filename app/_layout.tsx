import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { useFonts, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Fonts, FontSizes, FontWeights, Spacing, TouchTarget } from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { ProProvider } from '@/contexts/ProContext';

/**
 * Fully custom React Native header — replaces UINavigationBar entirely.
 * This bypasses iOS 26's liquid glass tint and any platform-version
 * inconsistencies, giving us 100% control over appearance.
 */
function ScreenHeader({ title }: { title?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[headerStyles.wrapper, { paddingTop: insets.top }]}>
      <View style={headerStyles.bar}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [headerStyles.back, pressed && headerStyles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={Strings.common.back}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={26} color={Colors.text} />
        </Pressable>

        <Text style={headerStyles.title} numberOfLines={1}>
          {title ?? ''}
        </Text>

        {/* Mirrors back button width so the title stays centered */}
        <View style={headerStyles.rightSpacer} />
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  // Outer wrapper grows with the safe area inset (status bar / Dynamic Island)
  wrapper: {
    backgroundColor: Colors.background,
  },
  // Fixed-height row that sits below the status bar
  bar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  back: {
    width: TouchTarget,
    height: TouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.5,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
    color: Colors.text,
  },
  rightSpacer: {
    width: TouchTarget,
  },
});

SplashScreen.preventAutoHideAsync().catch(() => {});

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
            headerShown: true,
            header: ({ options }) => <ScreenHeader title={options.title} />,
            contentStyle: { backgroundColor: Colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="verse/[id]"
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="deck/[id]"
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: Strings.settings.title,
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
