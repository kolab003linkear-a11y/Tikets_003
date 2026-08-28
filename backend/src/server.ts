import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient, ReservationStatus, TicketStatus, UserRole } from '@prisma/client';
import { z } from 'zod';
import { createHash } from 'crypto';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT ?? 4000);
const jwtSecret = process.env.JWT_SECRET ?? 'ochoymedio-dev-secret';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['CLIENT', 'ADMIN', 'SCANNER']).default('CLIENT'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const reservationSchema = z.object({
  showtimeId: z.string().min(1),
  userId: z.string().min(1),
  seatNumbers: z.array(z.string().min(1)).min(1).max(12),
});

const webhookSchema = z.object({
  event: z.enum(['payment.success', 'payment.failed']),
  reservationId: z.string().min(1),
});

const paymentConfirmationSchema = z.object({
  reservationId: z.string().min(1),
});

const profileSchema = z.object({
  email: z.string().email(),
});

class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

function signToken(payload: { sub: string; email: string; role: UserRole }) {
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Credential missing.', 401));
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, jwtSecret) as { sub: string; email: string; role: UserRole };
    (req as Request & { user?: { sub: string; email: string; role: UserRole } }).user = decoded;
    return next();
  } catch {
    return next(new AppError('Invalid or expired token.', 401));
  }
}

const normalizeSeats = (seats: string[]) => [...new Set(seats.map((seat) => seat.trim().toUpperCase()))].sort();

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ochoymedio-api', timestamp: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const email = payload.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(payload.password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: payload.role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const email = payload.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError('Incorrect email or password.', 401);
    }

    const valid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!valid) {
      throw new AppError('Incorrect email or password.', 401);
    }

    const token = signToken({ sub: user.id, email: user.email, role: user.role });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/me', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const user = await prisma.user.findUnique({
      where: { id: authenticatedUser.sub },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    if (!user) throw new AppError('User not found.', 404);
    return res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.patch('/api/me', authMiddleware, async (req, res, next) => {
  try {
    const payload = profileSchema.parse(req.body);
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const user = await prisma.user.update({
      where: { id: authenticatedUser.sub },
      data: { email: payload.email.trim().toLowerCase() },
      select: { id: true, email: true, role: true, createdAt: true },
    });

    return res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.get('/api/catalog', async (req, res, next) => {
  try {
    const category = String(req.query.category ?? 'ALL');
    const dateParam = req.query.date ? new Date(String(req.query.date)) : undefined;

    const where: Record<string, any> = {};
    if (category !== 'ALL') {
      where.category = category;
    }

    if (dateParam) {
      const start = new Date(dateParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateParam);
      end.setHours(23, 59, 59, 999);
      where.showtimes = {
        some: {
          startTime: {
            gte: start,
            lte: end,
          },
        },
      };
    }

    const movies = await prisma.movieEvent.findMany({
      where,
      include: {
        showtimes: {
          include: {
            room: true,
            reservations: {
              where: {
                status: {
                  in: [ReservationStatus.PENDING, ReservationStatus.PAID],
                },
              },
              include: {
                tickets: {
                  select: { seatNumber: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      movies: movies.map((movie) => ({
        ...movie,
        showtimes: movie.showtimes.map((showtime) => ({
          ...showtime,
          occupiedSeats: showtime.reservations.flatMap((reservation) =>
            reservation.tickets.map((ticket) => ticket.seatNumber),
          ),
          reservations: undefined,
        })),
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/reservations/create', authMiddleware, async (req, res, next) => {
  try {
    const payload = reservationSchema.parse(req.body);
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const seatNumbers = normalizeSeats(payload.seatNumbers);

    const result = await prisma.$transaction(async (tx) => {
      const showtime = await tx.showtime.findUnique({
        where: { id: payload.showtimeId },
        include: { room: true },
      });

      if (!showtime) {
        throw new AppError('Selected showtime was not found.', 404);
      }

      await tx.$queryRaw`SELECT id FROM "showtimes" WHERE id = ${payload.showtimeId} FOR UPDATE`;

      const occupied = await tx.$queryRaw<{ seat_number: string }[]>`
        SELECT t."seat_number" AS seat_number
        FROM "tickets" t
        INNER JOIN "reservations" r ON r.id = t."reservation_id"
        WHERE r."showtime_id" = ${payload.showtimeId}
          AND r.status IN (${ReservationStatus.PENDING}::"ReservationStatus", ${ReservationStatus.PAID}::"ReservationStatus")
      `;

      const occupiedSet = new Set(occupied.map((seat) => seat.seat_number));
      const conflicts = seatNumbers.filter((seat) => occupiedSet.has(seat));

      if (conflicts.length > 0) {
        throw new AppError(`Seats already reserved: ${conflicts.join(', ')}`, 409);
      }

      if (seatNumbers.length > showtime.availableSeats) {
        throw new AppError('Not enough available seats remain for this showtime.', 409);
      }

      const reservation = await tx.reservation.create({
        data: {
          showtimeId: payload.showtimeId,
          userId: authenticatedUser.sub,
          status: ReservationStatus.PENDING,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      const createdTickets = await Promise.all(
        seatNumbers.map(async (seatNumber) => {
          const qrCodeHash = createHash('sha256')
            .update(`${reservation.id}:${seatNumber}:${Date.now()}:${Math.random()}`)
            .digest('hex');

          return tx.ticket.create({
            data: {
              reservationId: reservation.id,
              seatNumber,
              qrCodeHash,
              status: TicketStatus.VALID,
            },
          });
        }),
      );

      await tx.showtime.update({
        where: { id: payload.showtimeId },
        data: {
          availableSeats: {
            decrement: seatNumbers.length,
          },
        },
      });

      return { reservation, createdTickets };
    });

    res.status(201).json({
      success: true,
      reservation: result.reservation,
      tickets: result.createdTickets,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/reservations/:reservationId/cancel', authMiddleware, async (req, res, next) => {
  try {
    const reservationId = req.params.reservationId;
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { tickets: true, showtime: true },
    });

    if (!reservation || reservation.userId !== authenticatedUser.sub) {
      throw new AppError('Reservation not found.', 404);
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      return res.json({
        success: true,
        cancelled: false,
        reservation,
        message: 'This reservation is no longer pending and cannot be cancelled.',
      });
    }

    const updatedReservation = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.CANCELLED },
        include: { tickets: true, showtime: true },
      });

      if (cancelled.tickets.length > 0) {
        await tx.showtime.update({
          where: { id: cancelled.showtimeId },
          data: {
            availableSeats: {
              increment: cancelled.tickets.length,
            },
          },
        });
      }

      await tx.ticket.updateMany({
        where: { reservationId: reservation.id },
        data: { status: TicketStatus.EXPIRED },
      });

      return cancelled;
    });

    return res.json({
      success: true,
      cancelled: true,
      reservation: updatedReservation,
      message: 'Reservation cancelled and seats released.',
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/payments/demo-confirm', authMiddleware, async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new AppError('Demo payments are disabled in production.', 403);
    }

    const payload = paymentConfirmationSchema.parse(req.body);
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const reservation = await prisma.reservation.findUnique({
      where: { id: payload.reservationId },
      include: { tickets: true },
    });

    if (!reservation || reservation.userId !== authenticatedUser.sub) {
      throw new AppError('Reservation not found.', 404);
    }

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new AppError('This reservation is no longer payable.', 409);
    }

    if (reservation.expiresAt && reservation.expiresAt <= new Date()) {
      await prisma.reservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.CANCELLED },
      });
      throw new AppError('The reservation has expired.', 409);
    }

    const paidReservation = await prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id: reservation.id },
        data: { status: ReservationStatus.PAID },
        include: {
          tickets: true,
          showtime: { include: { movie: true, room: true } },
        },
      });

      await tx.ticket.updateMany({
        where: { reservationId: reservation.id },
        data: { status: TicketStatus.VALID },
      });

      return updated;
    });

    return res.json({ success: true, reservation: paidReservation, mode: 'demo' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/tickets', authMiddleware, async (req, res, next) => {
  try {
    const authenticatedUser = (req as Request & { user: { sub: string } }).user;
    const tickets = await prisma.ticket.findMany({
      where: { reservation: { userId: authenticatedUser.sub } },
      include: {
        reservation: {
          include: { showtime: { include: { movie: true, room: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        seatNumber: ticket.seatNumber,
        status: ticket.status,
        createdAt: ticket.createdAt,
        usedAt: ticket.usedAt,
        qrPayload: `ticketsafe:v1:${ticket.id}:${ticket.qrCodeHash}`,
        reservationId: ticket.reservationId,
        reservationStatus: ticket.reservation.status,
        event: {
          title: ticket.reservation.showtime.movie.title,
          startTime: ticket.reservation.showtime.startTime,
          room: ticket.reservation.showtime.room.name,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/payments/webhook', async (req, res, next) => {
  try {
    const payload = webhookSchema.parse(req.body);

    if (payload.event === 'payment.success') {
      await prisma.reservation.update({
        where: { id: payload.reservationId },
        data: { status: ReservationStatus.PAID },
      });

      await prisma.ticket.updateMany({
        where: { reservationId: payload.reservationId },
        data: { status: TicketStatus.VALID },
      });

      return res.json({ success: true, message: 'Payment confirmed and tickets released.' });
    }

    await prisma.reservation.update({
      where: { id: payload.reservationId },
      data: { status: ReservationStatus.CANCELLED },
    });

    return res.status(400).json({
      success: false,
      message: 'Payment failed; reservation has been cancelled.',
    });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Request validation failed.',
      details: error.issues,
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  const err = error as Error & { statusCode?: number };
  return res.status(err.statusCode ?? 500).json({
    success: false,
    message: err.message ?? 'Internal server error.',
  });
});

app.listen(port, () => {
  console.log(`Ochoymedio API running at http://localhost:${port}`);
});
