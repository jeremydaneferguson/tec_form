import { prisma } from '@/lib/prisma';

const ROLES = ['requestor', 'approver', 'admin'];

function isValidRole(role) {
  return typeof role === 'string' && ROLES.includes(role);
}

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, department: true },
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
    const { email, role, department } = await request.json();

    const normalizedDepartment = typeof department === 'string' ? department.trim() : '';

    if (!email || !isValidRole(role) || !normalizedDepartment) {
      return Response.json(
        { error: 'Valid email, role, and department are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        role,
        department: normalizedDepartment,
      },
      select: { id: true, email: true, role: true, department: true },
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
    const { id, role, department } = await request.json();

    const data = {};

    if (role !== undefined) {
      if (!isValidRole(role)) {
        return Response.json(
          { error: 'Valid role is required' },
          { status: 400 }
        );
      }
      data.role = role;
    }

    if (department !== undefined) {
      const normalizedDepartment = typeof department === 'string' ? department.trim() : '';
      if (!normalizedDepartment) {
        return Response.json(
          { error: 'Valid department is required' },
          { status: 400 }
        );
      }
      data.department = normalizedDepartment;
    }

    if (!id || Object.keys(data).length === 0) {
      return Response.json(
        { error: 'User ID and at least one valid field are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, department: true },
    });

    return Response.json(user, { status: 200 });
  } catch (error) {
    if (error?.code === 'P2025') {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(
      { error: `Failed to update user: ${error.message}` },
      { status: 500 }
    );
  }
}
