import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // Fetch all submissions as projects
    const submissions = await prisma.tECSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Map to project-like objects
    const projects = submissions.map((submission) => ({
      id: submission.id,
      name: submission.formData?.projectName || submission.email,
      description: submission.formData?.projectType || '',
      createdAt: submission.createdAt,
    }));

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
