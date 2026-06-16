import { BaseClient } from './base';
import type { BlocklogClient } from '../client';
import {
  normalizeTeam,
  normalizeTeamMember,
  toBackendMemberRole,
  type NotifyTestResponse,
  type Team,
  type TeamCreateRequest,
  type TeamMember,
  type TeamMemberAddRequest,
  type TeamMemberUpdateRequest,
  type TeamUpdateRequest,
} from '../models/teams';

class TeamMembersClient extends BaseClient {
  public async list(teamId: string): Promise<TeamMember[]> {
    const items = await this.request<unknown[]>('GET', `/teams/${teamId}/members`);
    return (items ?? []).map((item) => normalizeTeamMember(item as never));
  }

  public async add(teamId: string, payload: TeamMemberAddRequest): Promise<TeamMember> {
    const created = await this.request<unknown>('POST', `/teams/${teamId}/members`, {
      json: {
        ...payload,
        ...(payload.user_id ? { user_id: Number(payload.user_id) } : {}),
        ...(payload.role ? { role: toBackendMemberRole(payload.role) } : {}),
      },
    });
    return normalizeTeamMember(created as never);
  }

  public async update(
    teamId: string,
    memberId: string,
    payload: TeamMemberUpdateRequest,
  ): Promise<TeamMember> {
    const updated = await this.request<unknown>('PATCH', `/teams/${teamId}/members/${memberId}`, {
      json: {
        ...payload,
        ...(payload.role ? { role: toBackendMemberRole(payload.role) } : {}),
      },
    });
    return normalizeTeamMember(updated as never);
  }

  public async remove(teamId: string, memberId: string): Promise<void> {
    await this.request<void>('DELETE', `/teams/${teamId}/members/${memberId}`);
  }
}

export class TeamsClient extends BaseClient {
  public readonly members: TeamMembersClient;

  constructor(client: BlocklogClient) {
    super(client);
    this.members = new TeamMembersClient(client);
  }

  public async list(): Promise<Team[]> {
    const items = await this.request<unknown[]>('GET', '/teams');
    return (items ?? []).map((item) => normalizeTeam(item as never));
  }

  public async get(teamId: string): Promise<Team> {
    const team = await this.request<unknown>('GET', `/teams/${teamId}`);
    return normalizeTeam(team as never);
  }

  public async create(payload: TeamCreateRequest): Promise<Team> {
    const team = await this.request<unknown>('POST', '/teams', { json: payload });
    return normalizeTeam(team as never);
  }

  public async update(teamId: string, payload: TeamUpdateRequest): Promise<Team> {
    const team = await this.request<unknown>('PATCH', `/teams/${teamId}`, { json: payload });
    return normalizeTeam(team as never);
  }

  public async delete(teamId: string): Promise<void> {
    await this.request<void>('DELETE', `/teams/${teamId}`);
  }

  public async notifyTest(teamId: string): Promise<NotifyTestResponse> {
    return this.request<NotifyTestResponse>('POST', `/teams/${teamId}/notify-test`, {
      json: {},
    });
  }
}
