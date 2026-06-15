import { randomUUID } from 'crypto';
import { runWithContext, getContext } from './vars';
import { SessionContext } from '../models/events';

export async function agentSession<T>(
  options: {
    agent_id?: string;
    source?: string;
    workflow_id?: string;
  },
  callback: (context: SessionContext) => Promise<T>
): Promise<T> {
  const currentContext = getContext();
  const context: SessionContext = {
    trace_id: currentContext?.trace_id || randomUUID(),
    session_id: currentContext?.session_id || randomUUID(),
    workflow_id: options.workflow_id || currentContext?.workflow_id || null,
    agent_id: options.agent_id || currentContext?.agent_id || null,
    source: options.source || 'typescript-sdk',
  };

  return runWithContext(context, async () => {
    return callback(context);
  });
}
