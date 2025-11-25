export function jsonToKeyValueString(obj: any): string {
    if (typeof obj === 'string') return obj;

    const convertToKeyValue = (data: any, prefix = ''): string[] => {
      const result: string[] = [];

      if (typeof data === 'object' && data !== null) {
        for (const [key, value] of Object.entries(data)) {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (typeof value === 'object' && value !== null) {
            result.push(...convertToKeyValue(value, newKey));
          } else {
            result.push(`${newKey}: ${value}`);
          }
        }
      } else {
        result.push(`${prefix}: ${data}`);
      }

      return result;
    };

    return convertToKeyValue(obj).join('\n');
}