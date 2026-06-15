import { EventEnvelope } from '../models/events';

export class EventBuffer {
  private batchSize: number;
  private items: EventEnvelope[] = [];

  constructor(batchSize: number = 100) {
    this.batchSize = batchSize;
  }

  /**
   * Adds an item to the buffer. If the buffer is full, it returns the batch to be flushed.
   */
  public add(item: EventEnvelope): EventEnvelope[] | null {
    this.items.push(item);
    if (this.items.length >= this.batchSize) {
      return this.flush();
    }
    return null;
  }

  /**
   * Flushes the buffer and returns all items.
   */
  public flush(): EventEnvelope[] {
    if (this.items.length === 0) {
      return [];
    }
    const batch = [...this.items];
    this.items = [];
    return batch;
  }

  public get length(): number {
    return this.items.length;
  }
}
