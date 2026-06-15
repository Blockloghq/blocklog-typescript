export type Listener<T = any> = (data: T) => void | Promise<void>;

export class EventEmitter {
  private listeners: Map<string, Set<Listener>> = new Map();

  public on<T = any>(event: string, listener: Listener<T>): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return this;
  }

  public off<T = any>(event: string, listener: Listener<T>): this {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
    return this;
  }

  public async emit<T = any>(event: string, data: T): Promise<void> {
    const set = this.listeners.get(event);
    if (set) {
      const promises: any[] = [];
      set.forEach(listener => {
        try {
          const res = listener(data);
          if (res instanceof Promise) {
            promises.push(res);
          }
        } catch (err) {
          // Suppress hook execution errors
        }
      });
      await Promise.all(promises);
    }
  }
}
