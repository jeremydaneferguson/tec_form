export function canViewAllProjects(user) {
  return ['admin', 'approver'].includes(user?.role?.trim().toLowerCase());
}

export function projectScope(user) {
  return canViewAllProjects(user)
    ? {}
    : { email: { equals: user.email, mode: 'insensitive' } };
}
