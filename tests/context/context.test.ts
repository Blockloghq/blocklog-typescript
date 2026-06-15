import { describe, it, expect, vi, beforeEach } from 'vitest';
import blocklog from '../src/index';
import { executeAgent, traceAgent } from '../src/decorators/agent';
import { getContext } from '../src/context/vars';

describe('Context Management & Decorators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    blocklog.init({ apiKey: 'test' });
    // Mock the enqueue to prevent actual fetch
    vi.spyOn(blocklog.client!, 'enqueue').mockResolvedValue(null);
  });

  it('should propagate context correctly', async () => {
    await executeAgent('test-agent', async () => {
      const context = getContext();
      expect(context).toBeDefined();
      expect(context?.agent_id).toBe('test-agent');
      expect(context?.trace_id).toBeDefined();
    });
  });

  it('should support decorator syntax', async () => {
    class TestClass {
      @traceAgent({ name: 'my-agent' })
      async myMethod() {
        return getContext()?.agent_id;
      }
    }

    const instance = new TestClass();
    const result = await instance.myMethod();
    expect(result).toBe('my-agent');
  });
});
