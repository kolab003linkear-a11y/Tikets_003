import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { AdminEvent, AdminRoom, AdminRoomInput, AdminShowtime, AdminShowtimeInput, createAdminRoom, createAdminShowtime, getAdminEvents, getAdminRooms, getAdminShowtimes, updateAdminRoom, updateAdminShowtime } from '../api/client';
import { colors, typography } from '../theme';

const emptyRoom: AdminRoomInput = { name: '', capacity: 64, seatLayout: { rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], columns: 8 } };
const emptyShowtime: AdminShowtimeInput = { movieId: '', roomId: '', startTime: '', price: 0, availableSeats: 0 };

export default function AdminScheduleScreen() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [showtimes, setShowtimes] = useState<AdminShowtime[]>([]);
  const [roomDraft, setRoomDraft] = useState<AdminRoomInput>(emptyRoom);
  const [showtimeDraft, setShowtimeDraft] = useState<AdminShowtimeInput>(emptyShowtime);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingShowtimeId, setEditingShowtimeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [eventResponse, roomResponse, showtimeResponse] = await Promise.all([getAdminEvents(token), getAdminRooms(token), getAdminShowtimes(token)]);
      setEvents(eventResponse.events);
      setRooms(roomResponse.rooms);
      setShowtimes(showtimeResponse.showtimes);
      setShowtimeDraft((current) => ({ ...current, movieId: current.movieId || eventResponse.events[0]?.id || '', roomId: current.roomId || roomResponse.rooms[0]?.id || '' }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar salas y funciones.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') void loadData();
  }, [token, user?.role]);

  if (!user || user.role !== 'ADMIN') {
    return <SafeAreaView style={styles.safeArea}><View style={styles.centered}><Text style={styles.title}>Acceso restringido</Text></View></SafeAreaView>;
  }

  const saveRoom = async () => {
    if (!token || !roomDraft.name.trim() || roomDraft.capacity < 1) {
      Alert.alert('Datos incompletos', 'Indica nombre y capacidad para la sala.');
      return;
    }
    setSaving(true);
    try {
      const response = editingRoomId ? await updateAdminRoom(token, editingRoomId, roomDraft) : await createAdminRoom(token, roomDraft);
      setRooms((current) => editingRoomId ? current.map((room) => room.id === editingRoomId ? response.room : room) : [...current, response.room]);
      setRoomDraft(emptyRoom);
      setEditingRoomId(null);
    } catch (saveError) {
      Alert.alert('No se pudo guardar la sala', saveError instanceof Error ? saveError.message : 'Revisa los datos.');
    } finally {
      setSaving(false);
    }
  };

  const saveShowtime = async () => {
    if (!token || !showtimeDraft.movieId || !showtimeDraft.roomId || !showtimeDraft.startTime || showtimeDraft.price <= 0) {
      Alert.alert('Datos incompletos', 'Selecciona evento, sala, fecha y precio.');
      return;
    }
    setSaving(true);
    try {
      const response = editingShowtimeId ? await updateAdminShowtime(token, editingShowtimeId, showtimeDraft) : await createAdminShowtime(token, showtimeDraft);
      setShowtimes((current) => editingShowtimeId ? current.map((item) => item.id === editingShowtimeId ? response.showtime : item) : [...current, response.showtime]);
      setShowtimeDraft({ ...emptyShowtime, movieId: events[0]?.id ?? '', roomId: rooms[0]?.id ?? '' });
      setEditingShowtimeId(null);
    } catch (saveError) {
      Alert.alert('No se pudo guardar la función', saveError instanceof Error ? saveError.message : 'Revisa los datos.');
    } finally {
      setSaving(false);
    }
  };

  const editRoom = (room: AdminRoom) => {
    setEditingRoomId(room.id);
    setRoomDraft({ name: room.name, capacity: room.capacity, seatLayout: room.seatLayout });
  };

  const editShowtime = (showtime: AdminShowtime) => {
    setEditingShowtimeId(showtime.id);
    setShowtimeDraft({ movieId: showtime.movie.id, roomId: showtime.room.id, startTime: showtime.startTime.slice(0, 16), price: Number(showtime.price), availableSeats: showtime.availableSeats });
  };

  const selectValue = (label: string, options: Array<{ id: string; name: string }>, selected: string, onSelect: (id: string) => void) => (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionRow}>{options.map((option) => <Pressable key={option.id} style={[styles.option, selected === option.id && styles.optionSelected]} onPress={() => onSelect(option.id)}><Text style={styles.optionText}>{option.name}</Text></Pressable>)}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.overline}>Operación</Text>
        <Text style={styles.title}>Salas y funciones</Text>
        <Text style={styles.subtitle}>Configura la distribución y publica horarios con precio y disponibilidad.</Text>
        {loading ? <ActivityIndicator color={colors.primary} size="large" /> : error ? <Text style={styles.error}>{error}</Text> : <>
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>{editingRoomId ? 'Editar sala' : 'Nueva sala'}</Text>
            <Field label="Nombre" value={roomDraft.name} onChangeText={(value) => setRoomDraft({ ...roomDraft, name: value })} />
            <Field label="Capacidad" value={String(roomDraft.capacity)} keyboardType="numeric" onChangeText={(value) => setRoomDraft({ ...roomDraft, capacity: Number(value) || 0 })} />
            <Field label="Filas (separadas por comas)" value={roomDraft.seatLayout.rows.join(', ')} onChangeText={(value) => setRoomDraft({ ...roomDraft, seatLayout: { ...roomDraft.seatLayout, rows: value.split(',').map((item) => item.trim()).filter(Boolean) } })} />
            <Field label="Columnas" value={String(roomDraft.seatLayout.columns)} keyboardType="numeric" onChangeText={(value) => setRoomDraft({ ...roomDraft, seatLayout: { ...roomDraft.seatLayout, columns: Number(value) || 0 } })} />
            <Pressable style={styles.primaryButton} onPress={() => void saveRoom()} disabled={saving}><Text style={styles.buttonText}>{editingRoomId ? 'Guardar sala' : 'Crear sala'}</Text></Pressable>
          </View>
          {rooms.map((room) => <View style={styles.row} key={room.id}><View style={styles.info}><Text style={styles.rowTitle}>{room.name}</Text><Text style={styles.meta}>{room.capacity} plazas · {room.seatLayout.rows.length} filas x {room.seatLayout.columns} columnas · {room._count?.showtimes ?? 0} funciones</Text></View><Pressable style={styles.editButton} onPress={() => editRoom(room)}><Text style={styles.editText}>Editar</Text></Pressable></View>)}

          <View style={styles.form}>
            <Text style={styles.sectionTitle}>{editingShowtimeId ? 'Editar función' : 'Nueva función'}</Text>
            {selectValue('Evento', events.map((event) => ({ id: event.id, name: event.title })), showtimeDraft.movieId, (movieId) => setShowtimeDraft({ ...showtimeDraft, movieId }))}
            {selectValue('Sala', rooms.map((room) => ({ id: room.id, name: room.name })), showtimeDraft.roomId, (roomId) => setShowtimeDraft({ ...showtimeDraft, roomId }))}
            <Field label="Fecha y hora (ISO)" value={showtimeDraft.startTime} placeholder="2026-09-15T20:00" onChangeText={(value) => setShowtimeDraft({ ...showtimeDraft, startTime: value })} />
            <Field label="Precio" value={String(showtimeDraft.price || '')} keyboardType="decimal-pad" onChangeText={(value) => setShowtimeDraft({ ...showtimeDraft, price: Number(value) || 0 })} />
            <Field label="Disponibilidad" value={String(showtimeDraft.availableSeats || '')} keyboardType="numeric" onChangeText={(value) => setShowtimeDraft({ ...showtimeDraft, availableSeats: Number(value) || 0 })} />
            <Pressable style={styles.primaryButton} onPress={() => void saveShowtime()} disabled={saving}><Text style={styles.buttonText}>{editingShowtimeId ? 'Guardar función' : 'Crear función'}</Text></Pressable>
          </View>
          {showtimes.map((showtime) => <View style={styles.row} key={showtime.id}><View style={styles.info}><Text style={styles.rowTitle}>{showtime.movie.title}</Text><Text style={styles.meta}>{new Date(showtime.startTime).toLocaleString('es-ES')} · {showtime.room.name} · €{Number(showtime.price).toFixed(2)} · {showtime.availableSeats}/{showtime.room.capacity} libres</Text></View><Pressable style={styles.editButton} onPress={() => editShowtime(showtime)}><Text style={styles.editText}>Editar</Text></Pressable></View>)}
        </>}
        <Pressable onPress={() => void loadData()}><Text style={styles.refresh}>Actualizar datos</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return <View><Text style={styles.label}>{label}</Text><TextInput {...props} style={styles.input} placeholderTextColor={colors.textSecondary} /></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { padding: 16, gap: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overline: { color: colors.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 30, fontWeight: '800', fontFamily: typography.display },
  subtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  form: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10, marginTop: 8 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  label: { color: colors.text, fontSize: 12, fontWeight: '700', marginTop: 4 },
  input: { minHeight: 46, backgroundColor: colors.input, borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 10, color: colors.text, paddingHorizontal: 12 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderColor: colors.border, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.text, fontSize: 12, fontWeight: '700' },
  primaryButton: { minHeight: 46, backgroundColor: colors.primary, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  buttonText: { color: colors.text, fontWeight: '800' },
  row: { backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  info: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  meta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  editButton: { borderColor: colors.borderStrong, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  editText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  refresh: { color: colors.primary, textAlign: 'center', fontWeight: '800', paddingVertical: 10 },
  error: { color: colors.critical, fontWeight: '700' },
});
