import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';
import { PrismaClient, ReservationStatus, TicketStatus, UserRole } from '@prisma/client';
import { z } from 'zod';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.JWT_SECRET ?? 'ochoymedio-dev-secret';

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

const paymentWebhookSchema = z.object({
  event: z.enum(['payment.success', 'payment.failed']),
  reservationId: z.string().min(1),
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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Credential missing.', 401));
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string; role: UserRole };
    (req as Request & { user?: { sub: string; email: string; role: UserRole } }).user = decoded;
    return next();
  } catch (error) {
    return next(new AppError('Invalid or expired token.', 401));
  }
}

function normalizeSeatNumbers(seats: string[]) {
  return [...new Set(seats.map((seat) => seat.trim().toUpperCase()))].sort((a, b) => a.localeCompare(b));
}

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ochoymedio-api', time: new Date().toISOString() });
});

app.post('/api/auth/register', async (req: Request, res: Response, next: NextFunction) => {
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

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = loginSchema.parse(req.body);
    const email = payload.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError('Incorrect email or password.', 401);
    }

    const validPassword = await bcrypt.compare(payload.password, user.passwordHash);
    if (!validPassword) {
      throw new AppError('Incorrect email or password.', 401);
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/catalog', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = String(req.query.category ?? 'ALL');
    const date = req.query.date ? new Date(String(req.query.date)) : undefined;

    const where: Record<string, unknown> = {};
    if (category !== 'ALL') {
      where.category = category;
    }

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
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

    const movieEvents = await prisma.movieEvent.findMany({
      where,
      include: {
        showtimes: {
          include: {
            room: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json({ movies: movieEvents });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/reservations/create', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = reservationSchema.parse(req.body);
    const normalizedSeats = normalizeSeatNumbers(payload.seatNumbers);
    const showtimeId = payload.showtimeId;
    const userId = payload.userId;

    const result = await prisma.$transaction(
      async (tx) => {
        const showtime = await tx.showtime.findUnique({
          where: { id: showtimeId },
          include: { room: true },
        });

        if (!showtime) {
          throw new AppError('Selected showtime was not found.', 404);
        }

        await tx.$queryRaw`SELECT id FROM "showtimes" WHERE id = ${showtimeId} FOR UPDATE`;

        const occupiedSeats = await tx.$queryRaw<{ seat_number: string }[]>`
          SELECT t."seat_number" AS seat_number
          FROM "tickets" t
          INNER JOIN "reservations" r ON r.id = t."reservation_id"
          WHERE r."showtime_id" = ${showtimeId}
            AND r.status IN (${ReservationStatus.PENDING}, ${ReservationStatus.PAID})
        `;

        const reservedSet = new Set(occupiedSeats.map((seat) => seat.seat_number));
        const conflictingSeats = normalizedSeats.filter((seat) => reservedSet.has(seat));

        if (conflictingSeats.length > 0) {
          throw new AppError(`The following seats are already reserved: ${conflictingSeats.join(', ')}`, 409);
        }

        if (normalizedSeats.length > showtime.availableSeats) {
          throw new AppError('Not enough available seats remain for this showtime.', 409);
        }

        const reservation = await tx.reservation.create({
          data: {
            showtimeId,
            userId,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          },
        });

        const tickets = await Promise.all(
          normalizedSeats.map(async (seatNumber) => {
            const qrCodeHash = createHash('sha256')
              .update(`${reservation.id}:${seatNumber}:${Date.now()}`)
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
          where: { id: showtimeId },
          data: {
            availableSeats: {
              decrement: normalizedSeats.length,
            },
          },
        });

        return {
          reservation,
          tickets,
        };
      },
      { timeout: 15000 },
    );

    return res.status(201).json({
      success: true,
      reservation: result.reservation,
      tickets: result.tickets,
    });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/payments/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = paymentWebhookSchema.parse(req.body);

    if (payload.event === 'payment.success') {
      await prisma.reservation.update({
        where: { id: payload.reservationId },
        data: { status: 'PAID' },
      });

      await prisma.ticket.updateMany({
        where: { reservationId: payload.reservationId },
        data: { status: 'VALID' },
      });

      return res.json({ success: true, message: 'Payment confirmed and tickets released.' });
    }

    await prisma.reservation.update({
      where: { id: payload.reservationId },
      data: { status: 'CANCELLED' },
    });

    return res.status(400).json({ success: false, message: 'Payment failed; reservation has been cancelled.' });
  } catch (error) {
    return next(error);
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

app.listen(PORT, () => {
  console.log(`Ochoymedio API running on http://localhost:${PORT}`);
});
