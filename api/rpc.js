// Vercel serverless function: POST /api/rpc { method, args } with `Authorization: Bearer <token>`.
// Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the project's environment variables.
import { createHandler } from '../server/handler.js';
import { createSupabaseStore, supabaseConfigured } from '../server/supabase-store.js';

let handle;

export default async function rpc(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    res.status(200).json({ ok: true, database: supabaseConfigured() ? 'supabase' : 'missing' });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST.' });
    return;
  }
  if (!supabaseConfigured()) {
    res.status(503).json({ error: 'The database is not connected yet. Add the Supabase keys in Vercel.' });
    return;
  }
  handle ||= createHandler({ store: createSupabaseStore(), allowReset: process.env.STRIDE_ALLOW_RESET === 'true' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '') || null;
  const { status, body: out } = await handle({ method: body.method, args: body.args, token });
  res.status(status).json(out);
}
