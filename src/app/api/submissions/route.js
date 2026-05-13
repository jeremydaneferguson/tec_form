import { prisma } from '@/lib/prisma';

// POST: Save form submission
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, formData } = body;

    if (!email) {
      return Response.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if submission with this email already exists
    const existingSubmission = await prisma.tECSubmission.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' },
    });

    let submission;

    if (existingSubmission && existingSubmission.status === 'draft') {
      // Update existing draft
      submission = await prisma.tECSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          formData: formData || existingSubmission.formData,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new submission
      submission = await prisma.tECSubmission.create({
        data: {
          email,
          formData: formData || {},
          status: 'draft',
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
    const email = searchParams.get('email');

    if (!email) {
      return Response.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const submission = await prisma.tECSubmission.findFirst({
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
