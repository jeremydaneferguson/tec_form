export const RATING_FIELDS = {
  objectives: { label: 'Project objectives and rationale', max: 5 },
  construction: { label: 'New construction and site evaluation', max: 5 },
  renovation: { label: 'Renovation and existing structure', max: 5 },
  documentationRating: { label: 'Overall documentation rating', max: 10 },
};
export const AGREEMENT_LABELS = { 1: 'Strongly disagree', 2: 'Disagree', 3: 'Neutral', 4: 'Agree', 5: 'Strongly agree' };
export const SELECTION_FIELDS = ['utilities', 'electricalMechanical', 'fireDetection', 'infrastructure'];
export const COMMITTEES = ['Finance & General Purpose', 'Grounds, Buildings & Premises', 'Technical & Environmental', 'Tender Committee', 'Board of the Applicant', 'Other'];
export const RECOMMENDATION_STAGES = ['stage1', 'stage2', 'stage3'];
export const DETAIL_GROUPS = [
  { title: 'Technical and site details', fields: ['technicalDescription', 'locationMetrics', 'preciseBuildingLocation', 'existingBuildingArea', 'proposedBuildingArea', 'siteAnalysis', 'topography', 'buildingFunction'] },
  { title: 'Utilities and infrastructure', fields: ['utilities', 'utilitiesOther', 'utilityChargesResponsibility', 'electricalMechanical', 'electricalMechanicalOther', 'fireDetection', 'fireDetectionOther', 'infrastructure', 'infrastructureOther'] },
  { title: 'Documentation assessment', fields: ['requiredDocumentationDescription', 'objectives', 'construction', 'renovation', 'documentationRating', 'technicalEnvironmentalAssessmentDescription'] },
];
const LABELS = {
  electricalMechanical: 'Electrical and mechanical systems',
  fireDetection: 'Fire protection and detection', locationMetrics: 'Location details',
  requiredDocumentationDescription: 'Documentation notes',
  technicalEnvironmentalAssessmentDescription: 'Technical and environmental assessment notes',
  approvalsRecommendationsOther: 'Other committee details',
};
export function detailLabel(key) {
  return RATING_FIELDS[key]?.label || LABELS[key] || key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, (character) => character.toUpperCase());
}
function parseLegacy(value) {
  if (typeof value !== 'string') return value;
  try { return JSON.parse(value); } catch { return value; }
}
export function normalizeFormDetails(data = {}) {
  const normalized = { ...data };
  if (normalized.documentationRating === undefined && normalized['documentation-rating'] !== undefined) {
    normalized.documentationRating = normalized['documentation-rating'];
  }
  delete normalized['documentation-rating'];
  for (const key of Object.keys(RATING_FIELDS)) {
    const value = normalized[key];
    if (typeof value === 'string' && /^\d+$/.test(value.trim())) normalized[key] = Number(value);
  }
  for (const key of SELECTION_FIELDS) {
    const value = parseLegacy(normalized[key]);
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      normalized[key] = [...new Set(value.map((item) => item.trim()).filter(Boolean))];
    }
  }
  const matrix = parseLegacy(normalized.approvalsRecommendations);
  if (matrix && typeof matrix === 'object' && !Array.isArray(matrix)) {
    const rows = new Map();
    for (const [rawName, stages] of Object.entries(matrix)) {
      const name = COMMITTEES.find((item) => item.toLowerCase() === rawName.trim().toLowerCase()) || rawName;
      const values = stages && typeof stages === 'object' && !Array.isArray(stages)
        ? Object.fromEntries(Object.entries(stages).map(([stage, value]) => [stage, value === 'true' ? true : value === 'false' ? false : value]))
        : stages;
      const previous = rows.get(name);
      rows.set(name, previous && values && typeof previous === 'object' && typeof values === 'object' ? { ...previous, ...values } : values);
    }
    normalized.approvalsRecommendations = Object.fromEntries(rows);
  }
  return normalized;
}
export function validateFormDetails(data) {
  const errors = [];
  for (const [key, { label, max }] of Object.entries(RATING_FIELDS)) {
    const value = data[key];
    if (value !== undefined && value !== null && value !== '' && (!Number.isInteger(value) || value < 1 || value > max)) errors.push(`${label} must be a whole number from 1 to ${max}`);
  }
  for (const key of SELECTION_FIELDS) {
    const value = data[key];
    if (value !== undefined && value !== null && (!Array.isArray(value) || !value.every((item) => typeof item === 'string'))) errors.push(`${detailLabel(key)} must be a list of selections`);
  }
  const matrix = data.approvalsRecommendations;
  if (matrix !== undefined && matrix !== null) {
    if (typeof matrix !== 'object' || Array.isArray(matrix) || Object.values(matrix).some((stages) => !stages || typeof stages !== 'object' || Array.isArray(stages) || Object.entries(stages).some(([key, value]) => !RECOMMENDATION_STAGES.includes(key) || typeof value !== 'boolean'))) errors.push('Committee recommendations must contain boolean stage selections');
  }
  return errors;
}

export function detailText(key, value) {
  const rating = RATING_FIELDS[key];
  if (rating && Number.isInteger(value) && value >= 1 && value <= rating.max) return `${value} / ${rating.max}${rating.max === 5 ? ` — ${AGREEMENT_LABELS[value]}` : ''}`;
  if (key === 'approvalsRecommendations' && value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).map(([name, stages]) => `${name}: ${RECOMMENDATION_STAGES.filter((stage) => stages?.[stage] === true).map((stage) => `Stage ${stage.slice(-1)}`).join(', ') || 'No stages selected'}`).join('; ');
  }
  if (value === null || value === undefined || value === '') return 'Not provided';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map((item) => detailText('', item)).join(', ') || 'No selections recorded';
  if (typeof value === 'object') return Object.entries(value).map(([field, child]) => `${detailLabel(field)}: ${detailText(field, child)}`).join('; ');
  return String(value);
}
