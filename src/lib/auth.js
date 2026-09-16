import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

export const DEFAULT_PASSWORD = 'Open1234!';
export const DEFAULT_PASSWORD_HASH =
  'scrypt$16384$8$1$dGVjLWRlZmF1bHQtcGFzc3dvcmQtMjAyNi0wOQ==$LRK8msQSTYL60hb6+sfmZtP0lVV/bnxBaJNZVdCKE1p7NcSIdUEp+3KkB9KVktRtMwjtE9RyvhjKeHmFRfD7YA==';

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

export async function hashPassword(password = DEFAULT_PASSWORD) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);

  return [
    'scrypt',
    SCRYPT_OPTIONS.N,
    SCRYPT_OPTIONS.r,
    SCRYPT_OPTIONS.p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$');
}

export async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }

  const [, rawN, rawR, rawP, rawSalt, rawKey] = parts;
  const options = {
    N: Number(rawN),
    r: Number(rawR),
    p: Number(rawP),
  };

  if (!options.N || !options.r || !options.p) {
    return false;
  }

  const salt = Buffer.from(rawSalt, 'base64');
  const expectedKey = Buffer.from(rawKey, 'base64');
  const actualKey = await scryptAsync(password, salt, expectedKey.length, options);

  return actualKey.length === expectedKey.length && timingSafeEqual(actualKey, expectedKey);
}
