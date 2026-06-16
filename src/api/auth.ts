import type { BlocklogClient } from '../client';
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  TokenResponse,
  User,
} from '../models/auth';
import { normalizeTeam, type Team } from '../models/teams';

export class AuthClient {
  private client: BlocklogClient;

  constructor(client: BlocklogClient) {
    this.client = client;
  }

  public async me(): Promise<User> {
    const user = await this.client.transport.request<User>('GET', '/auth/me');
    return {
      ...user,
      user_id: String(user.user_id),
    };
  }

  public async signup(payload: SignupRequest): Promise<SignupResponse> {
    const tokenResponse = await this.client.transport.request<TokenResponse>('POST', '/auth/signup', {
      json: payload,
      skipAuth: true,
    });

    if (!tokenResponse.team_id) {
      throw new Error('Signup succeeded but no team was returned by the backend.');
    }

    const user = await this.client.transport.request<User>('GET', '/auth/me', {
      tokenOverride: tokenResponse.access_token,
    });
    const team = await this.client.transport.request<Team>('GET', `/teams/${tokenResponse.team_id}`, {
      tokenOverride: tokenResponse.access_token,
    });

    return {
      user: {
        ...user,
        user_id: String(user.user_id),
      },
      token: tokenResponse.access_token,
      expires_in: tokenResponse.expires_in,
      team: normalizeTeam(team),
    };
  }

  public async login(payload: LoginRequest): Promise<LoginResponse> {
    const tokenResponse = await this.client.transport.request<TokenResponse>('POST', '/auth/login', {
      json: payload,
      skipAuth: true,
    });

    const user = await this.client.transport.request<User>('GET', '/auth/me', {
      tokenOverride: tokenResponse.access_token,
    });
    const teams = await this.client.transport.request<Team[]>('GET', '/teams', {
      tokenOverride: tokenResponse.access_token,
    });
    const primaryTeam = Array.isArray(teams) && teams.length > 0 ? normalizeTeam(teams[0]) : null;

    return {
      user: {
        ...user,
        user_id: String(user.user_id),
      },
      token: tokenResponse.access_token,
      expires_in: tokenResponse.expires_in,
      team: primaryTeam,
    };
  }
}
