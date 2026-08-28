import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function TicketScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { ticketId, signature, movieTitle, selectedSeats } = route.params;
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
          <View style={styles.qrBox}><Text style={styles.qrText}>QR</Text></View>
          <Text style={styles.info}>Ticket ID: {ticketId}</Text>
          <Text style={styles.info}>Signature: {signature}</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020817' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#020817' },
  homeButton: { position: 'absolute', top: 50, left: 20, backgroundColor: '#111827', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  homeText: { color: '#fff', fontWeight: '700' },
  ticketCard: { width: '100%', maxWidth: 420, backgroundColor: '#0f172a', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#f43f5e', shadowColor: '#f43f5e', shadowOffset: { width: 0, height: 0 }, shadowRadius: 30, elevation: 12 },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, backgroundColor: '#f43f5e', opacity: 0.1 },
  badge: { color: '#f9a8d4', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: 10 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: '800', marginBottom: 10 },
  subtitle: { color: '#cbd5e1', fontSize: 15, marginBottom: 18 },
  qrBox: { backgroundColor: '#e2e8f0', alignSelf: 'center', width: 180, height: 180, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  qrText: { color: '#111827', fontSize: 52, fontWeight: '800' },
  info: { color: '#f8fafc', fontSize: 14, marginBottom: 8 },
});
