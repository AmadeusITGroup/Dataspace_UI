export function genericFilter<T>(
  data: T[],
  filter: string | null | undefined,
  valueKeys: string[] = [],
  matcher?: (item: T, key: string, value: string) => boolean
): T[] {
  if (!filter) return data;

  if (filter.includes('=')) {
    const keyValuePairs = filter.split(',').map((pair) => pair.split('='));
    return data.filter((item) =>
      keyValuePairs.every(([key, value]) => {
        const k = key.trim() as keyof T;
        const v = value.trim();
        if (matcher) {
          return matcher(item, k.toString(), v);
        }
        const itemValue = item[k];
        return typeof itemValue === 'string'
          ? itemValue.toLowerCase().includes(v.toLowerCase())
          : itemValue?.toString().toLowerCase().includes(v.toLowerCase());
      })
    );
  }

  const lowerFilter = filter.toLowerCase();
  return data.filter((item) =>
    valueKeys.some((key) => {
      if (matcher) {
        return matcher(item, key, lowerFilter);
      }
      const val = item[key as keyof T];
      return typeof val === 'string'
        ? val.toLowerCase().includes(lowerFilter)
        : val?.toString().toLowerCase().includes(lowerFilter);
    })
  );
}
