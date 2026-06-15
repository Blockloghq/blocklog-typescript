import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { traceAgent, executeAgent } from '../../src/decorators/agent';
import { TraceManager } from '../../src/tracing/manager';
import { BlocklogClient } from '../../src/client';
import { setGlobalClient } from '../../src/globals';

describe('Agent Decorator Tests', () => {
  let client: BlocklogClient;

  beforeEach(() => {
    client = new BlocklogClient({ apiKey: 'test-key' });
    setGlobalClient(client);
    (TraceManager as any).activeSpans.clear();
  });

  afterEach(() => {
    client.shutdown();
  });

  describe('executeAgent function', () => {
    it('should execute agent with tracing', async () => {
      const enqueueSpy = vi.spyOn(client, 'enqueue').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });

      const result = await executeAgent(
        'test-agent',
        async () => 'processed result',
        { version: '1.0' }
      );

      expect(result).toBe('processed result');
      expect(enqueueSpy).toHaveBeenCalled();
    });

    it('should handle agent options', async () => {
      const enqueueSpy = vi.spyOn(client, 'enqueue').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });

      await executeAgent(
        'test-agent',
        async () => 'processed result',
        { version: '1.0', tags: ['test'], metadata: { custom: 'value' } }
      );

      expect(enqueueSpy).toHaveBeenCalled();
      const callArgs = enqueueSpy.mock.calls[0];
      if (callArgs && callArgs[2]) {
        expect(callArgs[2].agent_id).toBe('test-agent');
      }
    });

    it('should propagate errors correctly', async () => {
      const enqueueSpy = vi.spyOn(client, 'enqueue').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });

      await expect(
        executeAgent(
          'test-agent',
          async () => {
            throw new Error('Execution failed');
          },
          { version: '1.0' }
        )
      ).rejects.toThrow('Execution failed');

      expect(enqueueSpy).toHaveBeenCalled();
    });

    it('should create spans with correct metadata', async () => {
      const enqueueSpy = vi.spyOn(client, 'enqueue').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });

      await executeAgent(
        'test-agent',
        async () => 'result',
        { version: '2.0', metadata: { key: 'value' } }
      );

      expect(enqueueSpy).toHaveBeenCalled();
      const callArgs = enqueueSpy.mock.calls[0];
      if (callArgs && callArgs[2]) {
        expect(callArgs[2].trace_id).toBeDefined();
        expect(callArgs[2].span_id).toBeDefined();
        expect(callArgs[2].agent_id).toBe('test-agent');
      }
    });
  });

  describe('@traceAgent decorator', () => {
    it('should wrap methods with agent tracing', async () => {
      const enqueueSpy = vi.spyOn(client, 'enqueue').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });

      // Using Object.defineProperty to simulate decorator behavior
      class TestAgent {
        async execute(input: string): Promise<string> {
          return `processed: ${input}`;
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestAgent.prototype, 'execute');
      if (descriptor && descriptor.value) {
        const decorated = traceAgent('test-agent')(TestAgent.prototype, 'execute', descriptor);
        if (decorated) {
          Object.defineProperty(TestAgent.prototype, 'execute', decorated);
        }
      }

      const agent = new TestAgent();
      const result = await agent.execute('test input');

      expect(result).toBe('processed: test input');
      expect(enqueueSpy).toHaveBeenCalled();
    });

    it('should accept options object', async () => {
      const enqueueSpy = vi.spyOn(client, 'enqueue').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });

      class TestAgent {
        async execute(input: string): Promise<string> {
          return `processed: ${input}`;
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestAgent.prototype, 'execute');
      if (descriptor && descriptor.value) {
        const decorated = traceAgent({ name: 'test-agent', version: '2.0' })(TestAgent.prototype, 'execute', descriptor);
        if (decorated) {
          Object.defineProperty(TestAgent.prototype, 'execute', decorated);
        }
      }

      const agent = new TestAgent();
      await agent.execute('test input');

      expect(enqueueSpy).toHaveBeenCalled();
    });

    it('should handle errors in decorated methods', async () => {
      const enqueueSpy = vi.spyOn(client, 'enqueue').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });

      class TestAgent {
        async execute(input: string): Promise<string> {
          throw new Error('Method failed');
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestAgent.prototype, 'execute');
      if (descriptor && descriptor.value) {
        const decorated = traceAgent('test-agent')(TestAgent.prototype, 'execute', descriptor);
        if (decorated) {
          Object.defineProperty(TestAgent.prototype, 'execute', decorated);
        }
      }

      const agent = new TestAgent();
      await expect(agent.execute('test input')).rejects.toThrow('Method failed');

      expect(enqueueSpy).toHaveBeenCalled();
    });

    it('should preserve method context', async () => {
      const enqueueSpy = vi.spyOn(client, 'enqueue').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });

      class TestAgent {
        private prefix = 'processed:';

        async execute(input: string): Promise<string> {
          return `${this.prefix} ${input}`;
        }
      }

      const descriptor = Object.getOwnPropertyDescriptor(TestAgent.prototype, 'execute');
      if (descriptor && descriptor.value) {
        const decorated = traceAgent('test-agent')(TestAgent.prototype, 'execute', descriptor);
        if (decorated) {
          Object.defineProperty(TestAgent.prototype, 'execute', decorated);
        }
      }

      const agent = new TestAgent();
      const result = await agent.execute('test input');

      expect(result).toBe('processed: test input');
      expect(enqueueSpy).toHaveBeenCalled();
    });
  });

  describe('Span Creation', () => {
    it('should create AGENT_START event', async () => {
      const enqueueSpy = vi.spyOn(client, 'enqueue').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });

      await executeAgent('test-agent', async () => 'result', { version: '1.0' });

      expect(enqueueSpy).toHaveBeenCalled();
      const firstCall = enqueueSpy.mock.calls[0];
      expect(firstCall[0]).toContain('AGENT');
    });

    it('should create AGENT_COMPLETE event on success', async () => {
      const enqueueSpy = vi.spyOn(client, 'enqueue').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });

      await executeAgent('test-agent', async () => 'result', { version: '1.0' });

      expect(enqueueSpy).toHaveBeenCalled();
      expect(enqueueSpy).toHaveBeenCalledTimes(2); // START and COMPLETE
    });

    it('should create AGENT_ERROR event on failure', async () => {
      const enqueueSpy = vi.spyOn(client, 'enqueue').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });

      await expect(
        executeAgent('test-agent', async () => {
          throw new Error('Test error');
        }, { version: '1.0' })
      ).rejects.toThrow();

      expect(enqueueSpy).toHaveBeenCalled();
      const lastCall = enqueueSpy.mock.calls[enqueueSpy.mock.calls.length - 1];
      expect(lastCall[0]).toContain('AGENT_ERROR');
    });
  });

  describe('Timing', () => {
    it('should record execution duration', async () => {
      const enqueueSpy = vi.spyOn(client, 'enqueue').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });

      await executeAgent('test-agent', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      }, { version: '1.0' });

      expect(enqueueSpy).toHaveBeenCalled();
      const completeCall = enqueueSpy.mock.calls[1];
      expect(completeCall[1].duration_ms).toBeGreaterThan(0);
    });
  });

  describe('Metadata', () => {
    it('should include agent metadata in events', async () => {
      const enqueueSpy = vi.spyOn(client, 'enqueue').mockResolvedValue({ ingested: 1, log_ids: ['test-id'] });

      await executeAgent(
        'test-agent',
        async () => 'result',
        { version: '2.0', tags: ['production'], metadata: { env: 'prod' } }
      );

      expect(enqueueSpy).toHaveBeenCalled();
      const firstCall = enqueueSpy.mock.calls[0];
      expect(firstCall[1].agent_name).toBe('test-agent');
      expect(firstCall[1].agent_version).toBe('2.0');
      expect(firstCall[1].tags).toEqual(['production']);
      expect(firstCall[1].env).toBe('prod');
    });
  });
});
