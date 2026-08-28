-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'ADMIN', 'SCANNER');

-- CreateEnum
CREATE TYPE "MovieCategory" AS ENUM ('CINE', 'TEATRO', 'CONCIERTO');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('NOW_SHOWING', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('VALID', 'USED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "category" "MovieCategory" NOT NULL,
    "poster_url" TEXT NOT NULL,
    "trailer_url" TEXT,
    "rating" DECIMAL(2,1),
    "status" "EventStatus" NOT NULL DEFAULT 'NOW_SHOWING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movie_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "seat_layout" JSONB NOT NULL,

    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "showtimes" (
    "id" TEXT NOT NULL,
    "movie_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "available_seats" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "showtimes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "showtime_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "seat_number" TEXT NOT NULL,
    "qr_code_hash" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'VALID',
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "movie_events_status_category_idx" ON "movie_events"("status", "category");

-- CreateIndex
CREATE INDEX "showtimes_start_time_idx" ON "showtimes"("start_time");

-- CreateIndex
CREATE INDEX "showtimes_movie_id_idx" ON "showtimes"("movie_id");

-- CreateIndex
CREATE UNIQUE INDEX "showtimes_movie_id_room_id_start_time_key" ON "showtimes"("movie_id", "room_id", "start_time");

-- CreateIndex
CREATE INDEX "reservations_showtime_id_status_idx" ON "reservations"("showtime_id", "status");

-- CreateIndex
CREATE INDEX "reservations_user_id_status_idx" ON "reservations"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_qr_code_hash_key" ON "tickets"("qr_code_hash");

-- CreateIndex
CREATE INDEX "tickets_reservation_id_idx" ON "tickets"("reservation_id");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- AddForeignKey
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movie_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "showtimes" ADD CONSTRAINT "showtimes_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_showtime_id_fkey" FOREIGN KEY ("showtime_id") REFERENCES "showtimes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
