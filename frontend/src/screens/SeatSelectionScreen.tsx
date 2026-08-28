import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const cols = Array.from({ length: 8 }, (_, index) => index + 1);
const occupied = ['A1', 'A5', 'B2', 'B7', 'C4', 'D6', 'E1', 'E8', 'F3', 'G5', 'H2', 'H7'];

export default function SeatSelectionScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { showtimeId, movieTitle, price } = route.params;
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      Alert.alert('Tiempo agotado', 'La reserva ha expirado. Vuelve a seleccionar función.', [
        { text: 'Volver', onPress: () => navigation.goBack() },
      ]);
    }
  }, [timeLeft, navigation]);

  const seatData = useMemo(
    () =>
      rows.flatMap((row) =>
        cols.map((column) => {
          const code = `${row}${column}`;
          return { code, available: !occupied.includes(code) };
        }),
      ),
    [],
  );

  const toggleSeat = (seatCode: string) => {
    if (occupied.includes(seatCode)) return;
    setSelectedSeats((current) => {
      if (current.includes(seatCode)) return current.filter((seat) => seat !== seatCode);
      return [...current, seatCode].sort((a, b) => a.localeCompare(b));
    });
  };

  const total = selectedSeats.length * price;

  const goToCheckout = () => {
    if (selectedSeats.length === 0) {
      Alert.alert('Selecciona al menos una butaca');
      return;
    }

    navigation.navigate('Checkout', {
      reservationId: `RES-${Date.now()}`,
      selectedSeats,
      ticketCount: selectedSeats.length,
      total,
      showtimeId,
      movieTitle,
    });
  };

  const min = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const sec = String(timeLeft % 60).padStart(2, '0');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.subtitle}>Reserva activa</Text>
            <Text style={styles.title}>{movieTitle}</Text>
          </View>
          <View style={styles.timerBox}>
            <Text style={styles.timerLabel}>05:00</Text>
            <Text style={styles.timerValue}>{min}:{sec}</Text>
          </View>
        </View>

        <View style={styles.stagePanel}>
          <View style={styles.stage} />
          <View style={styles.grid}>
            {rows.map((row) => (
              <View key={row} style={styles.row}>
                <Text style={styles.rowLabel}>{row}</Text>
                {cols.map((column) => {
                  const seatCode = `${row}${column}`;
                  const isSelected = selectedSeats.includes(seatCode);
                  const isOccupied = occupied.includes(seatCode);
                  return (
                    <Pressable
                      key={seatCode}
                      onPress={() => toggleSeat(seatCode)}
                      style={[styles.seat, isSelected && styles.selectedSeat, isOccupied && styles.occupiedSeat]}
                    >
                      <Text style={styles.seatText}>{column}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.dot, styles.availableDot]} /><Text style={styles.legendText}>Disponible</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, styles.occupiedDot]} /><Text style={styles.legendText}>Ocupada</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, styles.selectedDot]} /><Text style={styles.legendText}>Seleccionada</Text></View>
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Butacas</Text><Text style={styles.summaryValue}>{selectedSeats.length ? selectedSeats.join(', ') : 'Ninguna'}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Total</Text><Text style={styles.summaryValue}>€{total.toFixed(2)}</Text></View>
          <Pressable style={styles.button} onPress={goToCheckout}>
            <Text style={styles.buttonText}>Continuar al pago</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020817' },
  container: { padding: 16, backgroundColor: '#020817' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  backButton: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#f9a8d4', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  timerBox: { backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginLeft: 10 },
  timerLabel: { color: '#cbd5e1', fontSize: 10, textAlign: 'center' },
  timerValue: { color: '#f8fafc', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  stagePanel: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 18, marginBottom: 18 },
  stage: { height: 24, backgroundColor: '#38bdf8', borderRadius: 999, width: '100%', marginBottom: 16, shadowColor: '#38bdf8', shadowOpacity: 0.6, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
  grid: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  rowLabel: { width: 18, color: '#cbd5e1', textAlign: 'center', fontWeight: '700' },
  seat: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  selectedSeat: { backgroundColor: '#f43f5e', borderColor: '#fb7185' },
  occupiedSeat: { backgroundColor: '#475569', borderColor: '#64748b' },
  seatText: { color: '#f8fafc', fontSize: 10, fontWeight: '700' },
  legend: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 4 },
  availableDot: { backgroundColor: '#1e293b' },
  occupiedDot: { backgroundColor: '#475569' },
  selectedDot: { backgroundColor: '#f43f5e' },
  legendText: { color: '#cbd5e1', fontSize: 12 },
  summary: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 18 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: '#cbd5e1', fontSize: 14 },
  summaryValue: { color: '#f8fafc', fontSize: 14, fontWeight: '700', flexShrink: 1 },
  button: { marginTop: 12, backgroundColor: '#e11d48', borderRadius: 12, paddingVertical: 14 },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: '800', fontSize: 16 },
});
