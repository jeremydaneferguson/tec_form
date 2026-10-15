const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const source = fs.readFileSync('src/lib/session.js', 'utf8').replace(/^import .*;\r?\n/gm, '').replace(/export async function /g, 'async function ');

(async () => {
  for (const [env, expectedSecure] of [
    [{ NODE_ENV: 'production' }, true],
    [{ NODE_ENV: 'production', SESSION_COOKIE_SECURE: 'false' }, false],
    [{ NODE_ENV: 'production', SESSION_COOKIE_SECURE: 'true' }, true],
    [{ NODE_ENV: 'production', SESSION_COOKIE_SECURE: 'invalid' }, true],
    [{ NODE_ENV: 'development' }, false],
    [{ NODE_ENV: 'development', SESSION_COOKIE_SECURE: 'true' }, true],
  ]) {
    const stored = new Map();
    let browserCookie;
    let issuedOptions;
    const jar = {
      get: () => browserCookie ? { value: browserCookie } : undefined,
      set: (name, value, options) => { assert.equal(name, 'tecSession'); browserCookie = value; issuedOptions = options; },
    };
    const user = { id: 'test-user', email: 'test@example.invalid', role: 'requestor' };
    const prisma = { session: {
      create: async ({ data }) => stored.set(data.tokenHash, { ...data, user }),
      findUnique: async ({ where }) => stored.get(where.tokenHash),
      deleteMany: async ({ where }) => stored.delete(where.tokenHash),
    } };
    const api = vm.runInNewContext(`(function() { ${source}; return { createSession, getSessionUser, destroySession }; })()`, { ...crypto, process: { env }, cookies: async () => jar, prisma, Response });
    await api.createSession(user.id);
    assert.equal(issuedOptions.secure, expectedSecure);
    assert.equal(issuedOptions.httpOnly, true);
    assert.equal(issuedOptions.sameSite, 'lax');
    assert.equal(issuedOptions.path, '/tec');
    assert.equal((await api.getSessionUser()).id, user.id);
    const firstToken = browserCookie;
    await api.createSession(user.id);
    assert.notEqual(browserCookie, firstToken);
    assert.equal(stored.size, 1);
    for (const session of stored.values()) session.expiresAt = new Date(0);
    assert.equal(await api.getSessionUser(), null);
    await api.destroySession();
    assert.equal(issuedOptions.maxAge, 0);
    assert.equal(issuedOptions.secure, expectedSecure);
    assert.equal(stored.size, 0);
    assert.equal(await api.getSessionUser(), null);
  }
  console.log('Session checks passed: HTTPS defaults, explicit HTTP override, cookie scope, authentication, expiry, rotation, logout.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
