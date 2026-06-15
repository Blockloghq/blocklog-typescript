import { getGlobalClient } from '../globals';
import { TraceManager } from '../tracing/manager';
import { TOOL_START, TOOL_COMPLETE, TOOL_ERROR } from '../constants/events';
import { getDurationMs, nowMs } from '../utils/timestamps';

export interface ToolOptions {
  name?: string;
}

export function traceTool(options: ToolOptions | string) {
  const toolName = typeof options === 'string' ? options : options.name;

  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const name = toolName || propertyKey;
      return await executeTool(name, args, async () => {
        return originalMethod.apply(this, args);
      });
    };
    return descriptor;
  };
}

export async function executeTool<T>(toolName: string, inputs: any[], fn: () => Promise<T>): Promise<T> {
  const client = getGlobalClient();
  
  const span = TraceManager.startSpan(toolName, {
    metadata: { tool_name: toolName }
  });

  return TraceManager.runWithSpan(span, async () => {
    const startTime = nowMs();
    await client.enqueue(TOOL_START, {
      tool_name: toolName,
      inputs,
    }, {
      trace_id: span.traceId,
      span_id: span.id,
      parent_event_id: span.parentId,
    });

    try {
      const result = await fn();
      span.end('ok');
      await client.enqueue(TOOL_COMPLETE, {
        tool_name: toolName,
        outputs: result,
        duration_ms: getDurationMs(startTime),
      }, {
        trace_id: span.traceId,
        span_id: span.id,
        parent_event_id: span.parentId,
      });
      return result;
    } catch (error: any) {
      span.recordError(error);
      span.end('error');
      await client.enqueue(TOOL_ERROR, {
        tool_name: toolName,
        error_type: error.name || 'Error',
        error_message: error.message,
        duration_ms: getDurationMs(startTime),
      }, {
        trace_id: span.traceId,
        span_id: span.id,
        parent_event_id: span.parentId,
      });
      throw error;
    }
  });
}
