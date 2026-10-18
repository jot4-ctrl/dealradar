# Conectar autenticación real

DealRadar está preparado para usar Supabase Auth desde GitHub Pages.

1. Crear un proyecto en Supabase.
2. En Authentication, habilitar Email y contraseña.
3. Copiar la URL del proyecto y la clave pública `anon`.
4. Pegarlas en `auth-config.js` como `url` y `anonKey`.
5. Confirmar el origen `https://jot4-ctrl.github.io` en Redirect URLs.

La clave `anon` es pública y está pensada para usarse en el navegador. Nunca colocar una `service_role` en este repositorio.
