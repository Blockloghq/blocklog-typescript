import { describe, it, expect } from 'vitest';
import { EventBuffer } from '../src/batching/buffer';

describe('EventBuffer', () => {
  it('should buffer events and flush when batch size is reached', () => {
    const buffer = new EventBuffer(3);
    
    expect(buffer.add({ event_type: '1' } as any)).toBeNull();
    expect(buffer.length).toBe(1);
    
    expect(buffer.add({ event_type: '2' } as any)).toBeNull();
    expect(buffer.length).toBe(2);
    
    const batch = buffer.add({ event_type: '3' } as any);
    expect(batch).toHaveLength(3);
    expect(buffer.length).toBe(0);
  });

  it('should manually flush', () => {
    const buffer = new EventBuffer(10);
    buffer.add({ event_type: '1' } as any);
    
    const batch = buffer.flush();
    expect(batch).toHaveLength(1);
    expect(buffer.length).toBe(0);
  });
});
