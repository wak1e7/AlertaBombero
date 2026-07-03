# Autenticacion demo vs produccion

## Modo actual

La app usa `VITE_AUTH_MODE=demo` por defecto. En este modo:

- Se muestran credenciales demo en las pantallas de acceso.
- El OTP visible para demo es `116116`.
- La verificacion final usa la RPC `complete_demo_otp`.

## Modo produccion

`VITE_AUTH_MODE=production` esta reservado y falla cerrado. En este modo:

- No se muestran credenciales demo.
- No se muestra el OTP `116116`.
- Los flujos que dependen de OTP simulado devuelven `Autenticacion productiva aun no esta configurada.`

## Pendiente para activar produccion

- Configurar proveedor SMS en Supabase Auth.
- Reemplazar OTP simulado por `signInWithOtp` y `verifyOtp`, o por una Edge Function/RPC que valide codigos con expiracion, intentos y uso unico.
- Retirar o restringir `complete_demo_otp` del flujo productivo.
- Agregar rate limiting y auditoria a las Edge Functions de registro/provisionamiento.
