import type { Team, TeamMember } from '../models/teams';

export function isTeamOwner(team: Team, userId: string): boolean {
  return team.owner_user_id === userId;
}

export function isTeamAdmin(member: TeamMember): boolean {
  return member.role === 'owner' || member.role === 'admin';
}

export function canManageTeam(team: Team, userId: string): boolean {
  return isTeamOwner(team, userId);
}

export function canManageMembers(member: TeamMember): boolean {
  return isTeamAdmin(member);
}

export function getPrimaryTeam(teams: Team[]): Team | null {
  return teams[0] ?? null;
}
