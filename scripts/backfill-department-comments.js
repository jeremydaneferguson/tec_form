const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SINGLE_COMMENT_DEPARTMENTS = [
  'emd',
  'safety_emergency',
  'mits',
  'human_res_mgt_div',
  'bdo',
  'cpo',
  'bursary',
  'campus_security_office',
  'campus_legal_office',
  'secretariat',
];

function normalizeFormData(formData) {
  if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
    return { changed: false, normalized: formData };
  }

  const normalized = { ...formData };
  let changed = false;

  for (const departmentSlug of SINGLE_COMMENT_DEPARTMENTS) {
    const commentsKey = `deptReview_${departmentSlug}_comments`;
    const legacyPrefix = `deptReview_${departmentSlug}_field_textarea_`;

    const legacyKeys = Object.keys(normalized).filter((key) => key.startsWith(legacyPrefix));
    if (legacyKeys.length === 0) {
      continue;
    }

    // Preserve an existing canonical comments key and only remove duplicates.
    if (!normalized[commentsKey]) {
      const merged = legacyKeys
        .map((key) => normalized[key])
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== '');

      if (merged.length > 0) {
        normalized[commentsKey] = merged.join('\n\n');
      }
    }

    for (const legacyKey of legacyKeys) {
      delete normalized[legacyKey];
      changed = true;
    }
  }

  return { changed, normalized };
}

async function main() {
  const submissions = await prisma.tECSubmission.findMany({
    select: {
      id: true,
      formData: true,
    },
  });

  let updated = 0;

  for (const submission of submissions) {
    const { changed, normalized } = normalizeFormData(submission.formData);

    if (!changed) {
      continue;
    }

    await prisma.tECSubmission.update({
      where: { id: submission.id },
      data: { formData: normalized },
    });

    updated += 1;
  }

  console.log(`Backfill complete. Updated ${updated} submission(s).`);
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
