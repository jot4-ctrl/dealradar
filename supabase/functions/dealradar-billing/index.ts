import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dealradar.site',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

const env = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Falta configurar ${name} en Supabase.`);
  return value;
};

const paypalBaseUrl = () =>
  Deno.env.get('PAYPAL_ENVIRONMENT') === 'sandbox'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

const supabaseAdmin = () => createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

async function paypalAccessToken() {
  const clientId = env('PAYPAL_CLIENT_ID');
  const clientSecret = env('PAYPAL_CLIENT_SECRET');
  const credentials = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error('PayPal no pudo autenticar la validación.');
  return data.access_token as string;
}

async function paypalSubscription(subscriptionId: string) {
  const token = await paypalAccessToken();
  const response = await fetch(`${paypalBaseUrl()}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}?fields=plan`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const data = await response.json();
  if (!response.ok) throw new Error('PayPal no reconoce esta suscripción.');
  return data;
}

async function verifyPaypalWebhook(request: Request, event: Record<string, unknown>) {
  const token = await paypalAccessToken();
  const headers = (name: string) => request.headers.get(name) || '';
  const response = await fetch(`${paypalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers('paypal-auth-algo'),
      cert_url: headers('paypal-cert-url'),
      transmission_id: headers('paypal-transmission-id'),
      transmission_sig: headers('paypal-transmission-sig'),
      transmission_time: headers('paypal-transmission-time'),
      webhook_id: env('PAYPAL_WEBHOOK_ID'),
      webhook_event: event,
    }),
  });
  const data = await response.json();
  return response.ok && data.verification_status === 'SUCCESS';
}

async function authenticatedUser(request: Request) {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7);
  const client = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user;
}

const safeSnapshot = (subscription: Record<string, any>) => ({
  id: subscription.id,
  status: subscription.status,
  plan_id: subscription.plan_id,
  custom_id: subscription.custom_id || null,
  status_update_time: subscription.status_update_time || null,
  next_billing_time: subscription.billing_info?.next_billing_time || null,
});

async function claim(request: Request, userId: string, body: Record<string, unknown>) {
  const subscriptionId = String(body.subscriptionId || '').trim();
  if (!/^I-[A-Z0-9]+$/i.test(subscriptionId)) return json({ error: 'ID de suscripción inválido.' }, 400);
  const subscription = await paypalSubscription(subscriptionId);
  const expectedPlanId = env('PAYPAL_PLAN_ID');
  if (subscription.plan_id !== expectedPlanId) return json({ error: 'La suscripción no corresponde al plan de DealRadar.' }, 400);
  if (subscription.custom_id && subscription.custom_id !== userId) return json({ error: 'La suscripción pertenece a otra cuenta.' }, 403);

  const admin = supabaseAdmin();
  const { data: existing } = await admin.from('billing_subscriptions')
    .select('user_id').eq('provider', 'paypal').eq('provider_subscription_id', subscriptionId).maybeSingle();
  if (existing && existing.user_id !== userId) return json({ error: 'La suscripción ya está vinculada a otra cuenta.' }, 403);

  const periodEnd = subscription.billing_info?.next_billing_time || null;
  const row = {
    user_id: userId,
    provider: 'paypal',
    provider_subscription_id: subscriptionId,
    plan_id: subscription.plan_id,
    status: String(subscription.status || 'pending').toLowerCase(),
    payer_email: subscription.subscriber?.email_address || null,
    current_period_end: periodEnd,
    last_event_at: subscription.status_update_time || new Date().toISOString(),
    provider_snapshot: safeSnapshot(subscription),
  };
  const { error } = await admin.from('billing_subscriptions').upsert(row, { onConflict: 'provider,provider_subscription_id' });
  if (error) throw new Error('No se pudo guardar el estado de la suscripción.');
  return json({
    ok: true,
    status: row.status,
    hasAccess: row.status === 'active',
    currentPeriodEnd: periodEnd,
  });
}

async function status(userId: string) {
  const admin = supabaseAdmin();
  const { data, error } = await admin.from('billing_subscriptions')
    .select('provider,provider_subscription_id,status,current_period_end,updated_at')
    .eq('user_id', userId).order('updated_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error('No se pudo consultar el estado del acceso.');
  const hasAccess = data?.provider === 'paypal' && data.status === 'active';
  return json({ ok: true, hasAccess, status: data?.status || 'none', currentPeriodEnd: data?.current_period_end || null });
}

async function webhook(request: Request, event: Record<string, any>) {
  if (!(await verifyPaypalWebhook(request, event))) return json({ error: 'Firma de PayPal inválida.' }, 401);
  const subscriptionId = event.resource?.billing_agreement_id || event.resource?.id;
  if (!subscriptionId) return json({ received: true });
  const statusByEvent: Record<string, string> = {
    'BILLING.SUBSCRIPTION.ACTIVATED': 'active',
    'BILLING.SUBSCRIPTION.UPDATED': String(event.resource?.status || 'active').toLowerCase(),
    'BILLING.SUBSCRIPTION.CANCELLED': 'cancelled',
    'BILLING.SUBSCRIPTION.SUSPENDED': 'suspended',
    'BILLING.SUBSCRIPTION.EXPIRED': 'expired',
    'BILLING.SUBSCRIPTION.PAYMENT.FAILED': 'past_due',
  };
  const nextStatus = statusByEvent[event.event_type];
  if (!nextStatus) return json({ received: true });
  const admin = supabaseAdmin();
  await admin.from('billing_subscriptions').update({
    status: nextStatus,
    last_event_at: event.create_time || new Date().toISOString(),
    provider_snapshot: { event_id: event.id, event_type: event.event_type, resource_id: event.resource?.id || null },
  }).eq('provider', 'paypal').eq('provider_subscription_id', subscriptionId);
  return json({ received: true });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await request.json();
    if (body.action === 'webhook') return await webhook(request, body.event || body);
    const user = await authenticatedUser(request);
    if (!user) return json({ error: 'Necesitás iniciar sesión.' }, 401);
    if (body.action === 'claim') return await claim(request, user.id, body);
    if (body.action === 'status') return await status(user.id);
    return json({ error: 'Operación no reconocida.' }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'Error interno de facturación.' }, 500);
  }
});
