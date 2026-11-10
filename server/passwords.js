// Password and PIN hashing for the server backend: scrypt with a random salt per secret.
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { hashSecret as demoHash } from '../src/api/seed.js';

const KEYLEN = 32;
// Lower than Node's default cost so a cold serverless function signs in quickly. Still salted.
const OPTIONS = { N: 4096, r: 8, p: 1 };

export function hashPassword(secret) {
  const salt = randomBytes(16).toString('base64url');
  const hash = scryptSync(String(secret), salt, KEYLEN, OPTIONS).toString('base64url');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(secret, stored) {
  if (typeof stored !== 'string') return false;
  if (stored.startsWith('fnv1a$')) return demoHash(secret) === stored;
  const [kind, salt, hash] = stored.split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64url');
  const actual = scryptSync(String(secret), salt, expected.length, OPTIONS);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const newToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token) => createHash('sha256').update(String(token)).digest('hex');
