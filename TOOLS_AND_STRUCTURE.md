# Ochoymedio: herramientas y estructura

## Herramientas usadas

- **Node.js 20+ y npm**: instalación y ejecución del monorepo.
- **TypeScript**: código del backend y tipado del frontend.
- **Expo SDK 54**: servidor Metro y ejecución en Expo Go.
- **React Native**: aplicación móvil Android/iOS.
- **React Navigation**: navegación por pestañas y pantallas.
- **Express**: API HTTP del backend.
- **Prisma**: acceso tipado a PostgreSQL, migraciones y seed.
- **PostgreSQL 16**: base de datos local.
- **Docker Compose**: ciclo de vida reproducible de PostgreSQL.

## Estructura

```text
backend/
  prisma/              Esquema, migraciones y datos demo
  src/server.ts        API Express
  .env                 Configuración local, no se publica
  docker-compose.yml   PostgreSQL local
frontend/
  App.tsx              Navegación principal
  index.ts             Entry point de Expo
  src/screens/         Pantallas móviles
  app.json              Configuración Expo
App.tsx                Demo móvil alternativa en la raíz
package.json           Workspaces y scripts del monorepo
```

## Comandos principales

Desde la raíz:

```powershell
npm install
npm run dev:backend
npm run dev:frontend
```

Base de datos:

```powershell
Set-Location backend
npm run db:up
npm run prisma:generate
npx prisma migrate deploy --schema=prisma/schema.prisma
npm run prisma:seed
```

Para probar en un teléfono, el PC y el teléfono deben compartir Wi-Fi. Ejecuta Expo con `--lan` y usa la IP LAN del PC, no `localhost`.

## Limpieza

Los directorios `node_modules`, `.expo`, `dist` y los archivos `.env` son locales y están excluidos por `.gitignore`. No se deben subir al repositorio.