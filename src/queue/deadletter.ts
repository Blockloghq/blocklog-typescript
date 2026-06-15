import * as fs from 'fs';
import * as path from 'path';
import { EventEnvelope } from '../models/events';

export interface DeadLetterEntry {
  event: EventEnvelope;
  reason: string;
  failedAt: string;
}

export class DeadLetterQueue {
  private filePath: string;
  private entries: DeadLetterEntry[] = [];

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), '.blocklog_dlq.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf8');
        this.entries = JSON.parse(content) || [];
      } else {
        this.entries = [];
      }
    } catch (error) {
      this.entries = [];
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.entries, null, 2), 'utf8');
    } catch (error) {
      // Suppress write errors
    }
  }

  public async add(event: EventEnvelope, reason: string): Promise<void> {
    this.entries.push({
      event,
      reason,
      failedAt: new Date().toISOString(),
    });
    this.saveToDisk();
  }

  public async getEntries(): Promise<DeadLetterEntry[]> {
    return this.entries;
  }

  public async clear(): Promise<void> {
    this.entries = [];
    if (fs.existsSync(this.filePath)) {
      try {
        fs.unlinkSync(this.filePath);
      } catch (err) {
        // Suppress deletion error
      }
    }
  }

  public get length(): number {
    return this.entries.length;
  }
}
