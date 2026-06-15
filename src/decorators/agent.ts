import { getGlobalClient } from '../globals';
import { TraceManager } from '../tracing/manager';
import { AGENT_START, AGENT_COMPLETE, AGENT_ERROR } from '../constants/events';
import { getDurationMs, nowMs } from '../utils/timestamps';

export interface AgentOptions {
  name?: string;
  version?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export function traceAgent(options: AgentOptions | string) {
  const name = typeof options === 'string' ? options : options.name;
  const version = typeof options === 'string' ? '1.0' : options.version || '1.0';
  const tags = typeof options === 'string' ? [] : options.tags || [];
  const meta = typeof options === 'string' ? {} : options.metadata || {};

  return function (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
    if (descriptor) {
      const originalMethod = descriptor.value;
      descriptor.value = async function (...args: any[]) {
        const agentId = name || propertyKey || 'anonymous';
        return await executeAgent(agentId, async () => {
          return originalMethod.apply(this, args);
        }, { version, tags, metadata: meta });
      };
      return descriptor;
    } else {
      const original = target;
      const newConstructor: any = function (...args: any[]) {
        const agentId = name || original.name;
        const instance = new original(...args);
        return instance;
      };
      newConstructor.prototype = original.prototype;
      return newConstructor;
    }
  };
}

export async function executeAgent<T>(
  agentId: string | undefined,
  fn: () => Promise<T>,
  options?: { version?: string; tags?: string[]; metadata?: Record<string, any> }
): Promise<T> {
  const client = getGlobalClient();
  const id = agentId || 'anonymous';
  const agentMeta = {
    agent_name: id,
    agent_version: options?.version || '1.0',
    tags: options?.tags || [],
    ...(options?.metadata || {}),
  };

  const span = TraceManager.startSpan(id, {
    metadata: agentMeta,
  });

  return TraceManager.runWithSpan(span, async () => {
    const startTime = nowMs();
    await client.enqueue(AGENT_START, {
      started_at: new Date(startTime).toISOString(),
      ...agentMeta,
    }, {
      trace_id: span.traceId,
      span_id: span.id,
      parent_event_id: span.parentId,
      agent_id: id,
    });

    try {
      const result = await fn();
      span.end('ok');
      await client.enqueue(AGENT_COMPLETE, {
        agent_name: id,
        status: 'ok',
        duration_ms: getDurationMs(startTime),
      }, {
        trace_id: span.traceId,
        span_id: span.id,
        parent_event_id: span.parentId,
        agent_id: id,
      });
      return result;
    } catch (error: any) {
      span.recordError(error);
      span.end('error');
      await client.enqueue(AGENT_ERROR, {
        agent_name: id,
        status: 'error',
        error_type: error.name || 'Error',
        error_message: error.message,
        duration_ms: getDurationMs(startTime),
      }, {
        trace_id: span.traceId,
        span_id: span.id,
        parent_event_id: span.parentId,
        agent_id: id,
      });
      throw error;
    }
  });
}
