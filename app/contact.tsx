/**
 * Contact Screen
 *
 * In-app form that composes a pre-filled email to the support address.
 * Category + message → opens the device mail app via Linking.
 * No backend required.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Colors, FontSizes, FontWeights, Fonts,
  Spacing, Radii, Shadows, TouchTarget,
} from '@/constants/theme';
import { Strings } from '@/constants/strings';
import { CONTACT_EMAIL } from '@/constants/pro';

type Category = 'bug' | 'feedback' | 'suggestion';

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'bug',        label: Strings.contact.categoryBug },
  { value: 'feedback',   label: Strings.contact.categoryFeedback },
  { value: 'suggestion', label: Strings.contact.categorySuggestion },
];

export default function ContactScreen() {
  const navigation = useNavigation();
  const [category, setCategory] = useState<Category>('feedback');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: Strings.contact.title });
  }, [navigation]);

  const handleSubmit = async () => {
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    try {
      const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label ?? category;
      const subject = encodeURIComponent(Strings.contact.emailSubject(categoryLabel));
      const body = encodeURIComponent(message.trim());
      const url = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert(Strings.contact.noMailApp, Strings.contact.noMailAppBody);
        return;
      }
      await Linking.openURL(url);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = message.trim().length > 0 && !submitting;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Category */}
          <Text style={styles.label}>{Strings.contact.categoryLabel}</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map(({ value, label }) => {
              const selected = category === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                  onPress={() => setCategory(value)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Message */}
          <Text style={styles.label}>{Strings.contact.messageLabel}</Text>
          <View style={styles.textAreaCard}>
            <TextInput
              style={styles.textArea}
              value={message}
              onChangeText={setMessage}
              placeholder={Strings.contact.messagePlaceholder}
              placeholderTextColor={Colors.textTertiary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              autoCapitalize="sentences"
              selectionColor={Colors.accent}
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel={Strings.contact.submit}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? Strings.common.loading : Strings.contact.submit}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },

  label: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },

  // Category selector
  categoryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  categoryChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
    ...Shadows.card,
  },
  categoryChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentLight,
  },
  categoryChipText: {
    fontSize: FontSizes.sm,
    fontFamily: Fonts.sans,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  categoryChipTextSelected: {
    color: Colors.accent,
    fontWeight: FontWeights.semibold,
  },

  // Message input
  textAreaCard: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  textArea: {
    padding: Spacing.base,
    fontSize: FontSizes.base,
    fontFamily: Fonts.sans,
    color: Colors.text,
    minHeight: 160,
  },

  // Submit
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    minHeight: TouchTarget,
    justifyContent: 'center',
    ...Shadows.card,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    color: Colors.card,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    fontFamily: Fonts.sans,
  },
});
