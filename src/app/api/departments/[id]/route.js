import { prisma } from '@/lib/prisma';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return Response.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { name, code, description } = body;

    const existing = await prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      return Response.json({ error: 'Department not found' }, { status: 404 });
    }

    const data = {};
    const oldName = existing.name;

    if (name !== undefined) {
      const trimmedName = typeof name === 'string' ? name.trim() : '';
      if (!trimmedName) {
        return Response.json({ error: 'Department name cannot be empty' }, { status: 400 });
      }
      data.name = trimmedName;
    }

    if (code !== undefined) {
      data.code =
        typeof code === 'string' && code.trim()
          ? code.trim().toLowerCase().replace(/\s+/g, '_')
          : null;
    }

    if (description !== undefined) {
      data.description = typeof description === 'string' ? description.trim() : null;
    }

    const updated = await prisma.department.update({
      where: { id },
      data,
    });

    // If department name changed, update existing users assigned to old name
    if (data.name && data.name !== oldName) {
      await prisma.user.updateMany({
        where: { department: oldName },
        data: { department: data.name },
      });
    }

    return Response.json(updated, { status: 200 });
  } catch (error) {
    if (error?.code === 'P2002') {
      return Response.json(
        { error: 'A department with this name or code already exists' },
        { status: 409 }
      );
    }
    return Response.json(
      { error: `Failed to update department: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return Response.json({ error: 'Department ID is required' }, { status: 400 });
    }

    const existing = await prisma.department.findUnique({
      where: { id },
    });

    if (!existing) {
      return Response.json({ error: 'Department not found' }, { status: 404 });
    }

    // Check if users are assigned to this department
    const userCount = await prisma.user.count({
      where: { department: existing.name },
    });

    if (userCount > 0) {
      return Response.json(
        {
          error: `Cannot delete department "${existing.name}" because ${userCount} user(s) are currently assigned to it. Please reassign those users first.`,
        },
        { status: 400 }
      );
    }

    await prisma.department.delete({
      where: { id },
    });

    return Response.json(
      { message: `Department "${existing.name}" deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { error: `Failed to delete department: ${error.message}` },
      { status: 500 }
    );
  }
}
