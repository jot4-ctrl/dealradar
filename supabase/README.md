# Backend de facturación de DealRadar

La función `dealradar-billing` valida el ID de suscripción directamente con PayPal y mantiene el acceso Premium en Supabase. El navegador nunca recibe el secreto de PayPal.

## Variables privadas de Supabase

Configurar en Edge Functions > Secrets:

- `PAYPAL_CLIENT_ID`: client ID de la app REST de PayPal.
- `PAYPAL_CLIENT_SECRET`: secret de la misma app REST.
- `PAYPAL_PLAN_ID`: `P-8H2197778H455993KNLKXUSQ`.
- `PAYPAL_WEBHOOK_ID`: ID del webhook creado en PayPal.
- `PAYPAL_ENVIRONMENT`: `live` para producción o `sandbox` para pruebas.

Supabase entrega automáticamente `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` a la función.

## Base de datos

Ejecutar `migrations/202610180001_billing.sql` en el SQL Editor del proyecto `hfbelrcpgtstkccfwfol`.

## URL del webhook

`https://hfbelrcpgtstkccfwfol.supabase.co/functions/v1/dealradar-billing`

En PayPal registrar esa URL para `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.UPDATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.SUSPENDED`, `BILLING.SUBSCRIPTION.EXPIRED` y `BILLING.SUBSCRIPTION.PAYMENT.FAILED`.
