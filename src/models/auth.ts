export interface User {
  user_id: string;
  username: string;
  email: string;
  company_id: string;
  is_active: boolean;
  is_admin: boolean;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  company_id?: string;
  workspace_name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type?: string;
  expires_in: number;
  user_id: string;
  company_id: string;
  team_id?: string | null;
}

export interface SignupResponse {
  user: User;
  token: string;
  expires_in: number;
  team: import('./teams').Team;
}

export interface LoginResponse {
  user: User;
  token: string;
  expires_in: number;
  team: import('./teams').Team | null;
}
