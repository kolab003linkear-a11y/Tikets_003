import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useAuth } from '../auth/AuthContext';
import { validateTicket } from '../api/client';
import { colors, typography } from '../theme';

export default function AdminScannerScreen() {
  const { user, token } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
  const [lastResult, setLastResult] = useState<string>('');

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'SCANNER')) {
      BarCodeScanner.requestPermissionsAsync().then(({ status }) => {
        setHasPermission(status === 'granted');
      }).catch(() => setHasPermission(false));
    }
  }, [user]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SCANNER')) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Acceso restringido</Text>
          <Text style={styles.body}>Necesitas un rol de administrador o escáner para usar esta pantalla.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Solicitando permiso</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Cámara no disponible</Text>
          <Text style={styles.body}>No se pudo acceder a la cámara del dispositivo.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleScan = async ({ data }: { data: string }) => {
    if (!token) {
      Alert.alert('Sesión expirada', 'Inicia sesión otra vez.');
      return;
    }

    setScanning(false);
    try {
      const response = await validateTicket(token, data);
      setLastResult(`${response.status}: ${response.message}`);
      Alert.alert(response.valid ? 'Entrada validada' : 'Resultado de validación', response.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo validar el ticket.';
      setLastResult(`ERROR: ${message}`);
      Alert.alert('Error', message);
    } finally {
      setTimeout(() => setScanning(true), 1500);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.overline}>Panel administrativo</Text>
        <Text style={styles.title}>Escáner QR</Text>

        <View style={styles.cameraFrame}>
          {scanning ? (
            <BarCodeScanner
              onBarCodeScanned={handleScan}
              style={StyleSheet.absoluteFillObject}
            />
          ) : (
            <View style={styles.centeredOverlay}>
              <Text style={styles.scanningText}>Validando...</Text>
            </View>
          )}
        </View>

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>Último resultado</Text>
          <Text style={styles.resultValue}>{lastResult || 'Esperando lectura...'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  overline: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 6, fontFamily: typography.display },
  body: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 10 },
  cameraFrame: {
    width: '100%',
    height: 420,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginTop: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  centeredOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(10, 37, 64, 0.75)' },
  scanningText: { color: colors.text, fontSize: 18, fontWeight: '700' },
  resultBox: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 16,
  },
  resultLabel: { color: colors.textSecondary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  resultValue: { color: colors.text, fontSize: 15, marginTop: 8, fontWeight: '600' },
});
