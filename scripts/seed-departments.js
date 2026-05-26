const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const departments = [
  { email: 'emd-review@company.com', role: 'approver', department: 'emd' },
  { email: 'safety-emergency-review@company.com', role: 'approver', department: 'safety_emergency' },
  { email: 'mits-review@company.com', role: 'approver', department: 'mits' },
  { email: 'human-res-review@company.com', role: 'approver', department: 'human_res_mgt_div' },
  { email: 'bdo-review@company.com', role: 'approver', department: 'bdo' },
  { email: 'cpo-review@company.com', role: 'approver', department: 'cpo' },
  { email: 'bursary-review@company.com', role: 'approver', department: 'bursary' },
  { email: 'campus-security-review@company.com', role: 'approver', department: 'campus_security_office' },
  { email: 'campus-legal-review@company.com', role: 'approver', department: 'campus_legal_office' },
  { email: 'secretariat-review@company.com', role: 'admin', department: 'secretariat' },
];

async function main() {
  console.log('Starting seed data insertion...');
  
  for (const dept of departments) {
    try {
      const user = await prisma.user.upsert({
        where: { email: dept.email },
        update: {},
        create: {
          email: dept.email,
          role: dept.role,
          department: dept.department,
        },
      });
      console.log(`✓ Created/verified user: ${user.email} (${user.department})`);
    } catch (error) {
      console.error(`✗ Error creating user ${dept.email}:`, error.message);
    }
  }
  
  console.log('Seed data insertion completed!');
}

main()
  .catch((e) => {
    console.error('Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
