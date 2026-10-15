import { destroySession, getSessionUser } from '@/lib/session';

export async function GET() {
  const user = await getSessionUser();
  return user
    ? Response.json({ user }, { headers: { 'Cache-Control': 'no-store' } })
    : Response.json({ error: 'Sign in required' }, { status: 401 });
}

export async function DELETE() {
  await destroySession();
  return Response.json({ message: 'Signed out' });
}
