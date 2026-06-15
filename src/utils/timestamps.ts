export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

export function getDurationMs(startTime: number): number {
  return Date.now() - startTime;
}

export function nowMs(): number {
  return Date.now();
}
