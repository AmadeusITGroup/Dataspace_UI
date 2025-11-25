export function convertToTypeheadList<T>(
  list: T[],
  key: keyof T,
  enableUniq = true,
  enableSorting = true
): string[] {
  let result = list.map((item) => (item[key] as unknown as string) || '').filter(Boolean);
  if (enableUniq) {
    result = Array.from(new Set(result));
  }
  if (enableSorting) {
    result = result.sort((a, b) => a.localeCompare(b));
  }
  return result;
}
