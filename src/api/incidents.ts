import { BaseClient } from './base';

export class IncidentsClient extends BaseClient {
  public async create(data: Record<string, any>) {
    return this.client.transport.request('POST', '/incidents', { json: data });
  }

  public async get(id: string) {
    return this.client.transport.request('GET', `/incidents/${id}`);
  }

  public async update(id: string, data: Record<string, any>) {
    return this.client.transport.request('PUT', `/incidents/${id}`, { json: data });
  }

  public async list(params?: Record<string, any>) {
    return this.client.transport.request('GET', '/incidents', { params });
  }

  public async assign(id: string, assignee: string) {
    return this.client.transport.request('POST', `/incidents/${id}/assign`, { json: { assignee } });
  }

  public async resolve(id: string, reason?: string) {
    return this.client.transport.request('POST', `/incidents/${id}/resolve`, { json: { reason } });
  }

  public async close(id: string, reason?: string) {
    return this.client.transport.request('POST', `/incidents/${id}/close`, { json: { reason } });
  }
}
