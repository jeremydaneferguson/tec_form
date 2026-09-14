import { prisma } from '@/lib/prisma';

const PROTECTED_ROLES = ['admin', 'requestor', 'approver'];

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return Response.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description } = body;

    const existing = await prisma.role.findUnique({
      where: { id },
    });

    if (!existing) {
      return Response.json({ error: 'Role not found' }, { status: 404 });
    }

    const data = {};
    const oldName = existing.name;

    if (name !== undefined) {
      const trimmedName =
        typeof name === 'string'
          ? name.trim().toLowerCase().replace(/\s+/g, '_')
          : '';
      if (!trimmedName) {
        return Response.json({ error: 'Role name cannot be empty' }, { status: 400 });
      }

      // If existing is protected and trying to change name
      if (PROTECTED_ROLES.includes(oldName) && trimmedName !== oldName) {
        return Response.json(
          { error: `The system role "${oldName}" cannot be renamed.` },
          { status: 400 }
        );
      }
      data.name = trimmedName;
    }

    if (description !== undefined) {
      data.description = typeof description === 'string' ? description.trim() : null;
    }

    const updated = await prisma.role.update({
      where: { id },
      data,
    });

    // If role name changed, update existing users assigned to old role
    if (data.name && data.name !== oldName) {
      await prisma.user.updateMany({
        where: { role: oldName },
        data: { role: data.name },
      });
    }

    return Response.json(updated, { status: 200 });
  } catch (error) {
    if (error?.code === 'P2002') {
      return Response.json(
        { error: 'A role with this name already exists' },
        { status: 409 }
      );
    }
    return Response.json(
      { error: `Failed to update role: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return Response.json({ error: 'Role ID is required' }, { status: 400 });
    }

    const existing = await prisma.role.findUnique({
      where: { id },
    });

    if (!existing) {
      return Response.json({ error: 'Role not found' }, { status: 404 });
    }

    if (PROTECTED_ROLES.includes(existing.name)) {
      return Response.json(
        { error: `The system role "${existing.name}" is required and cannot be deleted.` },
        { status: 400 }
      );
    }

    // Check if users have this role
    const userCount = await prisma.user.count({
      where: { role: existing.name },
    });

    if (userCount > 0) {
      return Response.json(
        {
          error: `Cannot delete role "${existing.name}" because ${userCount} user(s) currently have this role. Please reassign those users first.`,
        },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id },
    });

    return Response.json(
      { message: `Role "${existing.name}" deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: `Failed to delete role: ${error.message}` },
      { status: 500 }
    );
  }
}
