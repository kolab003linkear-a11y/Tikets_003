import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';

export default function ProfileScreen() {
  const { user, updateProfile, signOut } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEmail(user?.email ?? '');
  }, [user?.email]);

  const save = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) {
      Alert.alert('ERROR: correo no válido', 'Escribe un correo electrónico válido.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(normalizedEmail);
      Alert.alert('PERFIL ACTUALIZADO', 'Tu correo se guardó correctamente.');
    } catch (error) {
      Alert.alert('ERROR: no se pudo guardar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.overline}>Tu cuenta</Text>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>Administra tus datos y tu acceso a TicketSafe.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.meta}>Rol actual: {user?.role ?? 'CLIENT'}</Text>
          <Pressable style={[styles.primaryButton, saving && styles.disabled]} onPress={() => void save()} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.text} /> : <Text style={styles.buttonText}>Guardar cambios</Text>}
          </Pressable>
        </View>

        <Pressable style={styles.logoutButton} onPress={() => void signOut()}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  overline: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', fontFamily: typography.display, marginTop: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 22 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 18 },
  label: { color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { height: 50, backgroundColor: colors.input, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 12, color: colors.text, paddingHorizontal: 14 },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 12 },
  primaryButton: { minHeight: 48, backgroundColor: colors.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  disabled: { opacity: 0.65 },
  buttonText: { color: colors.text, fontWeight: '800' },
  logoutButton: { alignSelf: 'center', borderColor: colors.critical, borderWidth: 1, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, marginTop: 22 },
  logoutText: { color: colors.critical, fontWeight: '800' },
});
