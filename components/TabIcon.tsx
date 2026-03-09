import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors, TouchTarget } from '@/constants/theme';

// Minimal icon set using Unicode symbols — no third-party icon library needed.
// Maps icon name to a Unicode character that renders clearly.
const ICON_MAP: Record<string, string> = {
  home: '⌂',
  'book-open': '📖',
  'plus-circle': '＋',
  layers: '◫',
};

// Fallback text icons for clean rendering
const ICON_TEXT: Record<string, string> = {
  home: 'Home',
  'book-open': 'Review',
  'plus-circle': 'Add',
  layers: 'Deck',
};

interface TabIconProps {
  name: string;
  color: string;
  focused: boolean;
  size?: number;
}

export function TabIcon({ name, color, focused, size = 22 }: TabIconProps) {
  // Use simple styled dots/bars as platform-agnostic icon primitives
  return (
    <View style={[styles.container, { minHeight: size, minWidth: size }]}>
      <IconShape name={name} color={color} size={size} focused={focused} />
    </View>
  );
}

function IconShape({
  name,
  color,
  size,
  focused,
}: {
  name: string;
  color: string;
  size: number;
  focused: boolean;
}) {
  switch (name) {
    case 'home':
      return <HomeIcon color={color} size={size} focused={focused} />;
    case 'book-open':
      return <BookIcon color={color} size={size} focused={focused} />;
    case 'plus-circle':
      return <PlusIcon color={color} size={size} focused={focused} />;
    case 'layers':
      return <DeckIcon color={color} size={size} focused={focused} />;
    default:
      return <View style={[styles.dot, { backgroundColor: color }]} />;
  }
}

function HomeIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      {/* Roof */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: s * 0.45,
          borderRightWidth: s * 0.45,
          borderBottomWidth: s * 0.45,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
          marginBottom: 1,
        }}
      />
      {/* Body */}
      <View
        style={{
          width: s * 0.6,
          height: s * 0.4,
          backgroundColor: color,
          opacity: focused ? 1 : 0.85,
        }}
      />
    </View>
  );
}

function BookIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const s = size;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{
          width: s * 0.8,
          height: s * 0.7,
          borderWidth: 2,
          borderColor: color,
          borderRadius: 2,
          opacity: focused ? 1 : 0.85,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Lines representing text */}
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{
              width: '70%',
              height: 1.5,
              backgroundColor: color,
              marginVertical: 1.5,
              opacity: 0.8,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function PlusIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const s = size;
  const thickness = focused ? 2.5 : 2;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer circle */}
      <View
        style={{
          width: s * 0.85,
          height: s * 0.85,
          borderRadius: s * 0.5,
          borderWidth: thickness,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: focused ? 1 : 0.85,
        }}
      >
        {/* Vertical bar */}
        <View
          style={{
            position: 'absolute',
            width: thickness,
            height: s * 0.42,
            backgroundColor: color,
          }}
        />
        {/* Horizontal bar */}
        <View
          style={{
            position: 'absolute',
            width: s * 0.42,
            height: thickness,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

function DeckIcon({ color, size, focused }: { color: string; size: number; focused: boolean }) {
  const s = size;
  const cardWidth = s * 0.72;
  const cardHeight = s * 0.55;
  return (
    <View style={{ width: s, height: s, alignItems: 'center', justifyContent: 'center' }}>
      {/* Back card */}
      <View
        style={{
          position: 'absolute',
          width: cardWidth,
          height: cardHeight,
          borderRadius: 3,
          backgroundColor: color,
          opacity: 0.3,
          top: s * 0.1,
          left: s * 0.18,
        }}
      />
      {/* Middle card */}
      <View
        style={{
          position: 'absolute',
          width: cardWidth,
          height: cardHeight,
          borderRadius: 3,
          backgroundColor: color,
          opacity: 0.6,
          top: s * 0.2,
          left: s * 0.14,
        }}
      />
      {/* Front card */}
      <View
        style={{
          position: 'absolute',
          width: cardWidth,
          height: cardHeight,
          borderRadius: 3,
          backgroundColor: color,
          opacity: focused ? 1 : 0.85,
          top: s * 0.3,
          left: s * 0.1,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
