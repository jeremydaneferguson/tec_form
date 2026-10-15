import { prisma } from '@/lib/prisma';
import { normalizeFormDetails, validateFormDetails } from '@/lib/form-details';
import { validateAttachments } from '@/lib/attachments';
import { getSessionUser } from '@/lib/session';
import { projectScope } from '@/lib/project-access';
import { canReview, requestorData, reviewData, requestorCompletionErrors, REVIEW_DEPARTMENT_STEPS } from '@/lib/workflow';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const telephoneAllowedPattern = /^\+?[\d\s().-]+$/;

const isValidEmail = (value) => emailPattern.test(String(value || '').trim());

const isValidTelephone = (value) => {
  const normalizedValue = String(value || '').trim();
  const digitCount = normalizedValue.replace(/\D/g, '').length;

  return telephoneAllowedPattern.test(normalizedValue) && digitCount >= 7 && digitCount <= 15;
};

const isValidDateValue = (value) => {
  const normalizedValue = String(value || '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return false;
  }

  const [year, month, day] = normalizedValue.split('-').map(Number);
  const parsedDate = new Date(year, month - 1, day);

  return parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day;
};

const isFutureDate = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number);
  const selectedDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selectedDate > today;
};

const getFormValue = (formData, fieldName) =>
  typeof formData?.[fieldName] === 'string' ? formData[fieldName].trim() : '';

const validateSubmissionFields = ({ email, formData, status, requireEmail }) => {
  const errors = validateAttachments(formData);
  const date = getFormValue(formData, 'date');
  const contactTelephone = getFormValue(formData, 'contactTelephone');
  const isSubmitting = status === 'submitted';

  if (requireEmail && !email) {
    errors.push('Email is required');
  } else if (email && !isValidEmail(email)) {
    errors.push('A valid email is required');
  }

  if (isSubmitting && !date) {
    errors.push('Date is required');
  } else if (date && (!isValidDateValue(date) || isFutureDate(date))) {
    errors.push('A valid non-future date is required');
  }

  if (isSubmitting && !contactTelephone) {
    errors.push('Contact Telephone is required');
  } else if (contactTelephone && !isValidTelephone(contactTelephone)) {
    errors.push('A valid contact telephone number is required');
  }

  return errors;
};

// Requestors submit steps 1–2; reviewers assess submitted records in steps 3–6.
export async function POST(request) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    const { id, formData = {}, status, workflow } = await request.json();
    if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
      return Response.json({ error: 'Form data must be an object' }, { status: 400 });
    }
    const reviewing = workflow === 'approval';
    if (reviewing && !canReview(user)) {
      return Response.json({ error: 'Approver access required' }, { status: 403 });
    }
    if (reviewing && !id) return Response.json({ error: 'Select a submitted form to assess' }, { status: 400 });
    const nextStatus = status || (reviewing ? 'submitted' : 'draft');
    if (!(reviewing ? ['submitted', 'approved'] : ['draft', 'submitted']).includes(nextStatus)) {
      return Response.json({ error: 'This status transition is not allowed' }, { status: 403 });
    }
    const ownerScope = { email: { equals: user.email, mode: 'insensitive' } };
    const existing = id
      ? await prisma.tECSubmission.findFirst({ where: { id, ...(reviewing ? {} : ownerScope) } })
      : await prisma.tECSubmission.findFirst({ where: { ...ownerScope, status: 'draft' }, orderBy: { createdAt: 'desc' } });
    if (id && !existing) return Response.json({ error: 'Submission not found' }, { status: 404 });
    if (existing && !(reviewing ? ['submitted', 'reviewed'] : ['draft']).includes(existing.status)) {
      return Response.json({ error: reviewing ? 'Only pending submissions can be assessed' : 'Submitted forms are read-only. View the project to track its approval.' }, { status: 409 });
    }
    const data = normalizeFormDetails(reviewing
      ? { ...requestorData(existing.formData), ...reviewData(formData) }
      : requestorData(formData));
    const errors = [...validateFormDetails(data), ...validateSubmissionFields({ email: user.email, formData: data, status: nextStatus, requireEmail: true })];
    if (!reviewing && nextStatus === 'submitted') errors.push(...requestorCompletionErrors(data));
    if (reviewing && nextStatus === 'approved') {
      if (!Object.hasOwn(REVIEW_DEPARTMENT_STEPS, data.reviewingDepartment || '')) errors.push('Select a reviewing department');
      const prefix = `deptReview_${String(data.reviewingDepartment || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}_`;
      if (!Object.entries(data).some(([key, value]) => key.startsWith(prefix) && value !== '' && value !== null && value !== undefined && (!Array.isArray(value) || value.length > 0))) {
        errors.push('Complete the departmental assessment before approving');
      }
      data.approval = { approvedBy: user.email, approvedAt: new Date().toISOString() };
    }
    if (errors.length) return Response.json({ error: errors.join('. ') }, { status: 400 });
    if (existing) {
      const result = await prisma.tECSubmission.updateMany({
        where: { id: existing.id, status: existing.status, updatedAt: existing.updatedAt },
        data: { formData: data, status: nextStatus, updatedAt: new Date() },
      });
      if (!result.count) return Response.json({ error: 'This form changed. Reload before saving.' }, { status: 409 });
      return Response.json(await prisma.tECSubmission.findFirst({ where: { id: existing.id } }));
    }
    const submission = await prisma.tECSubmission.create({ data: { email: user.email.toLowerCase(), formData: data, status: nextStatus } });
    return Response.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error saving submission:', error);
    return Response.json({ error: 'Failed to save submission' }, { status: 500 });
  }
}

// GET: Retrieve form submission by email
export async function GET(request) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (!id && !email) {
      return Response.json(
        { error: 'Submission id or email parameter is required' },
        { status: 400 }
      );
    }

    const submission = id
      ? await prisma.tECSubmission.findFirst({
          where: { id, ...projectScope(user) },
        })
      : await prisma.tECSubmission.findFirst({
          where: { AND: [{ email: { equals: email, mode: 'insensitive' } }, projectScope(user)] },
          orderBy: { createdAt: 'desc' },
        });

    if (!submission) {
      return Response.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return Response.json(submission, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Error retrieving submission:', error);
    return Response.json(
      { error: 'Failed to retrieve submission' },
      { status: 500 }
    );
  }
}
