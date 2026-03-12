import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

interface TabIconProps {
  name: string;
  color: string;
  focused: boolean;
  size?: number;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ICON_MAP: Record<string, { filled: IoniconName; outline: IoniconName }> = {
  home:         { filled: 'home',        outline: 'home-outline' },
  'book-open':  { filled: 'book',        outline: 'book-outline' },
  'plus-circle':{ filled: 'add-circle',  outline: 'add-circle-outline' },
  layers:       { filled: 'layers',      outline: 'layers-outline' },
};

export function TabIcon({ name, color, focused, size = 24 }: TabIconProps) {
  const icons = ICON_MAP[name] ?? { filled: 'ellipse', outline: 'ellipse-outline' };
  return <Ionicons name={focused ? icons.filled : icons.outline} size={size} color={color} />;
}
