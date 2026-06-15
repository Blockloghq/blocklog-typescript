import { getGlobalClient } from '../globals';

export function instrumentLangGraph() {
  const client = getGlobalClient();
  
  return {
    onNodeStart: (nodeName: string, state: any, runId: string) => {
      client.enqueue('LANGGRAPH_NODE_START', { node_name: nodeName, state, run_id: runId });
    },
    onNodeEnd: (nodeName: string, state: any, runId: string) => {
      client.enqueue('LANGGRAPH_NODE_END', { node_name: nodeName, state, run_id: runId });
    },
    onEdge: (from: string, to: string, condition: boolean, runId: string) => {
      client.enqueue('LANGGRAPH_EDGE', { from, to, condition, run_id: runId });
    }
  };
}
