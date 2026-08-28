import React, { useMemo, useState } from 'react';
import {
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

interface FeatureMovie {
  id: string;
  title: string;
  category: 'CINE' | 'TEATRO' | 'CONCIERTO';
  rating: number;
  poster: string;
  runtime: string;
  date: string;
  price: number;
  showtimeId: string;
  synopsis: string;
}

const mockMovies: FeatureMovie[] = [
  {
    id: '1',
    title: 'La sombra de la luna',
    category: 'CINE',
    rating: 8.9,
    poster:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1200&q=80',
    runtime: '112 min',
    date: 'Hoy, 20:30',
    price: 16.5,
    showtimeId: 'show_001',
    synopsis: 'Un thriller íntimo sobre identidad y memoria en una ciudad costera.',
  },
  {
    id: '2',
    title: 'Sonora de humo',
    category: 'CONCIERTO',
    rating: 9.1,
    poster:
      'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    runtime: '95 min',
    date: 'Mañana, 19:00',
    price: 24.0,
    showtimeId: 'show_002',
    synopsis: 'Una noche de jazz y electrónica en la sala principal del centro cultural.',
  },
  {
    id: '3',
    title: 'La última línea',
    category: 'TEATRO',
    rating: 8.7,
    poster:
      'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80',
    runtime: '130 min',
    date: 'Sábado, 21:15',
    price: 18.0,
    showtimeId: 'show_003',
    synopsis: 'Una pieza contemporánea sobre el poder, la corrupción y la culpa.',
  },
];

const categories = ['Todos', 'CINE', 'TEATRO', 'CONCIERTO'];

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const filteredMovies = useMemo(() => {
    return mockMovies.filter((movie) => {
      const matchesCategory =
        selectedCategory === 'Todos' || movie.category === selectedCategory;
      const matchesSearch =
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.synopsis.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.overline}>Centro cultural</Text>
            <Text style={styles.title}>Ochoymedio</Text>
          </View>
          <Pressable style={styles.avatarButton}>
            <Text style={styles.avatarText}>OM</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrapper}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholder="Buscar película, obra o evento"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.filtersContainer}>
          {categories.map((category) => (
            <Pressable
              key={category}
              style={[
                styles.filterChip,
                selectedCategory === category && styles.filterChipSelected,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === category && styles.filterTextSelected,
                ]}
              >
                {category}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.heroCard}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
            }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTag}>Estreno destacado</Text>
            <Text style={styles.heroTitle}>Noche de estreno</Text>
            <Text style={styles.heroDescription}>
              3 películas, 2 obras de teatro y un concierto en vivo esta semana.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Cartelera disponible</Text>

        {filteredMovies.map((movie) => (
          <Pressable
            key={movie.id}
            style={styles.movieCard}
            onPress={() =>
              navigation.navigate('SeatSelection', {
                showtimeId: movie.showtimeId,
                movieTitle: movie.title,
                price: movie.price,
              })
            }
          >
            <Image source={{ uri: movie.poster }} style={styles.posterImage} />
            <View style={styles.movieContent}>
              <View style={styles.movieHeader}>
                <Text style={styles.movieTitle}>{movie.title}</Text>
                <Text style={styles.movieRating}>★ {movie.rating}</Text>
              </View>

              <Text style={styles.movieMeta}>{movie.category} • {movie.runtime}</Text>
              <Text style={styles.movieMeta}>{movie.date}</Text>
              <Text style={styles.movieSynopsis}>{movie.synopsis}</Text>

              <View style={styles.movieFooter}>
                <Text style={styles.moviePrice}>Desde €{movie.price.toFixed(2)}</Text>
                <Pressable
                  style={styles.buyButton}
                  onPress={() =>
                    navigation.navigate('SeatSelection', {
                      showtimeId: movie.showtimeId,
                      movieTitle: movie.title,
                      price: movie.price,
                    })
                  }
                >
                  <Text style={styles.buyText}>Reservar</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        ))}
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
    flex: 1,
    backgroundColor: '#020817',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overline: {
    color: '#f472b6',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  title: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '800',
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
  },
  searchWrapper: {
    marginBottom: 14,
  },
  searchInput: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 12,
    color: '#f8fafc',
    height: 48,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  filterChipSelected: {
    backgroundColor: '#e11d48',
    borderColor: '#f43f5e',
  },
  filterText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextSelected: {
    color: '#fff',
  },
  heroCard: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 180,
    marginBottom: 22,
    backgroundColor: '#111827',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  heroTag: {
    color: '#f9a8d4',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroDescription: {
    color: '#e2e8f0',
    fontSize: 13,
    width: '75%',
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  movieCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    flexDirection: 'row',
  },
  posterImage: {
    width: 112,
    height: 190,
    resizeMode: 'cover',
  },
  movieContent: {
    flex: 1,
    padding: 14,
  },
  movieHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  movieTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  movieRating: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '700',
  },
  movieMeta: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 4,
  },
  movieSynopsis: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 12,
  },
  movieFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  moviePrice: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  buyButton: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buyText: {
    color: '#fff',
    fontWeight: '700',
  },
});
