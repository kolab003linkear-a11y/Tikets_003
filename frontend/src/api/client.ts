const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.100.8:4000').replace(/\/$/, '');

export type CatalogShowtime = {
  id: string;
  startTime: string;
  price: number | string;
  availableSeats: number;
  room: {
    id: string;
    name: string;
    capacity: number;
    seatLayout: unknown;
  };
};

export type CatalogMovie = {
  id: string;
  title: string;
  synopsis: string;
  duration: number;
  category: 'CINE' | 'TEATRO' | 'CONCIERTO';
  posterUrl: string;
  trailerUrl: string | null;
  rating: number | string | null;
  status: 'NOW_SHOWING' | 'COMING_SOON';
  showtimes: CatalogShowtime[];
};

export type CatalogResponse = {
  movies: CatalogMovie[];
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.error ?? `Error ${response.status} al consultar el servidor.`;
    throw new Error(message);
  }

  return payload as T;
}

export function getCatalog() {
  return request<CatalogResponse>('/api/catalog');
}

export { API_BASE_URL };
