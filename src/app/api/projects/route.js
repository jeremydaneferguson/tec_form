import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // Fetch all submissions as projects
    const submissions = await prisma.tECSubmission.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    // Map to project-like objects
    const projects = submissions.map((submission) => {
      const formData = submission.formData || {};

      return {
        id: submission.id,
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
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch projects' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
