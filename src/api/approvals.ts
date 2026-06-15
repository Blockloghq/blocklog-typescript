import { BaseClient } from './base';

export class ApprovalClient extends BaseClient {
  public async create(data: { decisionId: string; reason: string }) {
    return this.client.transport.request('POST', '/hitl/request', { json: data });
  }

  public async approve(id: string, reason?: string) {
    return this.client.transport.request('POST', `/hitl/approve`, { json: { id, reason } });
  }

  public async reject(id: string, reason?: string) {
    return this.client.transport.request('POST', `/hitl/reject`, { json: { id, reason } });
  }

  public async status(id: string) {
    return this.client.transport.request('GET', `/hitl/${id}/status`);
  }

  public async list(params?: Record<string, any>) {
    return this.client.transport.request('GET', '/hitl', { params });
  }
}
