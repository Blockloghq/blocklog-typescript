export function canonicalize(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const arrStr = obj.map((item) => canonicalize(item)).join(',');
    return `[${arrStr}]`;
  }

  const keys = Object.keys(obj).sort();
  const objStr = keys
    .map((key) => {
      const val = obj[key];
      if (val === undefined) return undefined;
      return `${JSON.stringify(key)}:${canonicalize(val)}`;
    })
    .filter((v) => v !== undefined)
    .join(',');

  return `{${objStr}}`;
}
