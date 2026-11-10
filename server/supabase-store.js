// Keeps the database in Supabase Postgres. The server talks to it with the service role key,
// which never reaches the browser. Row level security is on for every table with no policies,
// so the public anon key can read or write nothing; every request goes through /api/rpc.
import { createClient } from '@supabase/supabase-js';
import { DB_VERSION, emptyDb } from '../src/api/seed.js';
import { fromRow, tables, toRow, writeOrder } from './schema.js';

const PAGE = 1000;
const CHUNK = 500;

export function supabaseConfigured(env = process.env) {
  return !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createSupabaseStore(env = process.env) {
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const fail = (what, error) => {
    if (error) throw new Error(`Supabase ${what}: ${error.message}`);
  };

  async function readAll(table) {
    const rows = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await client.from(table).select('*').order('id').range(from, from + PAGE - 1);
      fail(`read ${table}`, error);
      rows.push(...data);
      if (data.length < PAGE) return rows;
    }
  }

  async function upsert(table, objects) {
    for (let i = 0; i < objects.length; i += CHUNK) {
      const rows = objects.slice(i, i + CHUNK).map((o) => toRow(table, o));
      const { error } = await client.from(table).upsert(rows, { onConflict: 'id' });
      fail(`write ${table}`, error);
    }
  }

  async function remove(table, ids) {
    for (let i = 0; i < ids.length; i += CHUNK) {
      const { error } = await client.from(table).delete().in('id', ids.slice(i, i + CHUNK));
      fail(`delete from ${table}`, error);
    }
  }

  return {
    async load() {
      const loaded = await Promise.all(writeOrder.map((t) => readAll(t)));
      // Seeded only once the catalogue is there too; a half-finished seed gets filled in again.
      const has = (table) => loaded[writeOrder.indexOf(table)].length > 0;
      if (!has('users') || !has('mentors') || !has('clubs') || !has('lessons')) return null;
      const db = emptyDb();
      db.version = DB_VERSION;
      writeOrder.forEach((table, i) => {
        for (const row of loaded[i]) db[table][row.id] = fromRow(table, row);
      });
      return db;
    },

    async replaceAll(db) {
      for (const table of [...writeOrder].reverse()) {
        const { error } = await client.from(table).delete().neq('id', '');
        fail(`clear ${table}`, error);
      }
      for (const table of writeOrder) await upsert(table, Object.values(db[table] || {}));
    },

    // Inserts any seed rows that are missing and leaves existing rows alone.
    async fillMissing(db) {
      for (const table of writeOrder) {
        const objects = Object.values(db[table] || {});
        for (let i = 0; i < objects.length; i += CHUNK) {
          const rows = objects.slice(i, i + CHUNK).map((o) => toRow(table, o));
          const { error } = await client.from(table).upsert(rows, { onConflict: 'id', ignoreDuplicates: true });
          fail(`seed ${table}`, error);
        }
      }
    },

    async saveChanges(changes) {
      for (const table of writeOrder) if (changes[table]?.upsert.length) await upsert(table, changes[table].upsert);
      for (const table of [...writeOrder].reverse()) if (changes[table]?.remove.length) await remove(table, changes[table].remove);
    },

    async createSession(tokenHash, userId, expiresAt) {
      const { error } = await client.from('sessions').insert({ token_hash: tokenHash, user_id: userId, expires_at: expiresAt });
      fail('create session', error);
    },

    async getSession(tokenHash) {
      const { data, error } = await client
        .from('sessions')
        .select('user_id, expires_at')
        .eq('token_hash', tokenHash)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      fail('read session', error);
      return data ? data.user_id : null;
    },

    async deleteSession(tokenHash) {
      const { error } = await client.from('sessions').delete().eq('token_hash', tokenHash);
      fail('delete session', error);
    },

    async deleteAllSessions() {
      const { error } = await client.from('sessions').delete().neq('token_hash', '');
      fail('clear sessions', error);
    }
  };
}

export { tables };
