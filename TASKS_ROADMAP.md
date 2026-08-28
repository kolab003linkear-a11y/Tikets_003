# Ochoymedio: documento de tareas

Este documento organiza la evolución de la aplicación por fases. Cada fase debe validarse antes de comenzar la siguiente.

## Estado

- [x] Fase 1: Base funcional
- [x] Fase 2: Autenticación
- [ ] Fase 3: Reservas reales
- [ ] Fase 4: Pagos
- [ ] Fase 5: Tickets y QR
- [ ] Fase 6: Mis Tickets y Perfil
- [ ] Fase 7: Panel administrativo
- [ ] Fase 8: Diseño y experiencia móvil
- [ ] Fase 9: Calidad y despliegue

---

## Fase 1: Base funcional

### Objetivo
Conectar la aplicación móvil con el catálogo real del backend.

### Tareas

- [x] Crear un cliente HTTP reutilizable para el frontend.
- [x] Configurar la URL del API para desarrollo LAN.
- [x] Conectar la cartelera con `GET /api/catalog`.
- [x] Mostrar eventos, funciones, horarios, precios e imágenes reales.
- [x] Añadir estado de carga.
- [x] Añadir estado de error y botón para reintentar.
- [x] Añadir estado de catálogo vacío.
- [ ] Mantener un fallback demo solo mientras sea necesario.

### Criterio de terminado
La cartelera se carga desde PostgreSQL a través del backend y funciona desde Expo Go en el teléfono.

---

## Fase 2: Autenticación

### Objetivo
Permitir que cada usuario tenga una sesión segura.

### Tareas

- [x] Crear pantallas de registro e inicio de sesión.
- [x] Conectar registro con `POST /api/auth/register`.
- [x] Conectar login con `POST /api/auth/login`.
- [x] Guardar el token de sesión de forma persistente.
- [x] Restaurar la sesión al abrir la aplicación.
- [x] Proteger las acciones que requieren usuario autenticado.
- [x] Añadir cierre de sesión.
- [x] Validar formularios y mostrar errores claros.

### Criterio de terminado
Un usuario puede registrarse, cerrar y volver a abrir la app, conservar su sesión y cerrar sesión correctamente.

---

## Fase 3: Reservas reales

### Objetivo
Convertir la selección visual de butacas en una reserva controlada por el backend.

### Tareas

- [x] Cargar la distribución de sala desde el catálogo.
- [x] Consultar la disponibilidad actual de cada función.
- [x] Diferenciar butacas libres, ocupadas y seleccionadas.
- [x] Crear reservas con `POST /api/reservations/create`.
- [x] Enviar el usuario autenticado y las butacas seleccionadas.
- [x] Controlar el vencimiento de cinco minutos.
- [x] Mostrar conflictos cuando otra reserva ocupó una butaca.
- [ ] Permitir cancelar o abandonar una selección pendiente.

### Criterio de terminado
Dos dispositivos no pueden confirmar la misma butaca y el estado mostrado coincide con la base de datos.

---

## Fase 4: Pagos

### Objetivo
Reemplazar el pago simulado por un flujo real y seguro.

### Estado actual

El checkout ya confirma pagos mediante un adaptador demo autenticado y restringido a desarrollo. Falta configurar un proveedor real, sus credenciales y el webhook firmado antes de usarlo en producción.

### Tareas

- [ ] Definir el proveedor de pago: Stripe o PayPhone.
- [ ] Configurar las variables de entorno del proveedor.
- [x] Conectar el checkout con el endpoint del backend.
- [x] Eliminar el `setTimeout` de pago simulado.
- [x] Mostrar estados de procesamiento, aprobación y rechazo.
- [x] Evitar envíos duplicados.
- [ ] Procesar y verificar el webhook de pago.
- [ ] Actualizar la reserva solo después de confirmar el pago.

### Criterio de terminado
Una reserva solo pasa a pagada mediante una confirmación verificable del proveedor.

---

## Fase 5: Tickets y QR

### Objetivo
Generar una entrada digital verificable después del pago.

### Tareas

- [x] Obtener los tickets reales de la reserva pagada.
- [x] Generar un QR con la información necesaria para validación.
- [x] Mostrar evento, horario, sala y butacas.
- [x] Mostrar identificador y estado del ticket.
- [x] Evitar mostrar firmas o secretos innecesarios al usuario.
- [ ] Preparar el ticket para uso sin conexión cuando sea posible.

### Criterio de terminado
El usuario recibe un ticket real y el QR contiene información que el backend puede validar.

---

## Fase 6: Mis Tickets y Perfil

### Objetivo
Completar el área personal del usuario.

### Tareas

- [ ] Crear el endpoint para listar tickets del usuario si todavía no existe.
- [ ] Mostrar tickets activos, usados y expirados.
- [ ] Abrir el detalle de cada ticket.
- [ ] Mostrar historial de reservas.
- [ ] Completar los datos del perfil.
- [ ] Añadir preferencias básicas del usuario.
- [ ] Añadir cierre de sesión desde Perfil.

### Criterio de terminado
El usuario puede consultar sus compras anteriores y administrar su sesión desde la aplicación.

---

## Fase 7: Panel administrativo

### Objetivo
Permitir la operación de eventos y validación de entradas.

### Tareas

- [ ] Restringir las funciones administrativas por rol.
- [ ] Implementar lectura de códigos QR.
- [ ] Validar el ticket contra el backend.
- [ ] Marcar entradas como usadas.
- [ ] Mostrar resultado de validación: válido, usado o inválido.
- [ ] Crear gestión de eventos.
- [ ] Crear gestión de salas y distribución de butacas.
- [ ] Crear gestión de funciones, precios y disponibilidad.

### Criterio de terminado
Un usuario con rol autorizado puede validar entradas y administrar la cartelera sin acceso indebido a funciones de cliente.

---

## Fase 8: Diseño y experiencia móvil

### Objetivo
Mejorar la claridad, accesibilidad y calidad visual de la app.

### Tareas

- [ ] Crear componentes reutilizables para botones, tarjetas, inputs y estados.
- [ ] Unificar colores, tipografías, espaciados y tamaños táctiles.
- [ ] Mejorar la navegación entre pantallas.
- [ ] Optimizar imágenes y listas largas.
- [ ] Añadir estados de carga visuales.
- [ ] Mejorar contraste y legibilidad.
- [ ] Revisar compatibilidad con pantallas pequeñas y grandes.
- [ ] Añadir animaciones breves y útiles.
- [ ] Revisar accesibilidad de controles y etiquetas.

### Criterio de terminado
Los flujos principales se entienden y se pueden completar cómodamente en un teléfono real.

---

## Fase 9: Calidad y despliegue

### Objetivo
Preparar la aplicación para uso estable y publicación.

### Tareas

- [ ] Añadir pruebas unitarias para reglas de negocio.
- [ ] Añadir pruebas de endpoints del backend.
- [ ] Probar el flujo completo de compra.
- [ ] Probar conflictos de butacas y expiración de reservas.
- [ ] Revisar autenticación, autorización y secretos.
- [ ] Revisar variables de entorno de producción.
- [ ] Actualizar la documentación técnica.
- [ ] Ejecutar compilación limpia del frontend y backend.
- [ ] Revisar logs y manejo de errores.
- [ ] Publicar una versión etiquetada en Git.
- [ ] Preparar despliegue de API, PostgreSQL y aplicación móvil.

### Criterio de terminado
El flujo completo está probado, documentado y listo para desplegarse en un entorno controlado.

---

## Orden recomendado

1. Completar las fases 1 a 3 para tener catálogo, usuarios y reservas reales.
2. Completar las fases 4 y 5 para cerrar el flujo de compra y ticket.
3. Completar las fases 6 y 7 para cubrir usuarios y operación administrativa.
4. Completar la fase 8 para pulir la experiencia.
5. Completar la fase 9 antes de publicar una versión estable.

## Validación por fase

Antes de pasar de fase, comprobar:

- [ ] El backend compila sin errores.
- [ ] El frontend compila para Android.
- [ ] PostgreSQL inicia y las migraciones están aplicadas.
- [ ] El flujo de la fase funciona desde un teléfono conectado por LAN.
- [ ] La documentación refleja los cambios realizados.
- [ ] Los cambios están guardados en Git.
