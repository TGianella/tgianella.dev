import { slugOf, isUpcoming, type Locale } from "../i18n/utils.ts";

export const WORDS_PER_MINUTE = 300;

/** Estimates reading time in minutes from raw MDX body text. Returns at least 1. */
export function readingTime(body: string | undefined): number {
  const wordCount = body?.split(/\s+/).length ?? 0;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

/** Transforms a gallery photo source URL to its thumbnail WebP variant. */
export function thumbnailUrl(src: string): string {
  return src.replace(/\/([^/]+)\.[^.]+$/, "/thumbnails/$1.webp");
}

/** Filters out drafts and sorts by pubDate descending. */
export function publishedPosts<
  T extends { data: { draft?: boolean; pubDate: Date } },
>(posts: T[]): T[] {
  return posts
    .filter((p) => !p.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Sorts content entries by `data.date` descending (undated entries sort last) */
export function sortByDate<T extends { data: { date?: Date } }>(
  entries: T[],
): T[] {
  return [...entries].sort((a, b) => {
    if (!a.data.date && !b.data.date) return 0;
    if (!a.data.date) return 1;
    if (!b.data.date) return -1;
    return b.data.date.valueOf() - a.data.date.valueOf();
  });
}

export type RawEvent = {
  date: Date;
  name: string;
  location: string;
  scope: "internal" | "regional" | "national";
};

/** Returns the debut event for a talk: earliest national, then regional, then internal.
 *  Ignores upcoming events when past events exist, so a talk already given at a regional
 *  conference doesn't show an upcoming national event as its debut. */
export function debutEvent(events: RawEvent[]): RawEvent | undefined {
  const now = new Date();
  const pool = events.some((e) => e.date <= now)
    ? events.filter((e) => e.date <= now)
    : events;
  const earliest = (scope: RawEvent["scope"]) =>
    pool
      .filter((e) => e.scope === scope)
      .sort((a, b) => a.date.valueOf() - b.date.valueOf())[0];
  return earliest("national") ?? earliest("regional") ?? earliest("internal");
}

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
  lang: Locale,
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
    .map((year) => ({ year, events: byYear.get(year)! }));
}
