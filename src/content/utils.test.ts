import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  sortByDate,
  debutEvent,
  buildTimeline,
  readingTime,
  thumbnailUrl,
  publishedPosts,
  WORDS_PER_MINUTE,
  type RawEvent,
} from "./utils.ts";

// ── readingTime ─────────────────────────────────────

describe("readingTime", () => {
  it("returns 1 for undefined body", () => {
    assert.equal(readingTime(undefined), 1);
  });

  it("returns 1 for empty string", () => {
    assert.equal(readingTime(""), 1);
  });

  it("returns 1 for short text under 300 words", () => {
    const body = Array(100).fill("word").join(" ");
    assert.equal(readingTime(body), 1);
  });

  it("returns 1 for exactly 300 words", () => {
    const body = Array(WORDS_PER_MINUTE).fill("word").join(" ");
    assert.equal(readingTime(body), 1);
  });

  it("rounds up to next minute", () => {
    const body = Array(WORDS_PER_MINUTE + 1).fill("word").join(" ");
    assert.equal(readingTime(body), 2);
  });

  it("returns correct value for 600-word text", () => {
    const body = Array(WORDS_PER_MINUTE * 2).fill("word").join(" ");
    assert.equal(readingTime(body), 2);
  });
});

// ── thumbnailUrl ────────────────────────────────────

describe("thumbnailUrl", () => {
  it("replaces filename with thumbnails/filename.webp", () => {
    assert.equal(
      thumbnailUrl("https://images.example.com/photos/sunset.jpg"),
      "https://images.example.com/photos/thumbnails/sunset.webp",
    );
  });

  it("handles .png extension", () => {
    assert.equal(
      thumbnailUrl("https://cdn.example.com/photo.png"),
      "https://cdn.example.com/thumbnails/photo.webp",
    );
  });

  it("handles .avif extension", () => {
    assert.equal(
      thumbnailUrl("/images/my-photo.avif"),
      "/images/thumbnails/my-photo.webp",
    );
  });

  it("handles filenames with hyphens and numbers", () => {
    assert.equal(
      thumbnailUrl("https://cdn.test/gallery/20260327-blue-screen.jpg"),
      "https://cdn.test/gallery/thumbnails/20260327-blue-screen.webp",
    );
  });
});

// ── publishedPosts ──────────────────────────────────

describe("publishedPosts", () => {
  const makePost = (
    title: string,
    pubDate: Date,
    draft: boolean = false,
  ) => ({
    data: { title, pubDate, draft },
  });

  it("filters out drafts and sorts by pubDate descending", () => {
    const posts = [
      makePost("old", new Date("2024-01-01")),
      makePost("draft", new Date("2024-06-01"), true),
      makePost("new", new Date("2024-12-01")),
    ];
    const result = publishedPosts(posts);
    assert.equal(result.length, 2);
    assert.equal(result[0].data.title, "new");
    assert.equal(result[1].data.title, "old");
  });

  it("returns empty array when all posts are drafts", () => {
    const posts = [makePost("a", new Date(), true)];
    assert.equal(publishedPosts(posts).length, 0);
  });

  it("does not mutate the input array", () => {
    const posts = [
      makePost("b", new Date("2024-06-01")),
      makePost("a", new Date("2024-01-01")),
    ];
    const original = [...posts];
    publishedPosts(posts);
    assert.deepEqual(posts, original);
  });
});

// ── sortByDate ──────────────────────────────────────

describe("sortByDate", () => {
  const entry = (date?: Date) => ({ data: { date } });

  it("sorts entries by date descending", () => {
    const entries = [
      entry(new Date("2024-01-01")),
      entry(new Date("2024-12-01")),
      entry(new Date("2024-06-01")),
    ];
    const result = sortByDate(entries);
    assert.equal(result[0].data.date!.getMonth(), 11); // Dec
    assert.equal(result[1].data.date!.getMonth(), 5); // Jun
    assert.equal(result[2].data.date!.getMonth(), 0); // Jan
  });

  it("puts undated entries last", () => {
    const entries = [entry(undefined), entry(new Date("2024-01-01"))];
    const result = sortByDate(entries);
    assert.ok(result[0].data.date);
    assert.equal(result[1].data.date, undefined);
  });

  it("returns empty array for empty input", () => {
    assert.deepEqual(sortByDate([]), []);
  });

  it("does not mutate the original array", () => {
    const entries = [
      entry(new Date("2024-12-01")),
      entry(new Date("2024-01-01")),
    ];
    const original = [...entries];
    sortByDate(entries);
    assert.deepEqual(entries, original);
  });
});

// ── debutEvent ──────────────────────────────────────

describe("debutEvent", () => {
  const NOW = new Date("2025-06-01T00:00:00Z");

  beforeEach(() => {
    mock.timers.enable({ apis: ["Date"] });
    mock.timers.setTime(NOW.getTime());
  });

  afterEach(() => {
    mock.timers.reset();
  });

  const event = (
    scope: RawEvent["scope"],
    date: string,
  ): RawEvent => ({
    date: new Date(date),
    name: `${scope} event`,
    location: "Test City",
    scope,
  });

  it("returns undefined for empty events array", () => {
    assert.equal(debutEvent([]), undefined);
  });

  it("returns the only event when there is one", () => {
    const e = event("internal", "2025-01-01");
    assert.deepEqual(debutEvent([e]), e);
  });

  it("prefers national over regional and internal", () => {
    const events = [
      event("internal", "2025-01-01"),
      event("regional", "2025-02-01"),
      event("national", "2025-03-01"),
    ];
    assert.equal(debutEvent(events)!.scope, "national");
  });

  it("prefers regional over internal when no national", () => {
    const events = [
      event("internal", "2025-01-01"),
      event("regional", "2025-02-01"),
    ];
    assert.equal(debutEvent(events)!.scope, "regional");
  });

  it("returns earliest event of highest scope", () => {
    const early = event("national", "2025-01-15");
    const late = event("national", "2025-04-15");
    assert.deepEqual(debutEvent([late, early]), early);
  });

  it("ignores upcoming events when past events exist", () => {
    const past = event("regional", "2025-03-01"); // before NOW
    const upcoming = event("national", "2025-12-01"); // after NOW
    const result = debutEvent([past, upcoming]);
    // Should pick the past regional, not the upcoming national
    assert.equal(result!.scope, "regional");
  });

  it("uses all events when none are past", () => {
    const events = [
      event("internal", "2025-12-01"),
      event("national", "2026-06-01"),
    ];
    const result = debutEvent(events);
    assert.equal(result!.scope, "national");
  });

  it("does not mutate the input array", () => {
    const events = [
      event("national", "2025-03-01"),
      event("regional", "2025-01-01"),
    ];
    const original = [...events];
    debutEvent(events);
    assert.deepEqual(events, original);
  });
});

// ── buildTimeline ───────────────────────────────────

describe("buildTimeline", () => {
  const NOW = new Date("2025-06-01T00:00:00Z");

  beforeEach(() => {
    mock.timers.enable({ apis: ["Date"] });
    mock.timers.setTime(NOW.getTime());
  });

  afterEach(() => {
    mock.timers.reset();
  });

  const makeTalk = (
    id: string,
    title: string,
    events: RawEvent[],
  ) => ({ id, data: { title, events } });

  const makeEvent = (
    date: string,
    name: string,
    location: string = "City",
  ): RawEvent => ({
    date: new Date(date),
    name,
    location,
    scope: "national" as const,
  });

  it("returns empty array for empty input", () => {
    assert.deepEqual(buildTimeline([], "en"), []);
  });

  it("groups talks by event (same date + same name)", () => {
    const ev = makeEvent("2025-03-15", "Conference A");
    const talks = [
      makeTalk("en/talk-1", "Talk 1", [ev]),
      makeTalk("en/talk-2", "Talk 2", [ev]),
    ];
    const result = buildTimeline(talks, "en");
    assert.equal(result.length, 1); // one year
    assert.equal(result[0].events.length, 1); // one event group
    assert.equal(result[0].events[0].talks.length, 2); // two talks
  });

  it("sorts years descending", () => {
    const talks = [
      makeTalk("en/old", "Old Talk", [makeEvent("2023-06-01", "Conf")]),
      makeTalk("en/new", "New Talk", [makeEvent("2025-03-01", "Conf")]),
    ];
    const result = buildTimeline(talks, "en");
    assert.equal(result[0].year, 2025);
    assert.equal(result[1].year, 2023);
  });

  it("sorts events within a year newest-first", () => {
    const talks = [
      makeTalk("en/jan", "Jan Talk", [makeEvent("2025-01-10", "Conf A")]),
      makeTalk("en/mar", "Mar Talk", [makeEvent("2025-03-20", "Conf B")]),
    ];
    const result = buildTimeline(talks, "en");
    assert.equal(result[0].events[0].name, "Conf B"); // March first
    assert.equal(result[0].events[1].name, "Conf A"); // January second
  });

  it("marks upcoming events correctly", () => {
    const talks = [
      makeTalk("en/past", "Past Talk", [makeEvent("2025-01-01", "Past Conf")]),
      makeTalk("en/future", "Future Talk", [
        makeEvent("2025-12-01", "Future Conf"),
      ]),
    ];
    const result = buildTimeline(talks, "en");
    const events = result[0].events;
    const futureEvent = events.find((e) => e.name === "Future Conf")!;
    const pastEvent = events.find((e) => e.name === "Past Conf")!;
    assert.equal(futureEvent.upcoming, true);
    assert.equal(pastEvent.upcoming, false);
  });

  it("computes talk slugs using slugOf", () => {
    const talks = [
      makeTalk("en/my-talk", "My Talk", [makeEvent("2025-03-01", "Conf")]),
    ];
    const result = buildTimeline(talks, "en");
    assert.equal(result[0].events[0].talks[0].slug, "my-talk");
  });

  it("handles a talk with events across different years", () => {
    const talks = [
      makeTalk("en/multi", "Multi Year Talk", [
        makeEvent("2024-06-01", "Conf 2024"),
        makeEvent("2025-03-01", "Conf 2025"),
      ]),
    ];
    const result = buildTimeline(talks, "en");
    assert.equal(result.length, 2);
    assert.equal(result[0].year, 2025);
    assert.equal(result[1].year, 2024);
  });
});
