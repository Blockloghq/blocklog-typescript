import { EventEnvelope } from '../models/events';

export class MemoryQueue {
  private items: EventEnvelope[] = [];

  public async enqueue(item: EventEnvelope): Promise<void> {
    this.items.push(item);
  }

  public async enqueueBatch(batch: EventEnvelope[]): Promise<void> {
    this.items.push(...batch);
  }

  public async dequeue(count: number): Promise<EventEnvelope[]> {
    return this.items.splice(0, count);
  }

  public async peek(count: number): Promise<EventEnvelope[]> {
    return this.items.slice(0, count);
  }

  public async clear(): Promise<void> {
    this.items = [];
  }

  public get length(): number {
    return this.items.length;
  }
}
