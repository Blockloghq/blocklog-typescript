import { getGlobalClient } from '../globals';
import { TraceManager } from '../tracing/manager';
import { generateUUID } from '../utils/ids';
import {
  DECISION_START,
  DECISION_INPUT,
  DECISION_OUTPUT,
  DECISION_TAG,
  DECISION_COMPLETE
} from '../constants/events';

export interface DecisionOptions {
  type?: string;
  [key: string]: any;
}

export class DecisionContext {
  public id: string;
  private client = getGlobalClient();
  private traceId: string | null = null;
  private spanId: string | null = null;

  constructor(options?: DecisionOptions) {
    this.id = generateUUID();
    const currentSpan = TraceManager.currentSpan();
    this.traceId = currentSpan?.traceId || null;
    this.spanId = currentSpan?.id || null;

    this.client.processor.processEvent(DECISION_START, {
      decision_id: this.id,
      ...options
    }, {
      parent_event_id: this.id,
      trace_id: this.traceId,
      span_id: this.spanId,
    });
  }

  public recordInput(data: Record<string, any>) {
    this.client.processor.processEvent(DECISION_INPUT, {
      decision_id: this.id,
      input: data
    }, {
      parent_event_id: this.id,
      trace_id: this.traceId,
      span_id: this.spanId,
    });
  }

  public recordOutput(data: Record<string, any>) {
    this.client.processor.processEvent(DECISION_OUTPUT, {
      decision_id: this.id,
      output: data
    }, {
      parent_event_id: this.id,
      trace_id: this.traceId,
      span_id: this.spanId,
    });
  }

  public tag(tag: string) {
    this.client.processor.processEvent(DECISION_TAG, {
      decision_id: this.id,
      tag
    }, {
      parent_event_id: this.id,
      trace_id: this.traceId,
      span_id: this.spanId,
    });
  }

  public async requestApproval(options: { reason: string }): Promise<void> {
    await this.client.approvals.request({
      decisionId: this.id,
      reason: options.reason
    });
  }

  public async verify(): Promise<{ verified: boolean; signature?: string; hash?: string }> {
    return await this.client.decisions.verify(this.id);
  }

  public complete() {
    this.client.processor.processEvent(DECISION_COMPLETE, {
      decision_id: this.id
    }, {
      parent_event_id: this.id,
      trace_id: this.traceId,
      span_id: this.spanId,
    });
  }
}

export async function executeDecision<T>(
  options: DecisionOptions,
  fn: (decision: DecisionContext) => Promise<T>
): Promise<T> {
  const decision = new DecisionContext(options);
  try {
    const result = await fn(decision);
    decision.complete();
    return result;
  } catch (error) {
    decision.complete();
    throw error;
  }
}
