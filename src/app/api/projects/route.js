import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { projectScope, canViewAllProjects } from '@/lib/project-access';

export async function GET(req) {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    const submissions = await prisma.tECSubmission.findMany({
      where: projectScope(user),
      orderBy: { updatedAt: 'desc' },
    });

    // Map to project-like objects
    const projects = submissions.map((submission) => {
      const formData = submission.formData || {};

      return {
        id: submission.id,
        canEdit: submission.status === 'draft' && submission.email.toLowerCase() === user.email.toLowerCase(),
        canAssess: canViewAllProjects(user) && ['submitted', 'reviewed'].includes(submission.status),
        canDelete: submission.status === 'draft' || user.role.trim().toLowerCase() === 'admin',
        name: formData.projectName || submission.email,
        description: formData.projectType || '',
        projectType: formData.projectType || 'Not specified',
        client: formData.client || 'Not specified',
        reviewingDepartment: formData.reviewingDepartment || 'Not selected',
        contactName: formData.contactName || 'Not specified',
        status: submission.status,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
      };
    });

    return new Response(JSON.stringify(projects), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch projects' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
