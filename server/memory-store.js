// An in-memory store with the same shape as supabase-store.js. Used by the tests and by
// `npm run dev:server` when no Supabase keys are set.
export function createMemoryStore() {
  let db = null;
  const sessions = new Map();
  return {
    async load() {
      return db ? structuredClone(db) : null;
    },
    async replaceAll(next) {
      db = structuredClone(next);
    },
    async fillMissing(seed) {
      db ||= structuredClone(seed);
      for (const [name, rows] of Object.entries(seed)) {
        if (typeof rows !== 'object') continue;
        db[name] ||= {};
        for (const [id, row] of Object.entries(rows)) db[name][id] ||= structuredClone(row);
      }
    },
    async saveChanges(changes) {
      for (const [name, { upsert, remove }] of Object.entries(changes)) {
        for (const id of remove) delete db[name][id];
        for (const row of upsert) db[name][row.id] = structuredClone(row);
      }
    },
    async createSession(tokenHash, userId, expiresAt) {
      sessions.set(tokenHash, { userId, expiresAt });
    },
    async getSession(tokenHash) {
      const s = sessions.get(tokenHash);
      return s && s.expiresAt > new Date().toISOString() ? s.userId : null;
    },
    async deleteSession(tokenHash) {
      sessions.delete(tokenHash);
    },
    async deleteAllSessions() {
      sessions.clear();
    }
  };
}
