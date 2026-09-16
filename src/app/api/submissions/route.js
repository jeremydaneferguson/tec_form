import { prisma } from '@/lib/prisma';

// POST: Save form submission
export async function POST(request) {
  try {
    const body = await request.json();
    const { id, email, formData, status } = body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!id && !normalizedEmail) {
      return Response.json(
        { error: 'Email is required' },
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
