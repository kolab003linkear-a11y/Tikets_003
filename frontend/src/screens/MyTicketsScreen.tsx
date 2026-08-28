import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getMyTickets, TicketDetails } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { colors, typography } from '../theme';

export default function MyTicketsScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const [tickets, setTickets] = useState<TicketDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getMyTickets(token);
      setTickets(response.tickets);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar tus tickets.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const openTicket = (ticket: TicketDetails) => {
    navigation.navigate('Ticket', {
      ticketId: ticket.id,
      qrPayload: ticket.qrPayload,
      status: ticket.status,
      movieTitle: ticket.event.title,
      selectedSeats: [ticket.seatNumber],
      startTime: ticket.event.startTime,
      roomName: ticket.event.room,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.container}
        data={tickets}
        keyExtractor={(ticket) => ticket.id}
        onRefresh={() => void loadTickets()}
        refreshing={loading}
        ListHeaderComponent={<><Text style={styles.overline}>Tu cuenta</Text><Text style={styles.title}>Mis Tickets</Text><Text style={styles.subtitle}>Entradas listas para validar en la sala.</Text></>}
        ListEmptyComponent={!loading ? <View style={styles.state}><Text style={styles.stateTitle}>{error ? 'No pudimos cargar tus entradas' : 'Todavía no tienes tickets'}</Text><Text style={styles.stateText}>{error ?? 'Tus entradas confirmadas aparecerán aquí.'}</Text>{error && <Pressable style={styles.retry} onPress={() => void loadTickets()}><Text style={styles.retryText}>Reintentar</Text></Pressable>}</View> : <View style={styles.state}><ActivityIndicator color={colors.primary} /></View>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openTicket(item)}>
            <View style={styles.cardHeader}><Text style={styles.movieTitle}>{item.event.title}</Text><Text style={styles.status}>{item.status}</Text></View>
            <Text style={styles.meta}>Butaca {item.seatNumber} · {item.event.room}</Text>
            <Text style={styles.meta}>{new Date(item.event.startTime).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</Text>
            <Text style={styles.open}>Ver código QR</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, backgroundColor: colors.background, flexGrow: 1 },
  overline: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', fontFamily: typography.display, marginTop: 4 },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 8, marginBottom: 20 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  movieTitle: { color: colors.text, fontSize: 18, fontWeight: '700', flex: 1 },
  status: { color: colors.success, fontSize: 11, fontWeight: '800' },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 7 },
  open: { color: colors.primary, fontSize: 13, fontWeight: '800', marginTop: 14 },
  state: { alignItems: 'center', paddingVertical: 42, paddingHorizontal: 20 },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  stateText: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retry: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, marginTop: 16 },
  retryText: { color: colors.text, fontWeight: '800' },
});
