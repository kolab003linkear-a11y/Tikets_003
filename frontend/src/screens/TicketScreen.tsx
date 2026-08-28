import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { colors, typography } from '../theme';

export default function TicketScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { ticketId, qrPayload, status = 'VALID', movieTitle, selectedSeats, startTime, roomName } = route.params;
  const scale = useRef(new Animated.Value(0.9)).current;
  const glow = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.3, duration: 1200, useNativeDriver: true }),
        ]),
      ),
    ]).start();
  }, [glow, scale]);

  const formattedDate = startTime
    ? new Date(startTime).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Horario pendiente';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Pressable style={styles.homeButton} onPress={() => navigation.popToTop()}>
          <Text style={styles.homeText}>Inicio</Text>
        </Pressable>

        <Animated.View style={[styles.ticketCard, { transform: [{ scale }], shadowOpacity: glow }]}> 
          <Animated.View style={[styles.glow, { opacity: glow }]} />
          <Text style={styles.badge}>Entrada digital</Text>
          <Text style={styles.title}>{movieTitle}</Text>
          <Text style={styles.subtitle}>Butacas: {selectedSeats.join(', ')}</Text>
          <Text style={styles.accessStatus}>ACCESO AUTORIZADO · {status}</Text>
          <View style={styles.qrBox} accessibilityLabel="Código QR de la entrada">
            <QRCode value={qrPayload ?? ticketId} size={156} color={colors.background} backgroundColor={colors.text} />
          </View>
          <Text style={styles.eventInfo}>{formattedDate}</Text>
          <Text style={styles.eventInfo}>{roomName ?? 'Sala pendiente'}</Text>
          <Text style={styles.info}>Ticket ID: {ticketId}</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.background },
  homeButton: { position: 'absolute', top: 50, left: 20, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  homeText: { color: colors.text, fontWeight: '700' },
  ticketCard: { width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: colors.success, shadowColor: colors.success, shadowOffset: { width: 0, height: 0 }, shadowRadius: 30, elevation: 12 },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, backgroundColor: colors.success, opacity: 0.1 },
  badge: { color: colors.success, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: 10 },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', marginBottom: 10, fontFamily: typography.display },
  subtitle: { color: colors.textSecondary, fontSize: 15, marginBottom: 18 },
  qrBox: { backgroundColor: colors.text, alignSelf: 'center', width: 180, height: 180, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  accessStatus: { color: colors.success, fontSize: 12, fontWeight: '800', marginBottom: 12 },
  eventInfo: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 5 },
  info: { color: colors.text, fontSize: 14, marginBottom: 8 },
});
