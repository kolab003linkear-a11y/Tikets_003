import React, { useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { confirmDemoPayment } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { token } = useAuth();
  const { reservationId, ticketCount, selectedSeats, total, showtimeId, movieTitle } = route.params;
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    if (!cardName.trim() || !cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
      Alert.alert('Completa todos los campos');
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
      const response = await confirmDemoPayment(token, reservationId);
      const ticket = response.reservation.tickets[0];
      if (!ticket) throw new Error('El pago fue confirmado, pero no se recibió el ticket.');

      navigation.navigate('Ticket', {
        ticketId: ticket.id,
        signature: ticket.qrCodeHash,
        movieTitle,
        selectedSeats,
      });
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : 'No se pudo confirmar el pago.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <Text style={styles.title}>Checkout</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.label}>Resumen</Text>
          <Text style={styles.movieTitle}>{movieTitle}</Text>
          <Text style={styles.text}>Reserva: {reservationId}</Text>
          <Text style={styles.text}>Butacas: {selectedSeats.join(', ')}</Text>
          <Text style={styles.text}>Entradas: {ticketCount}</Text>
          <Text style={styles.total}>Total: €{total.toFixed(2)}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Pago seguro</Text>
          <TextInput style={styles.input} value={cardName} onChangeText={setCardName} placeholder="Nombre del titular" placeholderTextColor="#94a3b8" />
          <TextInput style={styles.input} value={cardNumber} onChangeText={setCardNumber} placeholder="Número de tarjeta" placeholderTextColor="#94a3b8" keyboardType="numeric" />
          <View style={styles.inlineRow}>
            <TextInput style={[styles.input, styles.half]} value={expiry} onChangeText={setExpiry} placeholder="MM/AA" placeholderTextColor="#94a3b8" keyboardType="numeric" />
            <TextInput style={[styles.input, styles.half]} value={cvv} onChangeText={setCvv} placeholder="CVV" placeholderTextColor="#94a3b8" keyboardType="numeric" secureTextEntry />
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.payButton} onPress={() => void pay()} disabled={processing}>
            <Text style={styles.payText}>{processing ? 'Procesando pago...' : 'Pagar ahora'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 24, fontWeight: '700' },
  title: { color: colors.text, fontSize: 24, fontWeight: '700', marginLeft: 12, fontFamily: typography.display },
  summaryCard: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 20 },
  label: { color: colors.primary, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700', marginBottom: 8 },
  movieTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 10 },
  text: { color: colors.textSecondary, fontSize: 14, marginBottom: 8 },
  total: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 12 },
  formCard: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 18 },
  input: { backgroundColor: colors.input, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 15, marginBottom: 12 },
  inlineRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  half: { flex: 1 },
  payButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15, marginTop: 8 },
  payText: { textAlign: 'center', color: colors.text, fontWeight: '800', fontSize: 16 },
  error: { color: colors.critical, fontSize: 13, lineHeight: 19, marginBottom: 10 },
});
