import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { ProProvider } from '@/contexts/ProContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
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
              headerBackTitle: 'Back',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="deck/[id]"
            options={{
              title: '',
              headerBackTitle: 'Back',
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: Strings.settings.title,
              headerBackTitle: 'Back',
              presentation: 'card',
            }}
          />
        </Stack>
        <StatusBar style="dark" />
        </ProProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
