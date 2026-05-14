import { prisma } from '@/lib/prisma';

export async function GET(_request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return Response.json({ error: 'Project id is required' }, { status: 400 });
    }

    const submission = await prisma.tECSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    const formData = submission.formData || {};

    const summary = {
      id: submission.id,
      email: submission.email,
      status: submission.status,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt,
      projectName: formData.projectName || 'Untitled Project',
      projectType: formData.projectType || 'Not specified',
      client: formData.client || 'Not specified',
      contactName: formData.contactName || 'Not specified',
      contactTelephone: formData.contactTelephone || 'Not specified',
      reviewingDepartment: formData.reviewingDepartment || 'Not selected',
      date: formData.date || null,
      formData,
    };

    return Response.json(summary, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: `Failed to fetch project details: ${error.message}` },
      { status: 500 }
    );
  }
}
