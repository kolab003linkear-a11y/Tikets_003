const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.100.8:4000').replace(/\/$/, '');

export type CatalogShowtime = {
  id: string;
  startTime: string;
  price: number | string;
  availableSeats: number;
  occupiedSeats: string[];
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

export type AuthUser = {
  id: string;
  email: string;
  role: 'CLIENT' | 'ADMIN' | 'SCANNER';
  createdAt: string;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export type ReservationResponse = {
  success: boolean;
  reservation: {
    id: string;
    expiresAt: string | null;
  };
  tickets: Array<{
    id: string;
    seatNumber: string;
    qrCodeHash: string;
  }>;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
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

export function login(email: string, password: string) {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(email: string, password: string) {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, role: 'CLIENT' }),
  });
}

export function createReservation(token: string, userId: string, showtimeId: string, seatNumbers: string[]) {
  return request<ReservationResponse>('/api/reservations/create', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId, showtimeId, seatNumbers }),
  });
}

export { API_BASE_URL };
