import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [registerMode, setRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError('Completa tu correo y contraseña.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (registerMode) await signUp(normalizedEmail, password);
      else await signIn(normalizedEmail, password);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'No se pudo completar la operación.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>OM</Text></View>
        <Text style={styles.overline}>Centro cultural</Text>
        <Text style={styles.title}>Ochoymedio</Text>
        <Text style={styles.subtitle}>{registerMode ? 'Crea tu cuenta para reservar tus entradas.' : 'Inicia sesión para continuar.'}</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            placeholderTextColor="#64748b"
          />
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor="#64748b"
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={[styles.primaryButton, busy && styles.disabled]} onPress={() => void submit()} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{registerMode ? 'Crear cuenta' : 'Iniciar sesión'}</Text>}
          </Pressable>
        </View>

        <Pressable onPress={() => { setRegisterMode((mode) => !mode); setError(null); }}>
          <Text style={styles.switchText}>{registerMode ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020817' },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  brandMark: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#e11d48', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  brandMarkText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  overline: { color: '#f472b6', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: '#f8fafc', fontSize: 34, fontWeight: '800', marginTop: 4 },
  subtitle: { color: '#94a3b8', fontSize: 15, lineHeight: 22, marginTop: 10, marginBottom: 30 },
  form: { backgroundColor: '#0f172a', borderColor: '#1e293b', borderWidth: 1, borderRadius: 18, padding: 18 },
  label: { color: '#cbd5e1', fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 4 },
  input: { height: 50, backgroundColor: '#0b1220', borderColor: '#334155', borderWidth: 1, borderRadius: 12, color: '#f8fafc', paddingHorizontal: 14, marginBottom: 14 },
  error: { color: '#fda4af', fontSize: 13, lineHeight: 19, marginBottom: 12 },
  primaryButton: { minHeight: 50, backgroundColor: '#e11d48', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  disabled: { opacity: 0.65 },
  primaryText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  switchText: { color: '#f9a8d4', fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 22 },
});
