import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CatalogMovie, getCatalog } from '../api/client';

const categories = ['Todos', 'CINE', 'TEATRO', 'CONCIERTO'];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [movies, setMovies] = useState<CatalogMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getCatalog();
      setMovies(response.movies);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la cartelera.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchesCategory = category === 'Todos' || movie.category === category;
      const matchesSearch =
        movie.title.toLowerCase().includes(search.toLowerCase()) ||
        movie.synopsis.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  const formatShowtime = (startTime: string) => {
    const date = new Date(startTime);
    return date.toLocaleString('es-ES', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.overline}>Centro cultural</Text>
            <Text style={styles.title}>Ochoymedio</Text>
          </View>
          <Pressable style={styles.avatar}>
            <Text style={styles.avatarText}>OM</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar evento o película"
          placeholderTextColor="#94a3b8"
        />

        <View style={styles.filters}>
          {categories.map((item) => (
            <Pressable
              key={item}
              style={[styles.chip, category === item && styles.chipSelected]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.chipText, category === item && styles.chipTextSelected]}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.heroCard}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTag}>Estreno destacado</Text>
            <Text style={styles.heroTitle}>Noche de estreno</Text>
            <Text style={styles.heroDescription}>3 películas, 2 obras y un concierto esta semana.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Cartelera disponible</Text>

        {loading && (
          <View style={styles.stateContainer}>
            <ActivityIndicator color="#f43f5e" size="large" />
            <Text style={styles.stateText}>Cargando cartelera...</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.stateContainer}>
            <Text style={styles.stateTitle}>No pudimos cargar los eventos</Text>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => void loadCatalog()}>
              <Text style={styles.buyText}>Reintentar</Text>
            </Pressable>
          </View>
        )}

        {!loading && !error && filteredMovies.length === 0 && (
          <View style={styles.stateContainer}>
            <Text style={styles.stateTitle}>No hay eventos para esta búsqueda</Text>
            <Text style={styles.stateText}>Prueba con otra categoría o término.</Text>
          </View>
        )}

        {!loading && !error && filteredMovies.map((movie) => {
          const showtime = movie.showtimes[0];
          const price = Number(showtime?.price ?? 0);

          return (
          <Pressable
            key={movie.id}
            style={styles.card}
            disabled={!showtime}
            onPress={() =>
              navigation.navigate('SeatSelection', {
                movieTitle: movie.title,
                showtimeId: showtime.id,
                price,
              })
            }
          >
            <Image source={{ uri: movie.posterUrl }} style={styles.poster} />
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <Text style={styles.rating}>★ {movie.rating ?? '-'}</Text>
              </View>
              <Text style={styles.meta}>{movie.category} • {movie.duration} min</Text>
              <Text style={styles.meta}>{showtime ? `${formatShowtime(showtime.startTime)} • ${showtime.room.name}` : 'Sin funciones disponibles'}</Text>
              <Text style={styles.synopsis}>{movie.synopsis}</Text>
              <View style={styles.footer}>
                <Text style={styles.price}>Desde €{price.toFixed(2)}</Text>
                <Pressable
                  style={styles.buyButton}
                  disabled={!showtime}
                  onPress={() =>
                    navigation.navigate('SeatSelection', {
                      movieTitle: movie.title,
                      showtimeId: showtime.id,
                      price,
                    })
                  }
                >
                  <Text style={styles.buyText}>Reservar</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020817' },
  container: { flex: 1, backgroundColor: '#020817', paddingHorizontal: 16, paddingTop: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  overline: { color: '#f472b6', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { color: '#f8fafc', fontSize: 30, fontWeight: '800' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#e11d48', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700' },
  searchInput: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    color: '#f8fafc',
    marginBottom: 14,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  chip: {
    backgroundColor: '#111827',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipSelected: { backgroundColor: '#e11d48', borderColor: '#f43f5e' },
  chipText: { color: '#cbd5e1', fontSize: 13, fontWeight: '600' },
  chipTextSelected: { color: '#fff' },
  heroCard: { height: 180, borderRadius: 18, overflow: 'hidden', marginBottom: 22, backgroundColor: '#111827' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroTag: { color: '#f9a8d4', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },
  heroDescription: { color: '#e2e8f0', fontSize: 13, marginTop: 6, width: '75%' },
  sectionTitle: { color: '#f8fafc', fontSize: 22, fontWeight: '700', marginBottom: 16 },
  card: { flexDirection: 'row', backgroundColor: '#0f172a', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#1e293b', marginBottom: 18 },
  poster: { width: 112, height: 190 },
  cardContent: { flex: 1, padding: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  movieTitle: { flex: 1, color: '#f8fafc', fontSize: 18, fontWeight: '700', marginRight: 8 },
  rating: { color: '#fbbf24', fontSize: 13, fontWeight: '700' },
  meta: { color: '#cbd5e1', fontSize: 12, marginTop: 4 },
  synopsis: { color: '#94a3b8', fontSize: 12, lineHeight: 18, marginTop: 10, marginBottom: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  price: { color: '#f8fafc', fontSize: 16, fontWeight: '800' },
  buyButton: { backgroundColor: '#e11d48', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  buyText: { color: '#fff', fontWeight: '700' },
  stateContainer: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  stateTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  stateText: { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryButton: { backgroundColor: '#e11d48', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, marginTop: 16 },
});
