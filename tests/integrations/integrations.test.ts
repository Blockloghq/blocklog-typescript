import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import blocklog from '../../src/index';
import { BlocklogClient } from '../../src/client';

describe('Integrations', () => {
  let client: BlocklogClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = blocklog.init({ apiKey: 'test' });
    vi.spyOn(client, 'enqueue').mockResolvedValue(null);
  });

  afterEach(() => {
    client.shutdown();
  });

  describe('LangChain Integration', () => {
    it('should instrument LangChain chain lifecycle', () => {
      const tracer = blocklog.instrumentLangChain();
      
      tracer.handleChainStart({ name: 'test-chain' }, { input: 'test' }, 'run-id-1');
      expect(client.enqueue).toHaveBeenCalledWith('LANGCHAIN_CHAIN_START', expect.objectContaining({ run_id: 'run-id-1' }));
      
      tracer.handleChainEnd({ output: 'result' }, 'run-id-1');
      expect(client.enqueue).toHaveBeenCalledWith('LANGCHAIN_CHAIN_END', expect.objectContaining({ run_id: 'run-id-1' }));
    });

    it('should instrument LangChain tool calls', () => {
      const tracer = blocklog.instrumentLangChain();
      
      tracer.handleToolStart({ name: 'search-tool' }, 'test query', 'tool-run-id');
      expect(client.enqueue).toHaveBeenCalledWith('LANGCHAIN_TOOL_START', expect.objectContaining({ run_id: 'tool-run-id' }));

      tracer.handleToolEnd('search results', 'tool-run-id');
      expect(client.enqueue).toHaveBeenCalledWith('LANGCHAIN_TOOL_END', expect.objectContaining({ run_id: 'tool-run-id' }));
    });

    it('should instrument LangChain LLM calls', () => {
      const tracer = blocklog.instrumentLangChain();
      
      tracer.handleLLMStart({ model: 'gpt-4' }, ['test prompt'], 'llm-run-id');
      expect(client.enqueue).toHaveBeenCalledWith('LANGCHAIN_LLM_START', expect.objectContaining({ run_id: 'llm-run-id' }));

      tracer.handleLLMEnd({ output: 'LLM response' }, 'llm-run-id');
      expect(client.enqueue).toHaveBeenCalledWith('LANGCHAIN_LLM_END', expect.objectContaining({ run_id: 'llm-run-id' }));
    });

    it('should preserve trace context across LangChain operations', () => {
      const tracer = blocklog.instrumentLangChain();
      
      tracer.handleChainStart({ name: 'parent-chain' }, {}, 'parent-id');
      tracer.handleToolStart({ name: 'child-tool' }, 'input', 'child-id');
      
      expect(client.enqueue).toHaveBeenCalledTimes(2);
    });
  });

  describe('LangGraph Integration', () => {
    it('should instrument LangGraph node lifecycle', () => {
      const hooks = blocklog.instrumentLangGraph();
      
      hooks.onNodeStart('node-a', { input: 'test' }, 'graph-run-id');
      expect(client.enqueue).toHaveBeenCalledWith('LANGGRAPH_NODE_START', expect.any(Object));

      hooks.onNodeEnd('node-a', { output: 'result' }, 'graph-run-id');
      expect(client.enqueue).toHaveBeenCalledWith('LANGGRAPH_NODE_END', expect.any(Object));
    });

    it('should instrument LangGraph edges', () => {
      const hooks = blocklog.instrumentLangGraph();
      
      hooks.onEdge('node-a', 'node-b', true, 'graph-run-id');
      expect(client.enqueue).toHaveBeenCalledWith('LANGGRAPH_EDGE', expect.any(Object));
    });
  });

  describe('OpenAI Agents Integration', () => {
    it('should instrument OpenAI agent runs', () => {
      const hooks = blocklog.instrumentOpenAIAgents();
      
      hooks.onAgentRunStart('test-agent', { input: 'test' });
      expect(client.enqueue).toHaveBeenCalledWith('OPENAI_AGENT_RUN_START', expect.any(Object));

      hooks.onAgentRunEnd('test-agent', { output: 'result' });
      expect(client.enqueue).toHaveBeenCalledWith('OPENAI_AGENT_RUN_END', expect.any(Object));
    });

    it('should instrument OpenAI tool calls', () => {
      const hooks = blocklog.instrumentOpenAIAgents();
      
      hooks.onToolCall('calculator', { operation: 'add' });
      expect(client.enqueue).toHaveBeenCalledWith('OPENAI_TOOL_CALL', expect.any(Object));
    });

    it('should instrument OpenAI messages', () => {
      const hooks = blocklog.instrumentOpenAIAgents();
      
      hooks.onMessage('user', 'Hello, how are you?');
      expect(client.enqueue).toHaveBeenCalledWith('OPENAI_MESSAGE', expect.any(Object));

      hooks.onMessage('assistant', 'I am doing well!');
      expect(client.enqueue).toHaveBeenCalledWith('OPENAI_MESSAGE', expect.any(Object));
    });
  });

  describe('Integration Error Handling', () => {
    it('should handle integration errors gracefully', () => {
      const tracer = blocklog.instrumentLangChain();
      
      // Simulate enqueue failure
      vi.spyOn(client, 'enqueue').mockRejectedValue(new Error('Network error'));
      
      expect(() => {
        tracer.handleChainStart({ name: 'test' }, {}, 'id');
      }).not.toThrow();
    });

    it('should continue integration after errors', () => {
      const tracer = blocklog.instrumentLangChain();
      
      vi.spyOn(client, 'enqueue').mockRejectedValueOnce(new Error('Network error'));
      
      tracer.handleChainStart({ name: 'test' }, {}, 'id-1');
      tracer.handleChainEnd({}, 'id-1');
      
      expect(client.enqueue).toHaveBeenCalledTimes(2);
    });
  });
});
