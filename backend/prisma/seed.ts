import { PrismaClient, UserRole, MovieCategory, EventStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('demo1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ochoymedio.com' },
    update: {},
    create: {
      email: 'admin@ochoymedio.com',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const movie1 = await prisma.movieEvent.upsert({
    where: { id: 'movie-1' },
    update: {},
    create: {
      id: 'movie-1',
      title: 'La sombra de la luna',
      synopsis: 'Un thriller emocional situado en la costa.',
      duration: 112,
      category: MovieCategory.CINE,
      posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c',
      trailerUrl: 'https://example.com/trailer1',
      rating: 8.9,
      status: EventStatus.NOW_SHOWING,
    },
  });

  const movie2 = await prisma.movieEvent.upsert({
    where: { id: 'movie-2' },
    update: {},
    create: {
      id: 'movie-2',
      title: 'Sonora de humo',
      synopsis: 'Una noche de jazz y electrónica en la sala principal.',
      duration: 95,
      category: MovieCategory.CONCIERTO,
      posterUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a',
      trailerUrl: 'https://example.com/trailer2',
      rating: 9.1,
      status: EventStatus.NOW_SHOWING,
    },
  });

  const movie3 = await prisma.movieEvent.upsert({
    where: { id: 'movie-3' },
    update: {},
    create: {
      id: 'movie-3',
      title: 'La última línea',
      synopsis: 'Una pieza contemporánea sobre corrupción y culpa.',
      duration: 130,
      category: MovieCategory.TEATRO,
      posterUrl: 'https://images.unsplash.com/photo-1503095396549-807759245b35',
      trailerUrl: 'https://example.com/trailer3',
      rating: 8.7,
      status: EventStatus.COMING_SOON,
    },
  });

  const room = await prisma.room.upsert({
    where: { id: 'room-1' },
    update: {},
    create: {
      id: 'room-1',
      name: 'Sala 1',
      capacity: 64,
      seatLayout: { rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], columns: 8 },
    },
  });

  const now = new Date();

  await prisma.showtime.upsert({
    where: { id: 'show-001' },
    update: {},
    create: {
      id: 'show-001',
      movieId: movie1.id,
      roomId: room.id,
      startTime: new Date(now.getTime() + 1000 * 60 * 60 * 4),
      price: 16.5,
      availableSeats: 64,
    },
  });

  await prisma.showtime.upsert({
    where: { id: 'show-002' },
    update: {},
    create: {
      id: 'show-002',
      movieId: movie2.id,
      roomId: room.id,
      startTime: new Date(now.getTime() + 1000 * 60 * 60 * 26),
      price: 24,
      availableSeats: 64,
    },
  });

  await prisma.showtime.upsert({
    where: { id: 'show-003' },
    update: {},
    create: {
      id: 'show-003',
      movieId: movie3.id,
      roomId: room.id,
      startTime: new Date(now.getTime() + 1000 * 60 * 60 * 50),
      price: 18,
      availableSeats: 64,
    },
  });

  console.log('Seed ok:', {
    admin: admin.email,
    movies: [movie1.title, movie2.title, movie3.title],
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
