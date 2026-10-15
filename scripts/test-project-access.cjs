const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function load(relativePath, bindings = {}) {
  let source = fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
  source = source.replace(/^import .*;\r?\n/gm, '').replace(/export async function /g, 'async function ').replace(/export function /g, 'function ').replace(/export const /g, 'const ');
  return vm.runInNewContext(`(function() { ${source}; return { ${relativePath.includes('form-details') ? 'normalizeFormDetails, validateFormDetails, detailText' : relativePath.includes('workflow') ? 'canReview, requestorData, reviewData, requestorCompletionErrors, REVIEW_DEPARTMENT_STEPS' : relativePath.includes('attachments') ? 'validateAttachments, MAX_ATTACHMENT_BYTES' : relativePath.includes('project-access') ? 'canViewAllProjects, projectScope' : 'GET, ' + (relativePath.includes('submissions') ? 'POST' : relativePath.includes('[id]') ? 'DELETE' : '')} }; })()`, { Response, Request, URL, console, ...bindings });
}

const policy = load('src/lib/project-access.js');
const attachmentPolicy = load('src/lib/attachments.js');
const workflowPolicy = load('src/lib/workflow.js');
const detailsPolicy = load('src/lib/form-details.js');
const records = [
  { id: 'own', email: 'OWNER@example.com', formData: {}, status: 'draft' },
  { id: 'other', email: 'other@example.com', formData: {}, status: 'draft' },
];
let user;
let queries = 0;
const matches = (record, where = {}) => Object.entries(where).every(([key, value]) => {
  if (key === 'AND') return value.every((part) => matches(record, part));
  if (value && typeof value === 'object' && value.in) return value.in.includes(record[key]);
  if (key === 'email' && typeof value === 'object') return record.email.toLowerCase() === value.equals.toLowerCase();
  return record[key] === value;
});
const prisma = { tECSubmission: {
  findMany: async ({ where }) => { queries++; return records.filter((r) => matches(r, where)); },
  findFirst: async ({ where }) => { queries++; return records.find((r) => matches(r, where)) || null; },
  updateMany: async ({ where, data }) => { const record = records.find((r) => matches(r, where)); if (!record) return { count: 0 }; Object.assign(record, data); return { count: 1 }; },
  update: async ({ where, data }) => Object.assign(records.find((r) => r.id === where.id), data),
  create: async ({ data }) => ({ id: 'new', ...data }),
  delete: async () => { throw new Error('Unauthorized delete reached database'); },
} };
const bindings = { prisma, getSessionUser: async () => user, ...policy, ...attachmentPolicy, ...workflowPolicy, ...detailsPolicy };
const list = load('src/app/api/projects/route.js', bindings);
const approvals = load('src/app/api/approvals/route.js', bindings);
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
  assert.equal((await approvals.GET()).status, 401);
  assert.equal(queries, 0);
  const normalized = detailsPolicy.normalizeFormDetails({ objectives: '4', 'documentation-rating': '8', utilities: ['Fibre (ICT)', 'Fibre (ICT)', ' LPG '], approvalsRecommendations: '{"tender Committee":{"stage2":true,"stage3":"false"}}' });
  assert.equal(normalized.objectives, 4);
  assert.equal(normalized.documentationRating, 8);
  assert.equal(normalized['documentation-rating'], undefined);
  assert.equal(normalized.utilities.join('|'), 'Fibre (ICT)|LPG');
  assert.equal(normalized.approvalsRecommendations['Tender Committee'].stage2, true);
  assert.equal(normalized.approvalsRecommendations['Tender Committee'].stage3, false);
  assert.equal(detailsPolicy.validateFormDetails(normalized).length, 0);
  assert.equal(detailsPolicy.validateFormDetails({ objectives: 6 }).length, 1);
  assert.equal(detailsPolicy.validateFormDetails({ documentationRating: 11 }).length, 1);
  assert.equal(detailsPolicy.validateFormDetails({ approvalsRecommendations: { Other: { stage1: 'yes' } } }).length, 1);
  assert.equal(detailsPolicy.detailText('objectives', 4), '4 / 5 — Agree');
  assert.equal(detailsPolicy.detailText('approvalsRecommendations', normalized.approvalsRecommendations), 'Tender Committee: Stage 2');

  const maxFile = Buffer.alloc(attachmentPolicy.MAX_ATTACHMENT_BYTES).toString('base64');
  assert.equal(attachmentPolicy.validateAttachments({ existingBuildingAreaAttachment: { name: 'maximum.bin', size: attachmentPolicy.MAX_ATTACHMENT_BYTES, data: maxFile } }).length, 0);
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
    const attachment = { name: 'building-plan.pdf', size: 5, data: Buffer.from('hello').toString('base64') };
    const attachmentData = { existingBuildingArea: '120 m2', proposedBuildingArea: '150 m2', existingBuildingAreaAttachment: attachment, proposedBuildingAreaAttachment: { ...attachment, name: 'proposed-plan.pdf' } };
    assert.equal((await submissions.POST(post({ id: 'own', formData: attachmentData }))).status, 200);
    const reopened = await (await submissions.GET(request('id=own'))).json();
    assert.deepEqual(reopened.formData, attachmentData);
    assert.equal(Buffer.from(reopened.formData.existingBuildingAreaAttachment.data, 'base64').toString(), 'hello');
    assert.equal((await submissions.GET(request('id=other'))).status, 404);
    assert.equal((await submissions.POST(post({ id: 'own', formData: { existingBuildingAreaAttachment: { ...attachment, size: 6 } } }))).status, 400);
    assert.equal((await submissions.POST(post({ id: 'own', formData: { existingBuildingAreaAttachment: { ...attachment, size: attachmentPolicy.MAX_ATTACHMENT_BYTES + 1 } } }))).status, 400);
    assert.equal((await submissions.POST(post({ id: 'own', formData: { existingBuildingAreaAttachment: { ...attachment, data: 'invalid' } } }))).status, 400);
    assert.equal((await submissions.POST(post({ id: 'own', formData: { ...attachmentData, existingBuildingAreaAttachment: null } }))).status, 200);
    assert.equal((await (await submissions.GET(request('id=own'))).json()).formData.existingBuildingAreaAttachment, null);

  }
  user = { email: 'owner@example.com', role: 'requestor' };
  assert.equal((await approvals.GET()).status, 403);
  assert.equal((await submissions.POST(post({ id: 'own', workflow: 'approval', status: 'approved' }))).status, 403);
  assert.equal((await submissions.POST(post({ id: 'own', status: 'approved' }))).status, 403);
  assert.equal((await submissions.POST(post({ id: 'own', status: 'submitted', formData: {} }))).status, 400);
  const completed = {
    projectName: 'Workflow regression', client: 'Test client', contactName: 'Test owner',
    projectType: 'new', date: '2026-01-01', contactTelephone: '8765550101',
    preciseBuildingLocation: 'Campus', existingBuildingArea: '100', proposedBuildingArea: '120',
    topography: 'Level', buildingFunction: 'Teaching', utilityChargesResponsibility: 'Campus',
  };
  assert.equal((await submissions.POST(post({ id: 'own', status: 'submitted', formData: { ...completed, reviewingDepartment: 'EMD', deptReview_emd_test: 'forged', approval: { approvedBy: 'forged' } } }))).status, 200);
  const pendingRecord = await (await submissions.GET(request('id=own'))).json();
  assert.equal(pendingRecord.status, 'submitted');
  assert.equal(pendingRecord.formData.reviewingDepartment, undefined);
  assert.equal(pendingRecord.formData.approval, undefined);
  assert.equal((await submissions.POST(post({ id: 'own', status: 'draft', formData: completed }))).status, 409);
  assert.equal((await details.DELETE(null, context('own'))).status, 409);
  for (const role of ['approver', 'admin']) {
    user = { email: `${role}@example.com`, role };
    assert.equal((await (await approvals.GET()).json()).some((record) => record.id === 'own'), true);
    assert.equal((await (await approvals.GET()).json()).some((record) => record.id === 'other'), false);
    assert.equal((await submissions.POST(post({ id: 'other', workflow: 'approval', status: 'approved', formData: {} }))).status, 409);
  }
  user = { email: 'approver@example.com', role: 'approver' };
  assert.equal((await submissions.POST(post({ id: 'own', workflow: 'approval', formData: { ...completed, projectName: 'Tampered', reviewingDepartment: 'EMD', deptReview_emd_adequacy: 'adequate', objectives: '4', 'documentation-rating': '8' } }))).status, 200);
  const assessed = await (await submissions.GET(request('id=own'))).json();
  assert.equal(assessed.status, 'submitted');
  assert.equal(assessed.formData.objectives, 4);
  assert.equal(assessed.formData.documentationRating, 8);
  assert.equal((await submissions.POST(post({ id: 'own', workflow: 'approval', formData: { ...assessed.formData, objectives: 7 } }))).status, 400);
  assert.equal(assessed.formData.projectName, completed.projectName);
  assert.equal(assessed.formData.deptReview_emd_adequacy, 'adequate');
  assert.equal((await submissions.POST(post({ id: 'own', workflow: 'approval', status: 'approved', formData: {} }))).status, 400);
  assert.equal((await submissions.POST(post({ id: 'own', workflow: 'approval', status: 'approved', formData: assessed.formData }))).status, 200);
  const approved = await (await submissions.GET(request('id=own'))).json();
  assert.equal(approved.status, 'approved');
  assert.equal(approved.formData.approval.approvedBy, user.email);
  assert.ok(approved.formData.approval.approvedAt);
  assert.equal((await submissions.POST(post({ id: 'own', workflow: 'approval', formData: assessed.formData }))).status, 409);
  user = { email: 'owner@example.com', role: 'requestor' };
  assert.equal((await details.GET(null, context('own'))).status, 200);
  assert.equal((await submissions.POST(post({ id: 'own', formData: completed }))).status, 409);
  console.log('Project access regression checks passed (anonymous, admin, approver, requestor, custom role, direct links, ownership spoofing, attachments and Requestor-to-Approver workflow).');
})().catch((error) => { console.error(error); process.exitCode = 1; });
