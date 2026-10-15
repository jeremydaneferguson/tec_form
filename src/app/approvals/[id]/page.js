import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { canReview } from '@/lib/workflow';
import TECAssessmentForm from '@/components/TECAssessmentForm';

export default async function ApprovalPage({ params }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!canReview(user)) redirect('/projects');
  const { id } = await params;
  return <TECAssessmentForm approvalId={id} />;
}
