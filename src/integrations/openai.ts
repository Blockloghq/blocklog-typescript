import { getGlobalClient } from '../globals';

export function instrumentOpenAIAgents() {
  const client = getGlobalClient();

  return {
    onAgentRunStart: (agentId: string, input: any) => {
      client.enqueue('OPENAI_AGENT_RUN_START', { agent_id: agentId, input });
    },
    onAgentRunEnd: (agentId: string, output: any) => {
      client.enqueue('OPENAI_AGENT_RUN_END', { agent_id: agentId, output });
    },
    onToolCall: (toolName: string, args: any) => {
      client.enqueue('OPENAI_TOOL_CALL', { tool_name: toolName, args });
    },
    onMessage: (role: string, content: string) => {
      client.enqueue('OPENAI_MESSAGE', { role, content });
    }
  };
}
