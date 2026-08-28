import assert from 'node:assert/strict';
import test from 'node:test';
import serverModule from '../dist/server.js';

const { app, prisma } = serverModule;
let server;

function request(baseUrl, path, options) {
  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  });
}

test.before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await prisma.$disconnect();
});

test('completes the authenticated reservation lifecycle', async () => {
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const email = `test-${Date.now()}@example.com`;
  let userId;
  let reservationId;

  try {
    const registerResponse = await request(baseUrl, '/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'demo1234', role: 'CLIENT' }),
    });
    assert.equal(registerResponse.status, 201);
    const registered = await registerResponse.json();
    userId = registered.user.id;

    const catalogResponse = await request(baseUrl, '/api/catalog');
    assert.equal(catalogResponse.status, 200);
    const catalog = await catalogResponse.json();
    const showtime = catalog.movies.flatMap((movie) => movie.showtimes).find((item) => item.availableSeats > 0);
    assert.ok(showtime, 'expected an available showtime');

    const layout = showtime.room.seatLayout;
    const occupied = new Set(showtime.occupiedSeats);
    const seat = layout.rows
      .flatMap((row) => Array.from({ length: layout.columns }, (_, index) => `${row}${index + 1}`))
      .find((item) => !occupied.has(item));
    assert.ok(seat, 'expected an available seat');

    const loginResponse = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: 'demo1234' }),
    });
    assert.equal(loginResponse.status, 200);
    const login = await loginResponse.json();
    const headers = { Authorization: `Bearer ${login.token}` };

    const reservationResponse = await request(baseUrl, '/api/reservations/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, showtimeId: showtime.id, seatNumbers: [seat] }),
    });
    assert.equal(reservationResponse.status, 201);
    const reservation = await reservationResponse.json();
    reservationId = reservation.reservation.id;
    assert.equal(reservation.tickets[0].seatNumber, seat);

    const conflictResponse = await request(baseUrl, '/api/reservations/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, showtimeId: showtime.id, seatNumbers: [seat] }),
    });
    assert.equal(conflictResponse.status, 409);

    const invalidSeatResponse = await request(baseUrl, '/api/reservations/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, showtimeId: showtime.id, seatNumbers: ['Z99'] }),
    });
    assert.equal(invalidSeatResponse.status, 400);

    const cancelResponse = await request(baseUrl, `/api/reservations/${reservationId}/cancel`, {
      method: 'POST',
      headers,
    });
    assert.equal(cancelResponse.status, 200);
    const cancelled = await cancelResponse.json();
    assert.equal(cancelled.cancelled, true);

    const paidReservationResponse = await request(baseUrl, '/api/reservations/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ userId, showtimeId: showtime.id, seatNumbers: [seat] }),
    });
    assert.equal(paidReservationResponse.status, 201);
    const paidReservation = await paidReservationResponse.json();
    reservationId = paidReservation.reservation.id;

    const paymentResponse = await request(baseUrl, '/api/payments/demo-confirm', {
      method: 'POST',
      headers,
      body: JSON.stringify({ reservationId }),
    });
    assert.equal(paymentResponse.status, 200);

    const ticketsResponse = await request(baseUrl, '/api/tickets', { headers });
    assert.equal(ticketsResponse.status, 200);
    const tickets = await ticketsResponse.json();
    const ticket = tickets.tickets.find((item) => item.reservationId === reservationId);
    assert.ok(ticket, 'expected a ticket for the paid reservation');

    const adminLoginResponse = await request(baseUrl, '/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@ochoymedio.com', password: 'demo1234' }),
    });
    const adminLogin = await adminLoginResponse.json();
    const adminHeaders = { Authorization: `Bearer ${adminLogin.token}` };
    const validationResponse = await request(baseUrl, '/api/admin/tickets/validate', {
      method: 'POST', headers: adminHeaders, body: JSON.stringify({ qrCode: ticket.qrPayload }),
    });
    assert.equal(validationResponse.status, 200);
    assert.equal((await validationResponse.json()).valid, true);

    const usedResponse = await request(baseUrl, '/api/admin/tickets/validate', {
      method: 'POST', headers: adminHeaders, body: JSON.stringify({ qrCode: ticket.qrPayload }),
    });
    assert.equal(usedResponse.status, 200);
    assert.equal((await usedResponse.json()).status, 'USED');
  } finally {
    if (userId) await prisma.user.delete({ where: { id: userId } });
  }
});
