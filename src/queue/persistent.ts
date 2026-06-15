import * as fs from 'fs';
import * as path from 'path';
import { EventEnvelope } from '../models/events';

export class PersistentQueue {
  private filePath: string;
  private items: EventEnvelope[] = [];

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), '.blocklog_queue.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf8');
        this.items = JSON.parse(content) || [];
      } else {
        this.items = [];
      }
    } catch (error) {
      // If error (e.g., malformed json), reset
      this.items = [];
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.items, null, 2), 'utf8');
    } catch (error) {
      // Log or suppress persistent queue errors in production
    }
  }

  public async enqueue(item: EventEnvelope): Promise<void> {
    this.items.push(item);
    this.saveToDisk();
  }

  public async enqueueBatch(batch: EventEnvelope[]): Promise<void> {
    this.items.push(...batch);
    this.saveToDisk();
  }

  public async dequeue(count: number): Promise<EventEnvelope[]> {
    const dequeued = this.items.splice(0, count);
    this.saveToDisk();
    return dequeued;
  }

  public async peek(count: number): Promise<EventEnvelope[]> {
    return this.items.slice(0, count);
  }

  public async clear(): Promise<void> {
    this.items = [];
    if (fs.existsSync(this.filePath)) {
      try {
        fs.unlinkSync(this.filePath);
      } catch (err) {
        // Suppress deletion error
      }
    }
  }

  public get length(): number {
    return this.items.length;
  }
}
