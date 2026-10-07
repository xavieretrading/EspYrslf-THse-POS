/**
 * Push notifications for the S1p & Sp1n customer app (Firebase Cloud Messaging, HTTP v1).
 *
 * The Firebase service-account key is NEVER stored in the repo. Provide it with one of:
 *  - FIREBASE_SERVICE_ACCOUNT       the key file's JSON content (Cloud Run: a Secret Manager secret)
 *  - FIREBASE_SERVICE_ACCOUNT_FILE  a path to the key file (local testing)
 * Without either, sending is skipped and everything else keeps working.
 */
import crypto from 'crypto';
import fs from 'fs';
import type { SupabaseClient } from '@supabase/supabase-js';

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

let account: ServiceAccount | null | undefined;
function getAccount(): ServiceAccount | null {
  if (account !== undefined) return account;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT || (process.env.FIREBASE_SERVICE_ACCOUNT_FILE ? fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE, 'utf8') : '');
    account = raw ? JSON.parse(raw) : null;
  } catch (e: any) {
    console.error('[push] Could not read the Firebase service account:', e.message);
    account = null;
  }
  if (!account) console.warn('[push] Firebase not configured: push notifications are off.');
  return account;
}

export const pushEnabled = () => !!getAccount();

let cachedToken: { value: string; exp: number } | null = null;

async function accessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }),
  });
  const data: any = await res.json();
  if (!res.ok) throw new Error(`Firebase auth failed: ${data.error_description || data.error || res.status}`);
  cachedToken = { value: data.access_token, exp: Date.now() + (data.expires_in || 3600) * 1000 };
  return cachedToken.value;
}

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>; // e.g. { type: 'order', orderKey: 'req-12' } — tells the app which screen to open
}

/** Sends to each device. Returns how many were delivered and which tokens are no longer valid. */
export async function sendPush(tokens: string[], msg: PushMessage): Promise<{ sent: number; invalid: string[] }> {
  const sa = getAccount();
  if (!sa || tokens.length === 0) return { sent: 0, invalid: [] };
  const auth = await accessToken(sa);
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  let sent = 0;
  const invalid: string[] = [];

  for (let i = 0; i < tokens.length; i += 20) {
    await Promise.all(
      tokens.slice(i, i + 20).map(async token => {
        const res = await fetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: {
              token,
              notification: { title: msg.title, body: msg.body },
              data: msg.data || {},
              android: {
                priority: 'HIGH',
                notification: { channel_id: 'laundry', icon: 'ic_stat_notify', color: '#0B6BBB', visibility: 'PUBLIC', sound: 'default' },
              },
            },
          }),
        }).catch(() => null);
        if (res?.ok) {
          sent++;
          return;
        }
        const err: any = res ? await res.json().catch(() => ({})) : {};
        const code = err?.error?.details?.find((d: any) => d.errorCode)?.errorCode || err?.error?.status;
        if (code === 'UNREGISTERED' || code === 'INVALID_ARGUMENT' || res?.status === 404) invalid.push(token);
        else console.error('[push] send failed:', res?.status, err?.error?.message || '');
      })
    );
  }
  return { sent, invalid };
}

/** Saves the update in each customer's in-app "Updates" list (laundry_notifications). */
export async function saveNotifications(supabase: SupabaseClient, customerIds: number[], msg: PushMessage) {
  if (!customerIds.length) return;
  const rows = customerIds.map(id => ({ customer_id: id, title: msg.title, body: msg.body, data: msg.data || {} }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await supabase.from('laundry_notifications').insert(rows.slice(i, i + 500));
    if (error) {
      console.error('[notifications] could not save:', error.message);
      return;
    }
  }
}

/** Sends to all phones of the given customers and forgets phones that uninstalled the app. */
export async function pushToCustomers(supabase: SupabaseClient, customerIds: number[], msg: PushMessage): Promise<number> {
  if (!pushEnabled() || customerIds.length === 0) return 0;
  const { data } = await supabase.from('laundry_push_tokens').select('token').in('customer_id', customerIds);
  const tokens = (data || []).map(r => r.token);
  const { sent, invalid } = await sendPush(tokens, msg);
  if (invalid.length) await supabase.from('laundry_push_tokens').delete().in('token', invalid);
  return sent;
}

/** Fire-and-forget helper for status updates: saves it to the customer's Updates list and sends a phone notification. */
export function notifyCustomer(supabase: SupabaseClient, customerId: number | null | undefined, msg: PushMessage) {
  if (!customerId) return;
  saveNotifications(supabase, [customerId], msg).catch(e => console.error('[notifications]', e.message));
  if (pushEnabled()) pushToCustomers(supabase, [customerId], msg).catch(e => console.error('[push]', e.message));
}
