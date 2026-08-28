import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { reservationId, ticketCount, selectedSeats, total, showtimeId, movieTitle } = route.params;

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    if (!cardName.trim() || !cardNumber.trim() || !expiry.trim() || !cvv.trim()) {
      Alert.alert('Completa todos los campos', 'Necesitamos los datos del pago para continuar.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const ticketId = `TKT-${Date.now()}`;
      const signature = `sig_${Math.random().toString(36).slice(2, 12)}`;

      navigation.navigate('Ticket', {
        ticketId,
        signature,
        movieTitle,
        selectedSeats,
      });
    }, 1400);
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
          <Text style={styles.sectionLabel}>Resumen</Text>
          <Text style={styles.movieTitle}>{movieTitle}</Text>
          <Text style={styles.summaryText}>Reserva: {reservationId}</Text>
          <Text style={styles.summaryText}>Butacas: {selectedSeats.join(', ')}</Text>
          <Text style={styles.summaryText}>Entradas: {ticketCount}</Text>
          <Text style={styles.priceText}>Total: €{total.toFixed(2)}</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionLabel}>Pago seguro</Text>

          <TextInput
            style={styles.input}
            value={cardName}
            onChangeText={setCardName}
            placeholder="Nombre del titular"
            placeholderTextColor="#94a3b8"
          />
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder="Número de tarjeta"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
          />

          <View style={styles.inlineRow}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={expiry}
              onChangeText={setExpiry}
              placeholder="MM/AA"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              value={cvv}
              onChangeText={setCvv}
              placeholder="CVV"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              secureTextEntry
            />
          </View>

          <Pressable style={styles.payButton} onPress={handlePayment} disabled={isProcessing}>
            <Text style={styles.payText}>{isProcessing ? 'Procesando pago...' : 'Pagar ahora'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020817',
  },
  container: {
    padding: 16,
    backgroundColor: '#020817',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 12,
  },
  summaryCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
    marginBottom: 20,
  },
  sectionLabel: {
    color: '#f9a8d4',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 8,
  },
  movieTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
  },
  summaryText: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 8,
  },
  priceText: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
  },
  formCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
  },
  input: {
    backgroundColor: '#0b1220',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 15,
    marginBottom: 12,
  },
  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  payButton: {
    backgroundColor: '#e11d48',
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 8,
  },
  payText: {
    textAlign: 'center',
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
