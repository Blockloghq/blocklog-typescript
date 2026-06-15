import { describe, it, expect, vi, beforeEach } from 'vitest';
import blocklog from '../src/index';

describe('Tool Tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    blocklog.init({ apiKey: 'test' });
    vi.spyOn(blocklog.client!, 'enqueue').mockResolvedValue(null);
  });

  it('should track tool execution', async () => {
    class SearchTool {
      @blocklog.tool({ name: 'search_web' })
      async search(query: string) {
        return `Results for ${query}`;
      }
    }

    const tool = new SearchTool();
    const res = await tool.search('apple');
    expect(res).toBe('Results for apple');

    expect(blocklog.client!.enqueue).toHaveBeenCalledTimes(2);
    expect(blocklog.client!.enqueue).toHaveBeenNthCalledWith(1, 'TOOL_START', expect.objectContaining({ tool_name: 'search_web', inputs: ['apple'] }));
    expect(blocklog.client!.enqueue).toHaveBeenNthCalledWith(2, 'TOOL_COMPLETE', expect.objectContaining({ tool_name: 'search_web', outputs: 'Results for apple' }));
  });

  it('should track tool errors', async () => {
    class BadTool {
      @blocklog.tool('bad_tool')
      async fail() {
        throw new Error('Failure');
      }
    }

    const tool = new BadTool();
    await expect(tool.fail()).rejects.toThrow('Failure');

    expect(blocklog.client!.enqueue).toHaveBeenCalledTimes(2);
    expect(blocklog.client!.enqueue).toHaveBeenNthCalledWith(1, 'TOOL_START', expect.any(Object));
    expect(blocklog.client!.enqueue).toHaveBeenNthCalledWith(2, 'TOOL_ERROR', expect.objectContaining({ error_message: 'Failure' }));
  });
});
