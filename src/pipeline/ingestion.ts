import { EventEnvelope } from '../models/events';
import { EventProcessor } from './processor';

export class IngestionPipeline {
  private processor: EventProcessor;

  constructor(processor: EventProcessor) {
    this.processor = processor;
  }

  public async ingest(eventType: string, payload: Record<string, any>, options?: Record<string, any>): Promise<any> {
    return this.processor.processEvent(eventType, payload, options);
  }
}
