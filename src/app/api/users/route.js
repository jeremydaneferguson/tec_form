import { prisma } from '@/lib/prisma';

const ROLES = ['requestor', 'approver', 'admin'];

function isValidRole(role) {
  return typeof role === 'string' && ROLES.includes(role);
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true },
      orderBy: { email: 'asc' },
    });

    return Response.json(users, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: `Failed to fetch users: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { email, role } = await request.json();

    if (!email || !isValidRole(role)) {
      return Response.json(
        { error: 'Valid email and role are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        role,
      },
      select: { id: true, email: true, role: true },
    });

    return Response.json(user, { status: 201 });
  } catch (error) {
    if (error?.code === 'P2002') {
      return Response.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    return Response.json(
      { error: `Failed to create user: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const { id, role } = await request.json();

    if (!id || !isValidRole(role)) {
      return Response.json(
        { error: 'User ID and valid role are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });

    return Response.json(user, { status: 200 });
  } catch (error) {
    if (error?.code === 'P2025') {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(
      { error: `Failed to update user role: ${error.message}` },
      { status: 500 }
    );
  }
}
