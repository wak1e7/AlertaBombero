# Seguridad de Supabase

## Controles aplicados

- Todas las tablas expuestas de `public` tienen RLS habilitado.
- El bucket `report-evidence` es privado; solo participantes autorizados del reporte pueden leer sus objetos.
- Los cambios de estado, la creacion de reportes y la ubicacion en vivo se realizan mediante RPC con validaciones de rol, pertenencia a compania y transiciones permitidas.
- La clave `SUPABASE_SERVICE_ROLE_KEY` solo se usa en Edge Functions. Nunca debe incluirse en variables `VITE_*` ni en el frontend.
- La ruta heredada `link_firefighter_profile` fue eliminada y el autoaprovisionamiento de bomberos esta deshabilitado. La asignacion de una cuenta a un perfil precargado se realiza solo desde el panel administrativo de Supabase.
- Las nuevas tablas, secuencias y funciones de `public` no reciben permisos para `anon`, `authenticated` ni `service_role` por defecto. Cada objeto nuevo debe otorgar permisos de manera explicita y contar con RLS antes de exponerse.

## Alertas esperadas del asesor

Las RPC `create_emergency_report`, `set_report_status`, `upsert_live_location` y `complete_demo_otp` usan `SECURITY DEFINER` de forma intencional para ejecutar operaciones atomicas que no se permiten como escrituras directas. Cada una valida el usuario autenticado y las reglas de negocio antes de modificar datos.

`complete_demo_otp` existe solo para el modo demo. Antes de activar `VITE_AUTH_MODE=production`, reemplazarla por la verificacion de OTP real de Supabase Auth y revocar su ejecucion para `authenticated`.

## Lista previa a produccion

- Activar la proteccion contra contrasenas filtradas en Supabase Auth.
- Configurar proveedor SMS y OTP real; mantener `VITE_AUTH_MODE=production` hasta completar esa migracion.
- Agregar limitacion de tasa y proteccion antiabuso a `register-citizen` y `provision-firefighter`.
- Restringir `Access-Control-Allow-Origin` de las Edge Functions al dominio final de la aplicacion.
- Revisar periodicamente Security Advisor y confirmar que los permisos nuevos sean minimos.

## Provisionamiento de bomberos

Un administrador con acceso al panel de Supabase crea la cuenta en Auth con el correo tecnico `<codigo>@bombero.alertabombero.app` y, desde el SQL Editor, vincula su UUID al perfil precargado correspondiente. Esta operacion no se expone al navegador ni a una Edge Function publica.
