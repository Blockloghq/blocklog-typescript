import { SessionContext } from '../models/events';
import { TraceManager } from '../tracing/manager';
import { Span } from '../tracing/span';

export function getContext(): SessionContext | undefined {
  const span = TraceManager.currentSpan();
  if (!span) return undefined;
  return {
    trace_id: span.traceId,
    session_id: span.metadata.session_id || span.id,
    workflow_id: span.metadata.workflow_id || null,
    agent_id: span.metadata.agent_id || span.metadata.agent_name || null,
    source: span.metadata.source || 'typescript-sdk',
  };
}

export function runWithContext<T>(context: SessionContext, callback: () => T): T {
  const span = new Span(context.agent_id || 'context-session', {
    traceId: context.trace_id,
    metadata: {
      session_id: context.session_id,
      workflow_id: context.workflow_id,
      agent_id: context.agent_id,
      source: context.source,
    }
  });
  return TraceManager.runWithSpan(span, callback);
}

export function withContext<T>(context: SessionContext, callback: () => Promise<T>): Promise<T> {
  const span = new Span(context.agent_id || 'context-session', {
    traceId: context.trace_id,
    metadata: {
      session_id: context.session_id,
      workflow_id: context.workflow_id,
      agent_id: context.agent_id,
      source: context.source,
    }
  });
  return TraceManager.runWithSpan(span, callback);
}
