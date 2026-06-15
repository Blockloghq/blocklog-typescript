import { describe, it, expect, vi, beforeEach } from 'vitest';
import blocklog from '../src/index';

describe('Decision Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    blocklog.init({ apiKey: 'test' });
    vi.spyOn(blocklog.client!, 'enqueue').mockResolvedValue(null);
  });

  it('should track decision lifecycle', async () => {
    await blocklog.decision({ type: 'INVESTMENT' }, async (decision) => {
      decision.recordInput({ symbol: 'TSLA' });
      decision.recordOutput({ action: 'BUY' });
      decision.tag('finance');
    });

    expect(blocklog.client!.enqueue).toHaveBeenCalledTimes(5);
    expect(blocklog.client!.enqueue).toHaveBeenNthCalledWith(1, 'DECISION_START', expect.objectContaining({ type: 'INVESTMENT' }), expect.any(Object));
    expect(blocklog.client!.enqueue).toHaveBeenNthCalledWith(2, 'DECISION_INPUT', expect.objectContaining({ input: { symbol: 'TSLA' } }), expect.any(Object));
    expect(blocklog.client!.enqueue).toHaveBeenNthCalledWith(3, 'DECISION_OUTPUT', expect.objectContaining({ output: { action: 'BUY' } }), expect.any(Object));
    expect(blocklog.client!.enqueue).toHaveBeenNthCalledWith(4, 'DECISION_TAG', expect.objectContaining({ tag: 'finance' }), expect.any(Object));
    expect(blocklog.client!.enqueue).toHaveBeenNthCalledWith(5, 'DECISION_COMPLETE', expect.any(Object), expect.any(Object));
  });

  it('should support requesting approval and verifying', async () => {
    vi.spyOn(blocklog.client!.approvals, 'request').mockResolvedValue({} as any);
    vi.spyOn(blocklog.client!.decisions, 'verify').mockResolvedValue({ verified: true });

    await blocklog.decision({ type: 'TEST' }, async (decision) => {
      await decision.requestApproval({ reason: 'risk' });
      const verifyRes = await decision.verify();
      expect(verifyRes.verified).toBe(true);
    });

    expect(blocklog.client!.approvals.request).toHaveBeenCalledWith({ decisionId: expect.any(String), reason: 'risk' });
    expect(blocklog.client!.decisions.verify).toHaveBeenCalled();
  });
});
