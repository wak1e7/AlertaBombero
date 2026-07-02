# AlertaBombero - Especificacion PWA para planificacion e implementacion

## 1. Objetivo

AlertaBombero sera una PWA web/movil para reportar emergencias a bomberos de forma rapida, accesible y trazable.

La aplicacion debe funcionar desde navegador y poder instalarse en el celular como PWA. Para la defensa se debe mostrar:

- URL publica desplegada.
- PWA instalable en un celular.
- Flujo ciudadano completo.
- Flujo bombero completo.
- Actualizacion en tiempo real del estado y ubicacion.
- Interfaz profesional basada en el Figma de referencia.

Referencia visual:

https://www.figma.com/proto/OhnrNPWpQBv3kqzLBNlYEe/Sin-t%C3%ADtulo?node-id=47-1064&starting-point-node-id=47%3A1064&t=KlV2I7ryqRWEDiXh-1

El diseno debe tomar ese prototipo como base, pero con acabado mas profesional, mejor jerarquia, mejor espaciado, estados claros y experiencia mobile-first.

## 2. Stack gratuito recomendado

### Frontend PWA

```text
React
TypeScript
Vite
Tailwind CSS
React Router
TanStack Query
Zod
Leaflet
OpenStreetMap
Vite PWA Plugin
Firebase Cloud Messaging Web Push
```

### Backend y datos

```text
Supabase Free Plan
Supabase Auth
Supabase Database/Postgres
Supabase Realtime
Supabase Storage
Supabase Edge Functions, solo si se requiere enviar notificaciones FCM desde servidor
Firebase Cloud Messaging, solo para notificaciones push gratuitas
```

### Despliegue gratuito

```text
Frontend PWA: Vercel, Netlify o Cloudflare Pages
Backend: Supabase Free Plan
Notificaciones: Firebase Cloud Messaging
Mapas: Leaflet + OpenStreetMap
Rutas MVP: linea directa o calculo simple de distancia
Rutas futuras gratuitas: OSRM o GraphHopper
```

No usar:

- Google Maps SDK.
- Google Routes API.
- Servicios SMS de pago.
- Pasarela de pagos.
- Microservicios.

## 3. Alcance MVP

Debe incluir:

- PWA desplegada en URL publica.
- Manifest PWA.
- Service worker.
- Instalacion en celular desde navegador.
- Login ciudadano con telefono y contrasena.
- Registro ciudadano con nombres, apellidos, telefono, DNI y contrasena.
- OTP simulado para validar identidad del ciudadano.
- OTP simulado cuando el ciudadano inicia sesion en un nuevo dispositivo.
- Login bombero con codigo de bombero y contrasena.
- OTP simulado para validar identidad del bombero.
- Pantalla de bienvenida para ciudadano y bombero despues de verificacion.
- Bomberos precargados.
- Companias de bomberos precargadas.
- Reporte con ubicacion, tipo de emergencia y evidencia obligatoria.
- Contador de 5 segundos antes de enviar con opcion cancelar.
- Manejo sin internet con opcion llamar al 116.
- Asignacion automatica a compania.
- Notificacion a bomberos de la compania asignada.
- Panel bombero.
- Navegacion bombero: Inicio, Reportes, Perfil.
- Estados: ENVIADO, RECIBIDO, EN_CAMINO, ATENDIENDO, FINALIZADO.
- Seguimiento ciudadano en tiempo real.
- Mapa con ubicacion de emergencia y ubicacion del bombero.
- Historial simple.

## 4. Roles

### Ciudadano

Puede:

- Registrarse.
- Verificar OTP simulado.
- Iniciar sesion.
- Crear reporte.
- Adjuntar evidencia obligatoria.
- Confirmar ubicacion.
- Cancelar envio durante contador.
- Ver estado del reporte.
- Ver ubicacion/ruta del bombero cuando este en camino.
- Llamar al 116 si no hay internet.
- Consultar historial.

No puede:

- Cambiar estados operativos.
- Editar el reporte despues de enviado.
- Elegir la compania.

### Bombero

Puede:

- Iniciar sesion con codigo de bombero y contrasena.
- Verificar OTP simulado.
- Ver reportes asignados a su compania.
- Recibir notificaciones.
- Ver detalle del reporte.
- Ver evidencia, ubicacion, tipo y descripcion.
- Marcar recibido.
- Marcar en camino.
- Actualizar su ubicacion en vivo.
- Marcar atendiendo.
- Marcar finalizado.

No puede:

- Ver reportes de otra compania.
- Cambiar reportes finalizados.

## 5. Autenticacion

### Ciudadano

Datos:

```text
nombres
apellidos
telefono
dni
contrasena
```

Flujo:

1. Registra nombres, apellidos, telefono, DNI y contrasena.
2. El sistema genera OTP simulado asociado al telefono.
3. El usuario ingresa el OTP.
4. Si es correcto, queda verificado.
5. Ve pantalla de bienvenida.
6. Entra automaticamente a la app.
7. En siguientes accesos inicia sesion con telefono y contrasena.
8. Si inicia sesion desde un nuevo dispositivo, debe validar OTP simulado.

Regla de sesion:

```text
Si el usuario inicia sesion en otro dispositivo, se invalida la sesion anterior.
```

Implementacion sugerida:

- Usar Supabase Auth con email/password adaptado.
- Para ciudadano, usar telefono como identificador visible.
- Internamente se puede mapear el telefono a un email tecnico, por ejemplo `telefono@ciudadano.alertabombero.local`.
- Guardar datos reales en tabla `profiles`.
- Guardar `active_session_id` para invalidar sesiones anteriores.

### Bombero

Datos:

```text
nombres
apellidos
telefono
codigo_bombero
contrasena
company_id
```

Flujo:

1. Ingresa codigo de bombero.
2. Ingresa contrasena.
3. El sistema genera OTP simulado asociado al telefono registrado.
4. Ingresa OTP.
5. Ve pantalla de bienvenida.
6. Entra a la vista de Inicio.

Regla:

```text
El bombero no se registra desde la app. Debe existir precargado.
```

## 6. Flujo ciudadano

### 6.1 Inicio

Si no tiene cuenta:

1. Registro ciudadano.
2. OTP simulado.
3. Bienvenida.
4. Inicio automatico.

Si ya tiene cuenta:

1. Login con telefono y contrasena.
2. OTP simulado si es un nuevo dispositivo.
3. Pantalla principal con un unico elemento funcional: boton "Reportar emergencia".

### 6.2 Crear reporte

Campos:

- Tipo de emergencia.
- Ubicacion.
- Evidencia obligatoria: foto o video.
- Descripcion opcional.

Validaciones:

- Tipo obligatorio.
- Ubicacion obligatoria.
- Evidencia obligatoria.
- Internet disponible.

### 6.3 Sin internet

La pantalla sin conexion debe poder mostrarse en cualquier momento cuando la app no detecte internet.

Si no hay internet en vista ciudadana:

```text
No tienes conexion a internet.
No podemos enviar tu reporte en este momento.
Puedes llamar directamente al 116.
```

Botones:

- Llamar al 116.
- Reintentar.

Accion:

```text
window.location.href = "tel:116"
```

En vista bombero, la pantalla sin conexion tambien debe aparecer cuando se pierda conexion. Debe avisar que reportes, estados y ubicacion en vivo no se pueden actualizar hasta reconectar, y mantener la opcion de llamar al 116.

### 6.4 Contador de envio

Cuando el usuario presiona "Enviar reporte":

1. Se muestra contador de 5 segundos.
2. Se muestra boton "Cancelar envio".
3. Si cancela, no se crea el reporte.
4. Si el contador termina, se crea el reporte.
5. El sistema asigna compania.
6. Se notifica a bomberos.
7. El ciudadano entra a seguimiento.

### 6.5 Seguimiento

El ciudadano solo observa:

- Estado actual.
- Compania asignada.
- Ubicacion de emergencia.
- Ubicacion del bombero respondiente.
- Ruta o linea hacia la emergencia.
- Tiempo aproximado si esta disponible.

Estados visibles:

```text
Reporte enviado
Reporte recibido
Bombero en camino
Atendiendo emergencia
Emergencia finalizada
```

## 7. Flujo bombero

### 7.1 Navegacion

La vista del bombero debe tener tres opciones principales:

```text
Inicio
Reportes
Perfil
```

Inicio:

- Muestra el boton principal "Reportar emergencia".
- No muestra mapa ni lista de reportes.

Reportes:

- Muestra solo reportes nuevos y activos de su compania.
- No muestra historial.
- No muestra prioridades.

Perfil:

- Muestra datos del bombero.
- Incluye configuracion.
- Incluye acceso a historial de su compania.
- Incluye cierre de sesion.

### 7.2 Reportes

Cada reporte muestra:

- Tipo.
- Estado.
- Fecha/hora.
- Distancia aproximada.
- Ubicacion resumida.

Regla:

```text
Todas las emergencias tienen igual prioridad para la interfaz del bombero. No mostrar prioridad, severidad ni ranking visual.
```

### 7.3 Recibido

Cualquier bombero de la compania puede presionar "Recibido".

Al hacerlo:

- Estado pasa de ENVIADO a RECIBIDO.
- Se registra bombero responsable.
- Se actualiza en tiempo real para ciudadano y bomberos.

### 7.4 En camino

Cualquier bombero de la compania puede presionar "En camino".

Regla:

```text
El primer bombero que marca EN_CAMINO queda como respondiente principal.
```

Al hacerlo:

- Estado pasa a EN_CAMINO.
- Se guarda `responding_firefighter_id`.
- Se activa actualizacion de ubicacion.
- El ciudadano ve la ubicacion del bombero en tiempo real.

### 7.5 Atendiendo

Cuando llega:

- Presiona "Atendiendo".
- Estado pasa a ATENDIENDO.
- Se reduce o detiene actualizacion frecuente de ubicacion.

### 7.6 Finalizado

Al terminar:

- Presiona "Finalizado".
- Estado pasa a FINALIZADO.
- Se registra cierre.
- El reporte pasa a historial.

## 8. Estados

Persistidos:

```text
ENVIADO
RECIBIDO
EN_CAMINO
ATENDIENDO
FINALIZADO
SIN_COMPANIA_DISPONIBLE
```

Internos UI:

```text
PREPARANDO_ENVIO
CANCELADO_ANTES_DE_ENVIAR
SIN_INTERNET
ERROR_ENVIO
```

Transiciones validas:

```text
ENVIADO -> RECIBIDO
RECIBIDO -> EN_CAMINO
EN_CAMINO -> ATENDIENDO
ATENDIENDO -> FINALIZADO
ENVIADO -> SIN_COMPANIA_DISPONIBLE
```

## 9. Asignacion de compania

MVP:

```text
Elegir compania activa mas cercana por distancia geografica.
```

Datos de compania:

```text
id
name
address
latitude
longitude
coverage_radius_km
active
```

Algoritmo:

1. Obtener ubicacion del reporte.
2. Obtener companias activas.
3. Calcular distancia con formula Haversine.
4. Elegir la compania activa mas cercana con bomberos disponibles.
5. Guardar `company_id` en el reporte.
6. Notificar a bomberos de esa compania.

Futuro gratuito:

- OSRM.
- GraphHopper.
- Comparacion por tiempo estimado de ruta.

## 10. Notificaciones

### 10.1 En app

Usar Supabase Realtime para:

- Nuevo reporte.
- Cambio de estado.
- Ubicacion del bombero.
- Actualizacion del seguimiento ciudadano.

### 10.2 Push Web

Usar Firebase Cloud Messaging Web Push para:

- Notificar nuevo reporte a bomberos.
- Notificar cambio de estado al ciudadano.

Requisitos:

- Service worker.
- Permiso de notificaciones.
- Guardar FCM token en Supabase.
- Enviar push desde Edge Function o backend seguro.
- No exponer llaves privadas de Firebase en el frontend.

Para el MVP, si Web Push complica la demo, Supabase Realtime puede cubrir la notificacion en pantalla mientras la app esta abierta.

## 11. PWA

Debe incluir:

- `manifest.webmanifest`.
- Service worker.
- Iconos.
- Nombre: AlertaBombero.
- Tema rojo emergencia.
- Soporte mobile-first.
- Instalacion desde Chrome Android.
- Funcionamiento basico si se recarga la pagina.

No es necesario:

- Publicar en Play Store.
- Generar APK.
- Usar Android Studio.

## 12. Pantallas

### Ciudadano

1. Login.
2. Registro.
3. Verificacion OTP.
4. Bienvenida ciudadano.
5. Inicio ciudadano.
6. Formulario de reporte.
7. Evidencia.
8. Confirmacion con contador.
9. Sin internet / llamar 116.
10. Seguimiento en vivo.
11. Historial.

### Bombero

1. Login con codigo.
2. Verificacion OTP.
3. Bienvenida bombero.
4. Inicio bombero.
5. Reportes nuevos y activos.
6. Detalle de emergencia.
7. Mapa/ruta dentro de reporte.
8. Cambio de estado.
9. Perfil.
10. Historial de su compania.
11. Sin internet / llamar 116.

## 13. UI profesional

Basarse en Figma, mejorando:

- Layout mobile-first.
- Tarjetas limpias.
- Botones grandes.
- Estados con color e icono.
- Mapa claro.
- Formularios simples.
- Lenguaje directo.
- Contraste alto.

Paleta:

```text
Rojo emergencia: #D62828
Rojo accion: #EF4444
Fondo: #F8FAFC
Superficie: #FFFFFF
Texto: #111827
Texto secundario: #6B7280
Verde finalizado: #16A34A
Azul informacion: #2563EB
Amarillo alerta: #F59E0B
```

Componentes:

- AppShell.
- AuthCard.
- EmergencyButton.
- ReportForm.
- EvidenceUploader.
- CountdownModal.
- OfflineCallCard.
- StatusBadge.
- ReportCard.
- FirefighterPanel.
- TrackingMap.
- StateTimeline.

## 14. Modelo de datos Supabase

### profiles

```text
id uuid primary key
auth_user_id uuid
role text
name text
last_name text
phone text
dni text nullable
firefighter_code text nullable
company_id uuid nullable
phone_verified boolean
active_session_id text
active boolean
created_at timestamptz
```

### fire_companies

```text
id uuid primary key
name text
address text
latitude numeric
longitude numeric
coverage_radius_km numeric
active boolean
created_at timestamptz
```

### emergency_reports

```text
id uuid primary key
citizen_id uuid
company_id uuid
responding_firefighter_id uuid nullable
type text
description text nullable
latitude numeric
longitude numeric
address_text text nullable
status text
created_at timestamptz
received_at timestamptz nullable
on_way_at timestamptz nullable
attending_at timestamptz nullable
finished_at timestamptz nullable
```

### report_evidence

```text
id uuid primary key
report_id uuid
file_url text
file_type text
file_name text
file_size int
created_at timestamptz
```

### report_status_history

```text
id uuid primary key
report_id uuid
old_status text
new_status text
changed_by uuid
created_at timestamptz
observation text nullable
```

### live_locations

```text
id uuid primary key
report_id uuid
firefighter_id uuid
latitude numeric
longitude numeric
updated_at timestamptz
```

### notification_tokens

```text
id uuid primary key
user_id uuid
fcm_token text
platform text
created_at timestamptz
active boolean
```

### otp_codes

```text
id uuid primary key
user_identifier text
code text
purpose text
expires_at timestamptz
used boolean
created_at timestamptz
```

## 15. Seguridad Supabase

Activar RLS en todas las tablas expuestas.

Reglas:

- Ciudadano solo ve sus propios reportes.
- Bombero solo ve reportes de su compania.
- Solo bomberos de la compania asignada cambian estado.
- Evidencia solo visible para ciudadano propietario y bomberos asignados.
- `service_role` nunca va en frontend.
- FCM server key solo en Edge Function o backend seguro.
- No usar `user_metadata` para autorizacion.
- Usar tabla `profiles` para rol, compania y permisos.

## 16. Despliegue

Frontend:

```text
Vercel, Netlify o Cloudflare Pages
```

Backend:

```text
Supabase Free Plan
```

Entrega:

- URL publica.
- PWA instalada en celular.
- Supabase configurado.
- Datos semilla.
- Video de respaldo.

Antes de la demo:

1. Abrir URL publica.
2. Instalar PWA en el celular.
3. Probar login ciudadano.
4. Probar login bombero.
5. Crear reporte.
6. Cambiar estados.
7. Ver seguimiento en tiempo real.
8. Probar llamada al 116 sin internet.

## 17. Plan de 2 semanas

### Semana 1

Dia 1:

- Crear proyecto React/Vite.
- Configurar Tailwind.
- Configurar Supabase.
- Crear tablas base.
- Crear tema visual.

Dia 2:

- Auth ciudadano.
- Auth bombero.
- OTP simulado.
- Sesion unica.

Dia 3:

- Inicio ciudadano.
- Formulario de reporte.
- Ubicacion del navegador.

Dia 4:

- Evidencia obligatoria.
- Supabase Storage.
- Validaciones.

Dia 5:

- Contador de envio.
- Cancelar envio.
- Sin internet + llamar 116.

Dia 6:

- Asignacion de compania.
- Creacion de reporte.
- Navegacion bombero: Inicio, Reportes, Perfil.
- Reportes bombero solo nuevos y activos.

Dia 7:

- Estados: recibido, en camino, atendiendo, finalizado.
- Historial de estados.
- Sin prioridades visuales en reportes del bombero.

### Semana 2

Dia 8:

- Supabase Realtime.
- Seguimiento ciudadano.
- Ubicacion en vivo del bombero.

Dia 9:

- Mapa con Leaflet/OpenStreetMap.
- Ruta simple o linea.
- Distancia aproximada.

Dia 10:

- FCM Web Push o notificaciones en app con Realtime.
- Service worker.
- Manifest PWA.

Dia 11:

- Pulido visual profesional.
- Accesibilidad.
- Responsive movil/escritorio.

Dia 12:

- Desplegar frontend.
- Revisar Supabase.
- Datos semilla.
- Instalar PWA en celular.

Dia 13:

- Prueba completa.
- Capturas para informe.
- Video respaldo.

Dia 14:

- Ensayo de defensa.
- Congelar version.

## 18. Fuera de alcance

- APK.
- Play Store.
- Android nativo.
- Microservicios.
- Chat completo.
- IA.
- Realidad aumentada funcional.
- Google Maps.
- Google Routes.
- SMS real.

## 19. Criterios de aceptacion

### Ciudadano

- Dado que registro mis datos, cuando valido OTP simulado, entonces ingreso a la app.
- Dado que ingreso telefono y contrasena, entonces inicio sesion.
- Dado que inicio sesion desde un nuevo dispositivo, entonces valido OTP simulado.
- Dado que entro al inicio ciudadano, entonces solo veo como accion principal el boton Reportar emergencia.
- Dado que completo tipo, ubicacion y evidencia, cuando presiono enviar, entonces veo contador.
- Dado que cancelo durante el contador, entonces el reporte no se crea.
- Dado que no hay internet, entonces veo opcion llamar al 116.
- Dado que envio reporte, entonces veo seguimiento en tiempo real.
- Dado que un bombero va en camino, entonces veo su ubicacion en el mapa.

### Bombero

- Dado que ingreso codigo y contrasena, entonces valido OTP simulado.
- Dado que pertenezco a una compania, entonces veo solo reportes de esa compania.
- Dado que entro a Inicio bombero, entonces veo el boton Reportar emergencia.
- Dado que entro a Reportes, entonces veo solo reportes nuevos y activos de mi compania.
- Dado que entro a Perfil, entonces veo configuracion, historial y cuenta.
- Dado que veo reportes como bombero, entonces no se muestran prioridades visuales.
- Dado que un reporte esta ENVIADO, cuando marco RECIBIDO, entonces cambia el estado.
- Dado que marco EN_CAMINO, entonces quedo como respondiente principal.
- Dado que estoy en camino, entonces mi ubicacion se actualiza para el ciudadano.
- Dado que finalizo, entonces el reporte queda cerrado.

## 20. Prompt para el planificador de Codex

Usa este documento como especificacion principal para planificar e implementar AlertaBombero como PWA.

Construir una PWA con React, TypeScript, Vite, Tailwind, Supabase y Firebase Cloud Messaging. La app debe estar desplegada en una URL publica gratuita, poder instalarse en un celular, funcionar en web y movil, y seguir el diseno base de Figma con un acabado mas profesional.

Priorizar:

1. PWA desplegada.
2. Supabase configurado.
3. Login ciudadano y bombero.
4. OTP simulado.
5. Reporte con ubicacion y evidencia obligatoria.
6. Contador de envio con cancelar.
7. Sin internet + llamar 116.
8. Asignacion automatica a compania.
9. Navegacion bombero: Inicio, Reportes, Perfil.
10. Reportes bombero sin prioridades visuales.
11. Estados operativos.
12. Seguimiento en tiempo real.
13. Mapa con Leaflet/OpenStreetMap solo dentro del detalle/seguimiento.
14. Notificaciones con Supabase Realtime y, si alcanza, FCM Web Push.
15. UI profesional mobile-first.

No implementar Android nativo ni APK.
