import { BaseClient } from './base';

export class ComplianceClient extends BaseClient {
  public async audit(params?: Record<string, any>) {
    return this.client.transport.request('POST', '/compliance/audit', { json: params });
  }

  public async verify(id: string) {
    return this.client.transport.request('GET', `/compliance/verify/${id}`);
  }

  public async export(params: { format: string; dateRange?: { start: string; end: string } }) {
    return this.client.transport.request('POST', '/compliance/export', { json: params });
  }

  public async getReport(id: string) {
    return this.client.transport.request('GET', `/compliance/reports/${id}`);
  }

  public async getDashboard(params?: Record<string, any>) {
    return this.client.transport.request('GET', `/compliance/dashboard`, { params });
  }

  public async shareReport(id: string, emails: string[]) {
    return this.client.transport.request('POST', `/compliance/reports/${id}/share`, { json: { emails } });
  }

  public async exportEvidence(id: string, format: string = 'pdf') {
    return this.client.transport.request('GET', `/compliance/reports/${id}/export`, { params: { format } });
  }
}
