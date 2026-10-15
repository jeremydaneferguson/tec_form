import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { projectScope } from '@/lib/project-access';

export async function GET(_request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    const { id } = await params;

    if (!id) {
      return Response.json({ error: 'Project id is required' }, { status: 400 });
    }

    const submission = await prisma.tECSubmission.findFirst({
      where: { id, ...projectScope(user) },
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

    return Response.json(summary, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json(
      { error: `Failed to fetch project details: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    const { id } = await params;

    if (!id) {
      return Response.json({ error: 'Project id is required' }, { status: 400 });
    }

    const submission = await prisma.tECSubmission.findFirst({
      where: { id, ...projectScope(user) },
    });

    if (!submission) {
      return Response.json({ error: 'Project not found' }, { status: 404 });
    }

    await prisma.tECSubmission.delete({
      where: { id },
    });

    return Response.json({ message: 'Project deleted successfully' }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: `Failed to delete project: ${error.message}` },
      { status: 500 }
    );
  }
}
