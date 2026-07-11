# Checklist de aceptacion MVP

Fecha de verificacion: 2026-07-11  
Alcance: demo local con `VITE_AUTH_MODE=demo` y Supabase conectado.

## Resultado rapido

- [x] Suite automatizada ejecutada con `npm test`.
- [x] Build de produccion ejecutado con `npm run build`.
- [x] Servidor local disponible en `http://localhost:5173`.
- [x] Flujo de emergencia ciudadano cubierto.
- [x] Flujo operativo de bombero cubierto.
- [x] Experiencia sin conexion y llamada al 116 cubierta.
- [x] Reintento de conexion cubierto.

## Credenciales de demostracion

- Ciudadano: `+51999888777` / `seguro123` / OTP `116116`.
- Bombero: `B-204`, `B-205` o `B-301` / `bombero123` / OTP `116116`.

## Criterios del ciudadano

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Registro y validacion OTP | Cumple | Flujo de acceso demo |
| Inicio de sesion por telefono | Cumple | `authService` y pruebas de autenticacion |
| OTP en nuevo dispositivo | Cumple | Sesion demo y challenge OTP |
| Boton principal para reportar | Cumple | Inicio ciudadano |
| Tipo, ubicacion y evidencia obligatoria | Cumple | Flujo `/ciudadano/reporte` |
| Cuenta regresiva y cancelacion | Cumple | Flujo de confirmacion |
| Sin internet con alternativa de llamada | Cumple | Pantalla global offline, llamada `116` |
| Envio y seguimiento en vivo | Cumple | Realtime y pantalla de seguimiento |
| Compania asignada visible | Cumple | Seguimiento ciudadano |
| Ubicacion del bombero en camino | Cumple | Mapa y servicio de ubicacion |
| Historial propio | Cumple | Pantalla de historial ciudadano |

## Criterios del bombero

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| Acceso por codigo, contrasena y OTP | Cumple | Flujo de login de bombero |
| Reportes limitados a su compania | Cumple | RLS y `firefighterService` |
| Inicio con boton Reportar emergencia | Cumple | Boton principal visible en el panel operativo |
| Reportes nuevos y activos | Cumple | Pantalla de reportes activos |
| Perfil, configuracion, cuenta e historial | Cumple | Perfil de bombero |
| Sin prioridad visual | Cumple | Lista operativa uniforme |
| Estados recibido, en camino, atendiendo y finalizado | Cumple | Detalle y timeline |
| Ubicacion compartida mientras esta en camino | Cumple | Servicio Realtime de ubicacion |
| Historial de la compania | Cumple | `/bombero/historial` |

## Guia manual breve

1. Abrir `http://localhost:5173` y elegir “Soy ciudadano”.
2. Iniciar sesion con las credenciales demo y usar OTP `116116`.
3. Entrar a “Reportar emergencia”, completar tipo, ubicacion y evidencia, y confirmar.
4. Verificar que el reporte aparece en seguimiento y que la compania se muestra al asignarse.
5. Cerrar sesion, entrar como `B-204`, abrir “Reportes” y avanzar el reporte por sus estados.
6. Volver al inicio del bombero y confirmar que “REPORTAR EMERGENCIA” esta visible en el panel operativo.
7. Simular perdida de red desde DevTools: debe aparecer “Sin conexion”, “Llamar 116” y “Reintentar”.

## Pendientes antes de produccion real

- Configurar SMS/OTP real en Supabase Auth.
- Activar proteccion contra contrasenas filtradas.
- Aplicar rate limiting y restriccion de origen para funciones publicas.
- Revisar Security Advisor y configurar el dominio final.
- Publicar frontend y validar instalacion PWA en un dispositivo movil.

## Comandos de verificacion

```powershell
npm test
npm run build
npm run dev
```
