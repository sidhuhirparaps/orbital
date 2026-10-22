export const ROLES = {
  OWNER: 'owner',
  LEAD: 'lead',
  MEMBER: 'member',
  VIEWER: 'viewer',
}

const RANK = {
  [ROLES.OWNER]: 4,
  [ROLES.LEAD]: 3,
  [ROLES.MEMBER]: 2,
  [ROLES.VIEWER]: 1,
}

export function roleRank(role) {
  return RANK[role] ?? 0
}

export function hasMinRole(userRole, minRole) {
  return roleRank(userRole) >= roleRank(minRole)
}

export function canManageGoals(role) {
  return hasMinRole(role, ROLES.LEAD)
}

export function canEditTasks(role) {
  return hasMinRole(role, ROLES.MEMBER)
}

export function canInviteMembers(role) {
  return hasMinRole(role, ROLES.LEAD)
}

export function canManageTeam(role) {
  return hasMinRole(role, ROLES.OWNER)
}

export function canDeleteGoal(role) {
  return hasMinRole(role, ROLES.LEAD)
}

export function roleLabel(role) {
  const labels = {
    owner: 'Owner',
    lead: 'Lead',
    member: 'Member',
    viewer: 'Viewer',
  }
  return labels[role] ?? role
}
