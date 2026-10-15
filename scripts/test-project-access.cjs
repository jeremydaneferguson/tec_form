const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function load(relativePath, bindings = {}) {
  let source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  source = source.replace(/^import .*;\r?\n/gm, '').replace(/export async function /g, 'async function ').replace(/export function /g, 'function ');
  return vm.runInNewContext(`(function() { ${source}; return { ${relativePath.includes('project-access') ? 'canViewAllProjects, projectScope' : 'GET, ' + (relativePath.includes('submissions') ? 'POST' : relativePath.includes('[id]') ? 'DELETE' : '')} }; })()`, { Response, Request, URL, console, ...bindings });
}

const policy = load('src/lib/project-access.js');
const records = [
  { id: 'own', email: 'OWNER@example.com', formData: {}, status: 'draft' },
  { id: 'other', email: 'other@example.com', formData: {}, status: 'draft' },
];
let user;
let queries = 0;
const matches = (record, where = {}) => Object.entries(where).every(([key, value]) => {
  if (key === 'AND') return value.every((part) => matches(record, part));
  if (key === 'email' && typeof value === 'object') return record.email.toLowerCase() === value.equals.toLowerCase();
  return record[key] === value;
});
const prisma = { tECSubmission: {
  findMany: async ({ where }) => { queries++; return records.filter((r) => matches(r, where)); },
  findFirst: async ({ where }) => { queries++; return records.find((r) => matches(r, where)) || null; },
  update: async ({ where, data }) => ({ ...records.find((r) => r.id === where.id), ...data }),
  create: async ({ data }) => ({ id: 'new', ...data }),
  delete: async () => { throw new Error('Unauthorized delete reached database'); },
} };
const bindings = { prisma, getSessionUser: async () => user, ...policy };
const list = load('src/app/api/projects/route.js', bindings);
const details = load('src/app/api/projects/[id]/route.js', bindings);
const submissions = load('src/app/api/submissions/route.js', bindings);
const context = (id) => ({ params: Promise.resolve({ id }) });
const request = (query) => new Request(`http://localhost/tec/api/submissions?${query}`);
const post = (body) => ({ json: async () => body });

(async () => {
  assert.equal((await list.GET()).status, 401);
  assert.equal((await details.GET(null, context('own'))).status, 401);
  assert.equal((await submissions.GET(request('id=own'))).status, 401);
  assert.equal((await submissions.POST(post({}))).status, 401);
  assert.equal(queries, 0);
  for (const role of ['admin', 'approver', ' Admin ']) {
    user = { email: 'owner@example.com', role };
    assert.equal((await (await list.GET()).json()).length, 2);
    assert.equal((await details.GET(null, context('other'))).status, 200);
    assert.equal((await submissions.GET(request('id=other'))).status, 200);
  }
  for (const role of ['requestor', 'custom-role']) {
    user = { email: 'owner@example.com', role };
    assert.deepEqual((await (await list.GET()).json()).map((r) => r.id), ['own']);
    assert.equal((await details.GET(null, context('own'))).status, 200);
    assert.equal((await details.GET(null, context('other'))).status, 404);
    assert.equal((await details.DELETE(null, context('other'))).status, 404);
    assert.equal((await submissions.GET(request('id=other'))).status, 404);
    assert.equal((await submissions.GET(request('email=other@example.com'))).status, 404);
    assert.equal((await submissions.GET(request('email=owner@example.com'))).status, 200);
    assert.equal((await submissions.POST(post({ id: 'other', formData: {} }))).status, 404);
    const saved = await (await submissions.POST(post({ email: 'other@example.com', formData: {} }))).json();
    assert.equal(saved.email.toLowerCase(), user.email);
    const updated = await (await submissions.POST(post({ id: 'own', email: 'other@example.com', formData: {} }))).json();
    assert.equal(updated.email, 'OWNER@example.com');
  }
  console.log('Project access regression checks passed (anonymous, admin, approver, requestor, custom role, direct links, ownership spoofing).');
})().catch((error) => { console.error(error); process.exitCode = 1; });
