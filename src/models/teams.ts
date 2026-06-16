export type TeamRole = 'owner' | 'admin' | 'member';
export type BackendTeamMemberRole = 'owner' | 'lead' | 'reviewer' | 'observer';
export type TeamNotificationChannel =
  | 'slack'
  | 'ms_teams'
  | 'pagerduty'
  | 'custom_webhook'
  | 'email';

export interface Team {
  id: string;
  company_id: string;
  name: string;
  slug: string;
  description?: string | null;
  owner_user_id: string;
  created_by?: string | null;
  is_active: boolean;
  default_sla_minutes: number;
  created_at: string;
  updated_at: string;
  slack_webhook_url?: string | null;
  slack_channel?: string | null;
  email_addresses?: string[];
  pagerduty_integration_key?: string | null;
  ms_teams_webhook_url?: string | null;
  custom_webhook_url?: string | null;
  custom_webhook_headers?: Record<string, string>;
  team_metadata?: Record<string, unknown>;
  current_user_is_owner?: boolean;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  company_id?: string;
  user_email?: string | null;
  user_name?: string | null;
  role: TeamRole;
  backend_role: BackendTeamMemberRole;
  is_on_call: boolean;
  notification_channels?: TeamNotificationChannel[];
  added_by?: string | null;
  created_at?: string;
}

export interface TeamCreateRequest {
  name: string;
  slug?: string;
  description?: string | null;
  slack_webhook_url?: string | null;
  slack_channel?: string | null;
  email_addresses?: string[];
  pagerduty_integration_key?: string | null;
  ms_teams_webhook_url?: string | null;
  custom_webhook_url?: string | null;
  custom_webhook_headers?: Record<string, string>;
  default_sla_minutes?: number;
  team_metadata?: Record<string, unknown>;
}

export interface TeamUpdateRequest extends Partial<TeamCreateRequest> {
  is_active?: boolean;
}

export interface TeamMemberAddRequest {
  user_id?: string;
  email?: string;
  role?: TeamRole;
  is_on_call?: boolean;
  notification_channels?: TeamNotificationChannel[];
}

export interface TeamMemberUpdateRequest {
  role?: TeamRole;
  is_on_call?: boolean;
  notification_channels?: TeamNotificationChannel[];
}

export interface NotifyTestResponse {
  results: Partial<Record<TeamNotificationChannel, boolean>> & Record<string, boolean>;
}

type RawTeam = Omit<Team, 'owner_user_id' | 'created_by'> & {
  owner_user_id: string | number | null;
  created_by?: string | number | null;
};

type RawTeamMember = Omit<TeamMember, 'user_id' | 'added_by' | 'role' | 'backend_role'> & {
  user_id: string | number;
  added_by?: string | number | null;
  role: BackendTeamMemberRole;
};

function mapRole(role: BackendTeamMemberRole): TeamRole {
  if (role === 'owner') return 'owner';
  if (role === 'lead') return 'admin';
  return 'member';
}

function encodeRole(role: TeamRole): BackendTeamMemberRole {
  switch (role) {
    case 'owner':
      return 'owner';
    case 'admin':
      return 'lead';
    case 'member':
      return 'reviewer';
  }
}

export function normalizeTeam(raw: RawTeam): Team {
  return {
    ...raw,
    owner_user_id: String(raw.owner_user_id ?? ''),
    created_by:
      raw.created_by !== undefined && raw.created_by !== null
        ? String(raw.created_by)
        : raw.owner_user_id !== null
          ? String(raw.owner_user_id)
          : null,
    email_addresses: raw.email_addresses ?? [],
    custom_webhook_headers: raw.custom_webhook_headers ?? {},
    team_metadata: raw.team_metadata ?? {},
    current_user_is_owner: raw.current_user_is_owner ?? false,
  };
}

export function normalizeTeamMember(raw: RawTeamMember): TeamMember {
  return {
    ...raw,
    user_id: String(raw.user_id),
    added_by:
      raw.added_by !== undefined && raw.added_by !== null ? String(raw.added_by) : null,
    backend_role: raw.role,
    role: mapRole(raw.role),
    notification_channels: raw.notification_channels ?? [],
  };
}

export function toBackendMemberRole(role: TeamRole): BackendTeamMemberRole {
  return encodeRole(role);
}
