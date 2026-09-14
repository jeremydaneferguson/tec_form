import { prisma } from '@/lib/prisma';

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

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedRole = typeof role === 'string' ? role.trim() : '';
    const normalizedDepartment = typeof department === 'string' ? department.trim() : '';

    if (!normalizedEmail || !normalizedRole || !normalizedDepartment) {
      return Response.json(
        { error: 'Valid email, role, and department are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        role: normalizedRole,
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
    const { id, email, role, department } = await request.json();

    const data = {};

    if (email !== undefined) {
      const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!normalizedEmail) {
        return Response.json({ error: 'Valid email is required' }, { status: 400 });
      }
      data.email = normalizedEmail;
    }

    if (role !== undefined) {
      const normalizedRole = typeof role === 'string' ? role.trim() : '';
      if (!normalizedRole) {
        return Response.json({ error: 'Valid role is required' }, { status: 400 });
      }
      data.role = normalizedRole;
    }

    if (department !== undefined) {
      const normalizedDepartment = typeof department === 'string' ? department.trim() : '';
      if (!normalizedDepartment) {
        return Response.json({ error: 'Valid department is required' }, { status: 400 });
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
    if (error?.code === 'P2002') {
      return Response.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    return Response.json(
      { error: `Failed to update user: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // no body
      }
    }

    if (!id) {
      return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return Response.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    if (error?.code === 'P2025') {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json(
      { error: `Failed to delete user: ${error.message}` },
      { status: 500 }
    );
  }
}
