import { slugOf, isUpcoming, type Locale } from '../i18n/utils';

/** Sorts content entries by `data.date` descending (undated entries sort last) */
export function sortByDate<T extends { data: { date?: Date } }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => {
    if (!a.data.date && !b.data.date) return 0;
    if (!a.data.date) return 1;
    if (!b.data.date) return -1;
    return b.data.date.valueOf() - a.data.date.valueOf();
  });
}

type RawEvent = { date: Date; name: string; location: string; scope: 'internal' | 'regional' | 'national' };

export type TimelineTalk = {
  title: string;
  slug: string;
  upcoming: boolean;
};

export type TimelineEventGroup = {
  date: Date;
  name: string;
  location: string;
  upcoming: boolean;
  talks: TimelineTalk[];
};

export type TimelineYear = {
  year: number;
  events: TimelineEventGroup[];
};

/** Groups talks by event (same name + same day), sorts newest-first within each year */
export function buildTimeline(
  talks: { id: string; data: { title: string; events: RawEvent[] } }[],
  lang: Locale
): TimelineYear[] {
  // Key: ISO date (YYYY-MM-DD) + event name — identifies a unique occurrence
  const grouped = new Map<string, TimelineEventGroup>();

  for (const talk of talks) {
    for (const event of talk.data.events) {
      const key = `${event.date.toISOString().slice(0, 10)}|${event.name}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          date: event.date,
          name: event.name,
          location: event.location,
          upcoming: false,
          talks: [],
        });
      }
      const group = grouped.get(key)!;
      group.talks.push({
        title: talk.data.title,
        slug: slugOf(talk.id, lang),
        upcoming: isUpcoming([event]),
      });
      if (isUpcoming([event])) group.upcoming = true;
    }
  }

  const byYear = new Map<number, TimelineEventGroup[]>();
  for (const group of grouped.values()) {
    const year = group.date.getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(group);
  }

  // Sort events within each year newest-first
  for (const events of byYear.values()) {
    events.sort((a, b) => b.date.valueOf() - a.date.valueOf());
  }

  return [...byYear.keys()]
    .sort((a, b) => b - a)
    .map(year => ({ year, events: byYear.get(year)! }));
}
