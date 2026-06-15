export type HookCallback = (payload: Record<string, any>) => Record<string, any>;

export function applyHooks(payload: Record<string, any>, hooks: HookCallback[]): Record<string, any> {
  let mutatedPayload = { ...payload };
  for (const hook of hooks) {
    mutatedPayload = hook(mutatedPayload);
  }
  return mutatedPayload;
}
