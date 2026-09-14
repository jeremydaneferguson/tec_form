import { prisma } from '@/lib/prisma';

const DEFAULT_DEPARTMENTS = [
  { name: 'EMD', code: 'emd', description: 'Estate Management Department' },
  { name: 'Safety & Emergency', code: 'safety_emergency', description: 'Safety and Emergency Management' },
  { name: 'MITS', code: 'mits', description: 'Mona Information Technology Services' },
  { name: 'Human Res Mgt Div', code: 'human_res_mgt_div', description: 'Human Resource Management Division' },
  { name: 'BDO', code: 'bdo', description: 'Business Development Office' },
  { name: 'CPO', code: 'cpo', description: 'Campus Projects Office' },
  { name: 'BURSARY', code: 'bursary', description: 'Bursary & Financial Services' },
  { name: 'Campus Security Office', code: 'campus_security_office', description: 'Campus Security and Protection Services' },
  { name: 'Office - Planning & Inst Research', code: 'planning_inst_research', description: 'Office of Planning and Institutional Research' },
  { name: 'Campus Legal Office', code: 'campus_legal_office', description: 'Campus Legal and Compliance Office' },
  { name: 'Secretariat', code: 'secretariat', description: 'TEC Secretariat & Committee Administration' },
];

export async function GET() {
  try {
    let departments = [];
    
    // Check if table exists and has data
    try {
      departments = await prisma.department.findMany({
        orderBy: { name: 'asc' },
      });

      // Auto-seed defaults if table is empty
      if (departments.length === 0) {
        for (const dept of DEFAULT_DEPARTMENTS) {
          await prisma.department.upsert({
            where: { name: dept.name },
            update: {},
            create: dept,
          });
        }
        departments = await prisma.department.findMany({
          orderBy: { name: 'asc' },
        });
      }
    } catch {
      // Fallback if table doesn't exist yet before migration
      departments = DEFAULT_DEPARTMENTS.map((d, index) => ({
        id: `dept_${index + 1}`,
        ...d,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }

    // Get user counts per department
    let userCounts = {};
    try {
      const users = await prisma.user.findMany({
        select: { department: true },
      });
      for (const u of users) {
        if (u.department) {
          userCounts[u.department] = (userCounts[u.department] || 0) + 1;
        }
      }
    } catch {
      // ignore
    }

    const result = departments.map((d) => ({
      ...d,
      userCount: userCounts[d.name] || 0,
    }));

    return Response.json(result, { status: 200 });
  } catch (error) {
    return Response.json(
      { error: `Failed to fetch departments: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, code, description } = body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    if (!trimmedName) {
      return Response.json({ error: 'Department name is required' }, { status: 400 });
    }

    const trimmedCode =
      typeof code === 'string' && code.trim()
        ? code.trim().toLowerCase().replace(/\s+/g, '_')
        : trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    const department = await prisma.department.create({
      data: {
        name: trimmedName,
        code: trimmedCode,
        description: typeof description === 'string' ? description.trim() : null,
      },
    });

    return Response.json(department, { status: 201 });
  } catch (error) {
    if (error?.code === 'P2002') {
      return Response.json(
        { error: 'A department with this name or code already exists' },
        { status: 409 }
      );
    }
    return Response.json(
      { error: `Failed to create department: ${error.message}` },
      { status: 500 }
    );
  }
}
