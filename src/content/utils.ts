/** Sorts content entries by `data.date` descending (undated entries sort last) */
export function sortByDate<T extends { data: { date?: Date } }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    if (!a.data.date && !b.data.date) return 0;
    if (!a.data.date) return 1;
    if (!b.data.date) return -1;
    return b.data.date.valueOf() - a.data.date.valueOf();
  });
}
