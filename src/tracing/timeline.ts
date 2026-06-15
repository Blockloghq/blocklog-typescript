import { Span } from './span';

export class Timeline {
  public static formatSpans(spans: Span[]): string {
    if (spans.length === 0) return '';
    
    // Sort spans by start time
    const sorted = [...spans].sort((a, b) => a.startTime - b.startTime);
    
    // Build parent-child mapping
    const rootSpans = sorted.filter(s => !s.parentId || !spans.some(p => p.id === s.parentId));
    const childrenMap = new Map<string, Span[]>();
    
    sorted.forEach(span => {
      if (span.parentId) {
        if (!childrenMap.has(span.parentId)) {
          childrenMap.set(span.parentId, []);
        }
        childrenMap.get(span.parentId)!.push(span);
      }
    });

    const lines: string[] = [];
    const printNode = (span: Span, depth: number) => {
      const indent = '  '.repeat(depth);
      const duration = span.durationMs !== null ? `${span.durationMs}ms` : 'pending';
      const statusSymbol = span.status === 'ok' ? '✓' : (span.status === 'error' ? '✗' : '○');
      lines.push(`${indent}${statusSymbol} [${span.name}] (Span: ${span.id}, Trace: ${span.traceId}) [${duration}]`);
      
      const children = childrenMap.get(span.id) || [];
      children.forEach(child => printNode(child, depth + 1));
    };

    rootSpans.forEach(root => printNode(root, 0));
    return lines.join('\n');
  }
}
