import { verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: 'Valid JSON body is required' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const rawPassword = typeof password === 'string' ? password : '';

    if (!normalizedEmail || !rawPassword) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const users = await prisma.$queryRaw`
      SELECT id, email, role, department, "passwordHash"
      FROM "User"
      WHERE email = ${normalizedEmail}
      LIMIT 1
    `;
    const user = users[0];

    const isValid = user && await verifyPassword(rawPassword, user.passwordHash);

    if (!isValid) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const { passwordHash, ...safeUser } = user;
    return Response.json({ user: safeUser }, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: `Login failed: ${error.message}` },
      { status: 500 }
    );
  }
}
