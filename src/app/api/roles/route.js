import { prisma } from '@/lib/prisma';

const DEFAULT_ROLES = [
  { name: 'requestor', description: 'Submits proposals and views own submissions' },
  { name: 'approver', description: 'Reviews and provides departmental assessment feedback' },
  { name: 'admin', description: 'System administrator with full access to users, roles, and settings' },
];

export async function GET() {
  try {
    let roles = [];

    try {
      roles = await prisma.role.findMany({
        orderBy: { name: 'asc' },
      });

      // Auto-seed defaults if table is empty
      if (roles.length === 0) {
        for (const role of DEFAULT_ROLES) {
          await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
          });
        }
        roles = await prisma.role.findMany({
          orderBy: { name: 'asc' },
        });
      }
    } catch {
      // Fallback if table doesn't exist yet before migration
      roles = DEFAULT_ROLES.map((r, index) => ({
        id: `role_${index + 1}`,
        ...r,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }

    // Get user counts per role
    let userCounts = {};
    try {
      const users = await prisma.user.findMany({
        select: { role: true },
      });
      for (const u of users) {
        if (u.role) {
          userCounts[u.role] = (userCounts[u.role] || 0) + 1;
        }
      }
    } catch {
      // ignore
    }

    const result = roles.map((r) => ({
      ...r,
      userCount: userCounts[r.name] || 0,
    }));

    return Response.json(result, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: `Failed to fetch roles: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    const trimmedName =
      typeof name === 'string'
        ? name.trim().toLowerCase().replace(/\s+/g, '_')
        : '';

    if (!trimmedName) {
      return Response.json({ error: 'Role name is required' }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        name: trimmedName,
        description: typeof description === 'string' ? description.trim() : null,
      },
    });

    return Response.json(role, { status: 201 });
  } catch (error) {
    if (error?.code === 'P2002') {
      return Response.json(
        { error: 'A role with this name already exists' },
        { status: 409 }
      );
    }
    return Response.json(
      { error: `Failed to create role: ${error.message}` },
      { status: 500 }
    );
  }
}
