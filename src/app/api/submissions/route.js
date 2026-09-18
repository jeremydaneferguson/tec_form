import { prisma } from '@/lib/prisma';

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
  const errors = [];
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

// POST: Save form submission
export async function POST(request) {
  try {
    const body = await request.json();
    const { id, email, formData, status } = body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const validationErrors = validateSubmissionFields({
      email: normalizedEmail,
      formData,
      status,
      requireEmail: !id,
    });

    if (validationErrors.length > 0) {
      return Response.json(
        { error: validationErrors.join('. ') },
        { status: 400 }
      );
    }

    if (id) {
      const existingSubmission = await prisma.tECSubmission.findUnique({
        where: { id },
      });

      if (!existingSubmission) {
        return Response.json(
          { error: 'Submission not found' },
          { status: 404 }
        );
      }

      const submission = await prisma.tECSubmission.update({
        where: { id },
        data: {
          email: normalizedEmail || existingSubmission.email,
          formData: formData || existingSubmission.formData,
          status: status || existingSubmission.status,
          updatedAt: new Date(),
        },
      });

      return Response.json(submission, { status: 200 });
    }

    // Check if submission with this email already exists
    const existingSubmission = await prisma.tECSubmission.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
    });

    let submission;
    const nextStatus = status || 'draft';

    if (existingSubmission && existingSubmission.status === 'draft') {
      // Update existing draft
      submission = await prisma.tECSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          formData: formData || existingSubmission.formData,
          status: nextStatus,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new submission
      submission = await prisma.tECSubmission.create({
        data: {
          email: normalizedEmail,
          formData: formData || {},
          status: nextStatus,
        },
      });
    }

    return Response.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error saving submission:', error);
    return Response.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    );
  }
}

// GET: Retrieve form submission by email
export async function GET(request) {
  try {
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
      ? await prisma.tECSubmission.findUnique({
          where: { id },
        })
      : await prisma.tECSubmission.findFirst({
          where: { email },
          orderBy: { createdAt: 'desc' },
        });

    if (!submission) {
      return Response.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return Response.json(submission);
  } catch (error) {
    console.error('Error retrieving submission:', error);
    return Response.json(
      { error: 'Failed to retrieve submission' },
      { status: 500 }
    );
  }
}
