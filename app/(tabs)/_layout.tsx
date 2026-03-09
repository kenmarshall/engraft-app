import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSizes, Spacing, TouchTarget } from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { TabIcon } from '@/components/TabIcon';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { paddingBottom: Math.max(insets.bottom, Spacing.sm) },
        ],
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: Strings.tabs.home,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="review"
        options={{
          title: Strings.tabs.review,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="book-open" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: Strings.tabs.add,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="plus-circle" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="deck"
        options={{
          title: Strings.tabs.deck,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="layers" color={color} focused={focused} />
          ),
        }}
      />
      {/* explore.tsx exists from boilerplate — hidden from tab bar */}
      <Tabs.Screen
        name="explore"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar,
    borderTopColor: Colors.tabBarBorder,
    borderTopWidth: StyleSheet.hairlineWidth,
    height: TouchTarget + Spacing.lg,
    paddingTop: Spacing.xs,
  },
  tabLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '500',
    marginTop: 2,
  },
});
