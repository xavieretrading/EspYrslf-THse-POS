/**
 * Staff login for the POS (all branches).
 *
 * - Passwords are checked on the server. Old plain-text passwords still work and are replaced with a
 *   bcrypt hash the first time that person logs in, so nobody has to reset their password.
 * - A successful login returns a signed token; the POS sends it with every /api request.
 * - STAFF_AUTH_REQUIRED=1 makes the token mandatory. Leave it off for the first days after deploying,
 *   so every terminal can log in once and get a token; then turn it on.
 * - Tokens are signed with STAFF_TOKEN_SECRET (falls back to CUSTOMER_TOKEN_SECRET) so all Cloud Run
 *   copies accept them and they survive restarts.
 */
import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SECRET = process.env.STAFF_TOKEN_SECRET || process.env.CUSTOMER_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.STAFF_TOKEN_SECRET && !process.env.CUSTOMER_TOKEN_SECRET) {
  console.warn('[staff-auth] No STAFF_TOKEN_SECRET: staff logins reset when the server restarts.');
}
const TOKEN_TTL_MS = 90 * 24 * 3600 * 1000; // POS terminals stay logged in for 90 days

export const staffAuthRequired = () => process.env.STAFF_AUTH_REQUIRED === '1';

// Columns that are safe to send to the browser (never the password)
export const PUBLIC_USER_COLUMNS = 'id, username, email, full_name, role, branch_id, permissions, is_active';
export function publicUser(u: any) {
  if (!u) return u;
  const { password, ...rest } = u;
  return rest;
}

function sign(userId: number, role: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, role, exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  const mac = crypto.createHmac('sha256', SECRET).update(`staff.${payload}`).digest('base64url');
  return `${payload}.${mac}`;
}

export function verifyStaffToken(token: string): { uid: number; role: string } | null {
  const [payload, mac] = String(token || '').split('.');
  if (!payload || !mac) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(`staff.${payload}`).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.uid || data.exp < Date.now()) return null;
    return { uid: Number(data.uid), role: String(data.role || '') };
  } catch {
    return null;
  }
}

/** Which kind of key is set (never the key itself). Must be "service_role" or "secret" for the database lock to work. */
function describeServiceKey(key?: string): string {
  if (!key) return 'none';
  if (key.startsWith('sb_secret_')) return 'secret (correct)';
  if (key.startsWith('sb_publishable_')) return 'publishable (WRONG: use the secret key)';
  try {
    const role = JSON.parse(Buffer.from(key.split('.')[1] || '', 'base64url').toString()).role;
    return role === 'service_role' ? 'service_role (correct)' : `${role || 'unknown'} (WRONG: use the service_role key)`;
  } catch {
    return 'unknown';
  }
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
const isHash = (s: string) => /^\$2[aby]\$/.test(s || '');

/**
 * Express middleware for /api. Skips the customer app routes (they have their own login) and the login route.
 * Sets req.staff when a valid token is sent. Rejects requests without one only when STAFF_AUTH_REQUIRED=1.
 */
export function staffAuthMiddleware(): express.RequestHandler {
  return (req, res, next) => {
    if (req.path.startsWith('/customer/') || req.path === '/customer' || req.path === '/auth/login' || req.path === '/auth/status') return next();
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const staff = token ? verifyStaffToken(token) : null;
    if (staff) (req as any).staff = staff;
    if (!staff && staffAuthRequired()) return res.status(401).json({ error: 'Please log in again.' });
    next();
  };
}

/** Use on admin-only routes. Only enforced when STAFF_AUTH_REQUIRED=1 (before that, behaviour is unchanged). */
export const requireAdmin: express.RequestHandler = (req, res, next) => {
  if (!staffAuthRequired()) return next();
  if ((req as any).staff?.role === 'admin') return next();
  return res.status(403).json({ error: 'Only an administrator can do this.' });
};

export function createStaffAuthRouter(supabase: SupabaseClient, supabaseUrl: string, anonKey: string) {
  const router = express.Router();
  router.use(express.json({ limit: '20kb' }));

  // Separate client for Supabase Auth checks, so it never stores a session on the main client
  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // Simple brute-force protection per login name
  const attempts = new Map<string, { count: number; until: number }>();

  router.post('/login', async (req, res) => {
    const login = String(req.body?.login || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!login || !password) return res.status(400).json({ error: 'Enter your username or email and password.' });

    const a = attempts.get(login);
    if (a && a.until > Date.now()) return res.status(429).json({ error: 'Too many wrong passwords. Try again in 10 minutes.' });

    const name = login.split('@')[0];
    const { data: users, error } = await supabase.from('users_espresso').select('*').eq('is_active', 1);
    if (error) return res.status(500).json({ error: error.message });
    const user = (users || []).find((u: any) => String(u.email || '').toLowerCase() === login || String(u.username || '').toLowerCase() === name);

    let ok = false;
    if (user?.password) {
      if (isHash(user.password)) ok = await bcrypt.compare(password, user.password);
      else if (user.password === password) {
        ok = true;
        // Upgrade the stored plain-text password to a hash
        const hashed = await hashPassword(password);
        await supabase.from('users_espresso').update({ password: hashed }).eq('id', user.id);
      }
    }
    // Some accounts were created with Supabase Auth; accept those passwords too
    if (!ok && user && login.includes('@')) {
      const { data } = await authClient.auth.signInWithPassword({ email: login, password }).catch(() => ({ data: null as any }));
      ok = !!data?.user;
    }

    if (!ok || !user) {
      const cur = attempts.get(login) || { count: 0, until: 0 };
      cur.count++;
      if (cur.count >= 8) {
        cur.until = Date.now() + 10 * 60 * 1000;
        cur.count = 0;
      }
      attempts.set(login, cur);
      return res.status(401).json({ error: 'Wrong username/email or password.' });
    }
    attempts.delete(login);
    res.json({ token: sign(user.id, user.role), user: publicUser(user) });
  });

  // Which security stages are on (no secrets): open /api/auth/status in a browser to check the rollout
  router.get('/status', (_req, res) => {
    res.json({
      serviceKeyInUse: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      serviceKeyType: describeServiceKey(process.env.SUPABASE_SERVICE_ROLE_KEY),
      staffLoginRequired: staffAuthRequired(),
      tokenSecretSet: !!(process.env.STAFF_TOKEN_SECRET || process.env.CUSTOMER_TOKEN_SECRET),
    });
  });

  // Fresh profile for the logged-in device (role, permissions and branch may have changed)
  router.get('/me', async (req, res) => {
    const staff = (req as any).staff;
    if (!staff) return res.status(401).json({ error: 'Please log in again.' });
    const { data: user } = await supabase.from('users_espresso').select(PUBLIC_USER_COLUMNS).eq('id', staff.uid).eq('is_active', 1).maybeSingle();
    if (!user) return res.status(401).json({ error: 'Please log in again.' });
    res.json({ user, authRequired: staffAuthRequired() });
  });

  return router;
}
