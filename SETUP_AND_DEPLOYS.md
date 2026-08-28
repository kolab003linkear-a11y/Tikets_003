# Ochoymedio — Setup y despliegue

## 1. Prerrequisitos

Asegúrate de tener instalados:

- Node.js 20 LTS o superior
- npm 10+
- Docker Desktop (para PostgreSQL local si no usas una base en cloud)
- Expo CLI
- Git
- iOS Simulator (solo macOS) o Android Studio Emulator

Verifica versiones:

```bash
node -v
npm -v
docker --version
npx expo --version
```

---

## 2. Estructura actual

El proyecto ya está organizado como monorepo:

```text
backend/
  prisma/schema.prisma
  prisma/seed.ts
  src/server.ts
frontend/
  App.tsx
  src/screens/
package.json
```

Ejecuta los comandos siguientes desde la raíz del workspace, salvo cuando se indique `backend` o `frontend`.

---

## 3. Variables de entorno

Crea un archivo `.env` dentro del backend con este contenido:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ochoymedio?schema=public"
PORT=4000
JWT_SECRET="cambia-esta-clave-por-una-segura"
STRIPE_SECRET_KEY="sk_test_xxx"
PAYPHONE_API_KEY="your_payphone_key"
PAYPHONE_WEBHOOK_SECRET="your_webhook_secret"
```

Crea también un archivo `.env.example` con el mismo formato para documentar la configuración:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ochoymedio?schema=public"
PORT=4000
JWT_SECRET="replace-with-a-secure-secret"
STRIPE_SECRET_KEY="sk_test_xxx"
PAYPHONE_API_KEY="your_payphone_key"
PAYPHONE_WEBHOOK_SECRET="your_webhook_secret"
```

---

## 4. Backend: instalación y configuración

```bash
cd backend
npm install
```

El `package.json` y `tsconfig.json` ya incluyen los scripts y dependencias necesarios.

---

## 5. Base de datos PostgreSQL con Docker

Levanta PostgreSQL local:

```bash
docker run --name ochoymedio-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ochoymedio -p 5432:5432 -d postgres:16
```

Luego inicializa Prisma:

```bash
npm run prisma:generate
```

Después de iniciar Docker Desktop, ejecuta:

```bash
npm run db:up
npm run prisma:migrate -- --name init_ochoymedio
npm run prisma:seed
```

---

## 6. Seed de datos de prueba

Crea `prisma/seed.ts` con datos de ejemplo:

```ts
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

  const movie1 = await prisma.movieEvent.create({
    data: {
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

  const room = await prisma.room.create({
    data: {
      name: 'Sala 1',
      capacity: 64,
      seatLayout: { rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], columns: 8 },
    },
  });

  await prisma.showtime.create({
    data: {
      movieId: movie1.id,
      roomId: room.id,
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 4),
      price: 16.5,
      availableSeats: 64,
    },
  });

  console.log('Seed completed:', { admin: admin.email, movie: movie1.title });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Ejecuta:

```bash
npx prisma db seed
```

Si no tienes `seed` configurado en `package.json`, añade esto:

```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

---

## 7. Levantar el backend

En la carpeta `backend`:

```bash
npm run dev
```

La API quedará disponible en:

- http://localhost:4000/api/health

Endpoints clave:

- POST /api/auth/register
- POST /api/auth/login
- GET /api/catalog
- POST /api/reservations/create
- POST /api/payments/webhook

Pruebas automatizadas del backend:

```bash
npm test --workspace backend
```

La suite inicia Express en un puerto temporal y valida registro, login, catálogo,
reserva, conflicto de butacas, pago demo, emisión de ticket y validación QR.

---

## 8. Frontend móvil con Expo

Desde la raíz del proyecto:

```bash
cd frontend
npm install
```

Asegúrate de tener la app mobile con el siguiente `package.json`:

```json
{
  "name": "ochoymedio-mobile",
  "private": true,
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  }
}
```

```bash
npx expo start
```

### Probar en iOS

- macOS + Xcode
- En terminal:

```bash
npx expo run:ios
```

### Probar en Android

- Android Studio + emulador
- En terminal:

```bash
npx expo run:android
```

### Probar en dispositivo físico

1. Instala la app Expo Go desde Play Store o App Store.
2. Ejecuta:

```bash
npx expo start --tunnel
```
3. Escanea el código QR desde tu móvil.

En Windows, usa `http://127.0.0.1:4000` como URL base si `localhost` no resuelve correctamente.

### Error: No Android connected device found

Este mensaje significa que Expo funciona, pero Android no tiene ningún destino abierto. En este equipo el SDK está instalado, pero `adb devices` no muestra dispositivos.

#### Opción A: teléfono físico

1. En Android, abre **Ajustes > Información del teléfono** y pulsa siete veces **Número de compilación**.
2. En **Opciones de desarrollador**, activa **Depuración USB**.
3. Conecta el teléfono por USB y acepta el diálogo de autorización RSA.
4. Comprueba la conexión:

```powershell
adb devices
```

Debe aparecer un dispositivo con estado `device`. Después, desde `frontend`:

```powershell
npx expo start
```

Pulsa `a`. Para un teléfono físico, también puedes escanear el QR con Expo Go; usa `npx expo start --tunnel` si el móvil y el ordenador no están en la misma red.

#### Opción B: emulador Android

1. Abre Android Studio.
2. En **More Actions > Virtual Device Manager**, crea un dispositivo Pixel con una imagen Android instalada.
3. Inícialo con el botón de reproducción.
4. Comprueba:

```powershell
adb devices
```

5. Ejecuta:

```powershell
cd frontend
npx expo start
```

Pulsa `a` cuando el emulador aparezca como `device`.

Si `adb` no se reconoce, añade `C:\Users\<usuario>\AppData\Local\Android\Sdk\platform-tools` al `PATH` de Windows y abre una terminal nueva.

---

## 9. Producción: despliegue recomendado

### Backend (Node.js)

Recomendación:

- Render / Railway / Fly.io / Azure App Service
- PostgreSQL managed en Neon, Supabase o Railway

Variables de entorno de producción:

```env
DATABASE_URL="postgresql://user:password@host:5432/db?schema=public"
PORT=4000
JWT_SECRET="strong-production-secret"
STRIPE_SECRET_KEY="sk_live_xxx"
PAYPHONE_API_KEY="prod_key"
PAYPHONE_WEBHOOK_SECRET="prod_webhook"
NODE_ENV=production
```

Build del backend:

```bash
npm run build
npm run start
```

### Frontend móvil

Para producción con Expo:

```bash
npx expo export
```

Luego:

- App Store Connect para iOS
- Google Play Console para Android
- EAS Build para compilación automatizada:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform all
```

---

## 10. Pruebas E2E básicas

Script mínimo para validar la compra de una entrada y la validación del QR:

```bash
# 1. Registrar usuario
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "demo1234",
    "role": "CLIENT"
  }'

# 2. Consultar cartelera
curl http://localhost:4000/api/catalog

# 3. Crear reserva
curl -X POST http://localhost:4000/api/reservations/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "showtimeId": "show_001",
    "userId": "<user-id>",
    "seatNumbers": ["A1", "A2"]
  }'

# 4. Simular pago confirmado
curl -X POST http://localhost:4000/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.success",
    "reservationId": "<reservation-id>"
  }'
```

### Validación de QR en app

- Abrir la entrada comprada en la pantalla de ticket.
- Verificar que el QR se renderiza correctamente.
- Confirmar que el contenido contiene `ticketId` y `signature`.
- Validar que la pantalla se muestra con seguridad visual y animación.

---

## 11. Checklist final para entrega

- [ ] PostgreSQL en ejecución
- [ ] Prisma migrado y seed cargado
- [ ] Backend corriendo en puerto 4000
- [ ] Expo app levantada con `npx expo start`
- [ ] Usuario registrado y autenticado
- [ ] Selección de butacas y reserva validada
- [ ] Pago simulado y webhook ejecutado
- [ ] Ticket generado con QR y firma digital
- [ ] Flujo de validación en puerta listo

---

## 12. Recomendación de seguridad y escalabilidad

- Usar HTTPS en producción.
- Usar sesiones JWT con expiración corta.
- Revisar reservas con TTL y limpieza de expiradas.
- Desarrollar endpoint de validación de ticket con control de uso único.
- Integrar Stripe/Payphone con comprobación de firma.
- Volcar logs y métricas para monitoreo.

Este proyecto está listo para arrancar localmente y ampliarse a producción con una base sólida de backend, móvil y flujo de reserva seguro.
