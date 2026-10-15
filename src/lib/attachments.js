export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const ATTACHMENT_SECTIONS = {
  existingBuildingAreaAttachment: 'Existing Building Area',
  proposedBuildingAreaAttachment: 'Proposed Building Area',
};

export function validateAttachments(formData) {
  const errors = [];
  for (const [key, label] of Object.entries(ATTACHMENT_SECTIONS)) {
    const file = formData?.[key];
    if (file === undefined || file === null) continue;
    if (typeof file !== 'object' || Array.isArray(file) ||
        typeof file.name !== 'string' || !file.name.trim() || file.name.length > 255 ||
        !Number.isInteger(file.size) || file.size < 0 || file.size > MAX_ATTACHMENT_BYTES ||
        typeof file.data !== 'string' || file.data.length > Math.ceil(MAX_ATTACHMENT_BYTES / 3) * 4 ||
        file.data.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(file.data)) {
      errors.push(`${label}: select a valid file of up to 5 MB`);
      continue;
    }
    const decodedSize = file.data.length / 4 * 3 - (file.data.endsWith('==') ? 2 : file.data.endsWith('=') ? 1 : 0);
    if (decodedSize !== file.size) errors.push(`${label}: file contents do not match the file size`);
  }
  return errors;
}
