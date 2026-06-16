import { BaseClient } from './base';

export class ReplayClient extends BaseClient {
  public async reconstruct(traceId: string, options?: Record<string, any>) {
    return this.request('POST', '/replays/reconstruct', {
      json: { traceId, ...options },
    });
  }

  public async verify(id: string) {
    return this.request('GET', `/replays/${id}/verify`);
  }

  public async replay(id: string, options?: Record<string, any>) {
    return this.request('POST', `/replays/${id}/execute`, {
      json: options,
    });
  }

  public async get(id: string) {
    return this.request('GET', `/replays/${id}`);
  }

  public async create(data: Record<string, any>) {
    return this.request('POST', '/replays', {
      json: data,
    });
  }

  public async list(params?: Record<string, any>) {
    return this.request('GET', '/replays', {
      params,
    });
  }

  public async compare(idA: string, idB: string) {
    return this.request('GET', '/replays/compare', {
      params: {
        a: idA,
        b: idB,
      },
    });
  }
}