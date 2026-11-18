import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  acceptClub,
  completeSetup,
  confirmSession,
  createFamily,
  decideClub,
  deleteFamily,
  familyForToken,
  finishTask,
  joinFamily,
  openDatabase,
  readState,
  releaseMessage,
  requestClub,
  rotateInvite,
  sendMessage,
  sendReport,
  shareRecord,
  updateProfile,
  updateSettings,
  withdrawRequest
} from './db.js';
import { acceptMember, claimOrg, confirmMember, confirmMentorTask, mintStaff, readOrg } from './orgs.js';

const root = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(root, '..', 'dist');
const dbFile = process.env.STRIDE_DB ? resolve(process.env.STRIDE_DB) : join(root, 'data', 'stride.db');
mkdirSync(dirname(dbFile), { recursive: true });
const db = openDatabase(dbFile);

const fileTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.map': 'application/json'
};

function insideWeb(file) {
  const rootWithSep = webRoot.endsWith(sep) ? webRoot : `${webRoot}${sep}`;
  return file === webRoot || file.startsWith(rootWithSep);
}

function serveWeb(req, res, url) {
  if (!existsSync(join(webRoot, 'index.html'))) {
    res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('The site has not been built yet.');
    return;
  }

  let pathname = '/';
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }
  if (pathname.includes('\0')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  const requested = pathname === '/' ? '/index.html' : pathname;
  let file = resolve(webRoot, `.${requested}`);
  const missing = !insideWeb(file) || !existsSync(file) || !statSync(file).isFile();
  if (missing) {
    if (extname(requested) || !insideWeb(file)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    file = join(webRoot, 'index.html');
  }

  const cache = file.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache';
  res.writeHead(200, {
    'Content-Type': fileTypes[extname(file)] || 'application/octet-stream',
    'Cache-Control': cache
  });
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  const stream = createReadStream(file);
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end();
  });
  stream.pipe(res);
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(body));
}

function fail(res, error) {
  const status = { forbidden: 403, rate_limited: 429, unknown: 404, expired: 410, unauthorized: 401 }[error] || 400;
  send(res, status, { error });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    req.on('error', reject);
  });
}

function tokenOf(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : '';
}

function clientIp(req) {
  return req.socket?.remoteAddress || 'local';
}

function forRole(role, value) {
  if (!value?.state || role !== 'leader') return value;
  return { ...value, state: { ...value.state, messages: [], reports: [] } };
}

function answer(res, value, ok = 200, role) {
  if (value?.error) {
    fail(res, value.error);
    return;
  }
  send(res, ok, forRole(role, value));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  if (!url.pathname.startsWith('/api')) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      send(res, 405, { error: 'method' });
      return;
    }
    serveWeb(req, res, url);
    return;
  }

  if (req.method === 'OPTIONS') {
    send(res, 204, {});
    return;
  }

  try {
    if (req.method === 'GET' && url.pathname === '/api/health') {
      send(res, 200, { ok: true });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/families') {
      const body = await readBody(req);
      answer(res, createFamily(db, { role: body.role, state: body.state || {}, timezone: body.timezone }), 201);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/families/join') {
      const body = await readBody(req);
      const joined = joinFamily(db, body.code, clientIp(req), body.door === 'staff' ? 'staff' : 'family');
      if (joined?.scope === 'org') {
        const orgSession = familyForToken(db, joined.token);
        answer(res, { ...joined, org: readOrg(db, orgSession), revision: orgSession.revision });
        return;
      }
      answer(res, joined);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/orgs/open') {
      const body = await readBody(req);
      answer(res, claimOrg(db, body.clubId), 201);
      return;
    }

    const session = familyForToken(db, tokenOf(req));
    if (!session) {
      send(res, 401, { error: 'unauthorized' });
      return;
    }

    if (session.scope === 'org') {
      if (req.method === 'GET' && url.pathname === '/api/org') {
        const org = readOrg(db, session);
        send(res, 200, { revision: org.revision, role: session.role, clubId: session.org_id, mentorId: session.mentor_id, org });
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/org/accept') {
        const body = await readBody(req);
        answer(res, acceptMember(db, session, body.familyId));
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/org/confirm') {
        const body = await readBody(req);
        answer(res, confirmMember(db, session, body.familyId));
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/org/invites') {
        const body = await readBody(req);
        answer(res, mintStaff(db, session, body.role, body.mentorId), 201);
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/org/tasks') {
        const body = await readBody(req);
        answer(res, confirmMentorTask(db, session, body.familyId, body.lessonId));
        return;
      }
      send(res, 404, { error: 'not_found' });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/state') {
      send(res, 200, forRole(session.role, {
        revision: session.revision,
        role: session.role,
        clubId: session.club_id,
        state: readState(db, session.family_id)
      }));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/setup') {
      const body = await readBody(req);
      answer(res, completeSetup(db, session, body), 200, session.role);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/profile') {
      const body = await readBody(req);
      answer(res, updateProfile(db, session, body), 200, session.role);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/requests') {
      const body = await readBody(req);
      answer(res, requestClub(db, session, body.clubId), 201, session.role);
      return;
    }

    const requestDecision = url.pathname.match(/^\/api\/requests\/([^/]+)\/decision$/);
    if (req.method === 'POST' && requestDecision) {
      const body = await readBody(req);
      answer(res, decideClub(db, session, decodeURIComponent(requestDecision[1]), body.decision), 200, session.role);
      return;
    }

    const requestId = url.pathname.match(/^\/api\/requests\/([^/]+)$/);
    if (req.method === 'DELETE' && requestId) {
      answer(res, withdrawRequest(db, session, decodeURIComponent(requestId[1])), 200, session.role);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/messages') {
      const body = await readBody(req);
      answer(res, sendMessage(db, session, body), 201, session.role);
      return;
    }

    const messageId = url.pathname.match(/^\/api\/messages\/([^/]+)$/);
    if (req.method === 'POST' && messageId) {
      const body = await readBody(req);
      answer(res, releaseMessage(db, session, decodeURIComponent(messageId[1]), body.status), 200, session.role);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/reports') {
      const body = await readBody(req);
      answer(res, sendReport(db, session, body.reason), 201, session.role);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/settings') {
      const body = await readBody(req);
      answer(res, updateSettings(db, session, body), 200, session.role);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/share') {
      answer(res, shareRecord(db, session), 200, session.role);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/tasks') {
      const body = await readBody(req);
      answer(res, finishTask(db, session, body.lessonId), 200, session.role);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/leader/accept') {
      answer(res, acceptClub(db, session), 200, session.role);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/leader/confirm') {
      answer(res, confirmSession(db, session), 200, session.role);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/invites') {
      const body = await readBody(req);
      answer(res, rotateInvite(db, session, body.role, body.clubId), 201, session.role);
      return;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/family') {
      answer(res, deleteFamily(db, session), 200, session.role);
      return;
    }

    send(res, 404, { error: 'not_found' });
  } catch (error) {
    send(res, 500, { error: error.message || 'server_error' });
  }
});

const port = Number(process.env.PORT || process.env.STRIDE_PORT || 8787);
server.listen(port, '0.0.0.0', () => {
  console.log(`Stride listening on http://127.0.0.1:${port}`);
});
