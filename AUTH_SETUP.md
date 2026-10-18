# Conectar autenticación real

DealRadar está preparado para usar Supabase Auth desde GitHub Pages.

1. Crear un proyecto en Supabase.
2. En Authentication, habilitar Email y contraseña.
3. Copiar la URL del proyecto y la clave pública `anon`.
4. Pegarlas en `auth-config.js` como `url` y `anonKey`.
5. En Authentication > URL Configuration, usar como Site URL `https://jot4-ctrl.github.io/dealradar/`.
6. Agregar también `https://jot4-ctrl.github.io/dealradar/` en Redirect URLs.

El registro de DealRadar envía automáticamente esa dirección como retorno del email de confirmación. La ruta incluye `/dealradar/` porque el sitio está publicado como proyecto de GitHub Pages; sin esa subcarpeta GitHub Pages muestra que no existe el sitio.

La clave `anon` es pública y está pensada para usarse en el navegador. Nunca colocar una `service_role` en este repositorio.
