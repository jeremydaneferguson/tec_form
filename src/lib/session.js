import { createHash, randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const COOKIE_NAME = 'tecSession';
const MAX_AGE = 60 * 60 * 8;
const hashToken = (token) => createHash('sha256').update(token).digest('hex');
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/tec',
};

export async function createSession(userId) {
  const jar = await cookies();
  const previousToken = jar.get(COOKIE_NAME)?.value;
  if (previousToken) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(previousToken) } });
  }
  const token = randomBytes(32).toString('hex');
  await prisma.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + MAX_AGE * 1000) },
  });
  jar.set(COOKIE_NAME, token, { ...cookieOptions, maxAge: MAX_AGE });
}

export async function getSessionUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, role: true, department: true } } },
  });
  return session && session.expiresAt > new Date() ? session.user : null;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.set(COOKIE_NAME, '', { ...cookieOptions, maxAge: 0 });
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: 'Sign in required' }, { status: 401 });
  if (user.role.trim().toLowerCase() !== 'admin') {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }
  return null;
}
