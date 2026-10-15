import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { canReview } from '@/lib/workflow';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
    if (!canReview(user)) return Response.json({ error: 'Approver access required' }, { status: 403 });
    const submissions = await prisma.tECSubmission.findMany({
      where: { status: { in: ['submitted', 'reviewed', 'approved'] } },
      orderBy: { updatedAt: 'desc' },
    });
    return Response.json(submissions.map((record) => ({
      id: record.id, email: record.email, status: record.status, updatedAt: record.updatedAt,
      name: record.formData?.projectName || 'Untitled project',
      department: record.formData?.reviewingDepartment || 'Not selected',
      approval: record.formData?.approval || null,
    })), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Failed to load approvals' }, { status: 500 });
  }
}
