import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type AppStateProps = {
  title: string;
  message?: string;
  loading?: boolean;
};

export default function AppState({ title, message, loading = false }: AppStateProps) {
  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      {loading && <ActivityIndicator color={colors.primary} size="large" />}
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 36, gap: 8 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  message: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
