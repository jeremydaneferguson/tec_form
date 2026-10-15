export const REVIEW_DEPARTMENT_STEPS = {
  EMD: 6, 'Safety & Emergency': 7, MITS: 8, 'Human Res Mgt Div': 9,
  BDO: 10, CPO: 12, BURSARY: 13, 'Campus Security Office': 14,
  'Office - Planning & Inst Research': 15, 'Campus Legal Office': 16, Secretariat: 17,
};
export const REQUESTOR_REQUIRED_FIELDS = {
  projectName: 'Project name', client: 'Client', contactName: 'Contact name',
  projectType: 'Project type', date: 'Date', contactTelephone: 'Contact telephone',
  preciseBuildingLocation: 'Precise building location', existingBuildingArea: 'Existing building area',
  proposedBuildingArea: 'Proposed building area', topography: 'Topography',
  buildingFunction: 'Building function', utilityChargesResponsibility: 'Utility charges responsibility',
};
const REQUESTOR_FIELDS = new Set([
  ...Object.keys(REQUESTOR_REQUIRED_FIELDS), 'title', 'titleOther', 'projectTypeOther',
  'approvalsRecommendations', 'approvalsRecommendationsOther', 'technicalDescription',
  'locationMetrics', 'siteAnalysis', 'utilities', 'electricalMechanical', 'fireDetection',
  'infrastructure', 'existingBuildingAreaAttachment', 'proposedBuildingAreaAttachment',
]);
export function isRequestorField(key) {
  return REQUESTOR_FIELDS.has(key) || (key.endsWith('Other') && REQUESTOR_FIELDS.has(key.slice(0, -5)));
}
export function requestorData(data = {}) {
  return Object.fromEntries(Object.entries(data).filter(([key]) => isRequestorField(key)));
}
export function reviewData(data = {}) {
  return Object.fromEntries(Object.entries(data).filter(([key]) => !isRequestorField(key) && key !== 'approval'));
}
export function requestorCompletionErrors(data = {}) {
  return Object.entries(REQUESTOR_REQUIRED_FIELDS)
    .filter(([key]) => typeof data[key] !== 'string' || !data[key].trim())
    .map(([, label]) => `${label} is required`);
}
export function canReview(user) {
  return ['admin', 'approver'].includes(user?.role?.trim().toLowerCase());
}
