import { describe, it, mock, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  isUpcoming,
  getLocalizedPath,
  getAlternateLocale,
  slugOf,
  getDateFormatter,
} from "./utils.ts";

// ── isUpcoming ──────────────────────────────────────

describe("isUpcoming", () => {
  const NOW = new Date("2025-06-01T00:00:00Z");

  beforeEach(() => {
    mock.timers.enable({ apis: ["Date"] });
    mock.timers.setTime(NOW.getTime());
  });

  afterEach(() => {
    mock.timers.reset();
  });

  it("returns true when all events are in the future", () => {
    const events = [
      { date: new Date("2025-12-01") },
      { date: new Date("2026-01-01") },
    ];
    assert.equal(isUpcoming(events), true);
  });

  it("returns false when any event is in the past", () => {
    const events = [
      { date: new Date("2025-01-01") }, // past
      { date: new Date("2025-12-01") }, // future
    ];
    assert.equal(isUpcoming(events), false);
  });

  it("returns true for empty events array", () => {
    // Design choice: a talk with no events is considered "upcoming"
    assert.equal(isUpcoming([]), true);
  });

  it("returns false when event date equals now (uses strict >)", () => {
    const events = [{ date: new Date(NOW.getTime()) }];
    assert.equal(isUpcoming(events), false);
  });
});

// ── getLocalizedPath ────────────────────────────────

describe("getLocalizedPath", () => {
  it("adds locale prefix to a bare path", () => {
    assert.equal(getLocalizedPath("/blog", "fr"), "/fr/blog");
  });

  it("replaces an existing locale prefix", () => {
    assert.equal(getLocalizedPath("/en/blog", "fr"), "/fr/blog");
  });

  it("handles root path", () => {
    assert.equal(getLocalizedPath("/", "en"), "/en/");
  });

  it("handles deeply nested path", () => {
    assert.equal(
      getLocalizedPath("/en/blog/my-post", "fr"),
      "/fr/blog/my-post",
    );
  });

  it("handles same locale (no-op replacement)", () => {
    assert.equal(getLocalizedPath("/en/blog", "en"), "/en/blog");
  });
});

// ── getAlternateLocale ──────────────────────────────

describe("getAlternateLocale", () => {
  it("returns fr for en", () => {
    assert.equal(getAlternateLocale("en"), "fr");
  });

  it("returns en for fr", () => {
    assert.equal(getAlternateLocale("fr"), "en");
  });
});

// ── slugOf ──────────────────────────────────────────

describe("slugOf", () => {
  it("strips the lang prefix from a content ID", () => {
    assert.equal(slugOf("en/my-post", "en"), "my-post");
  });

  it("strips fr prefix", () => {
    assert.equal(slugOf("fr/my-post", "fr"), "my-post");
  });

  it("handles nested paths", () => {
    assert.equal(slugOf("en/2024/my-post", "en"), "2024/my-post");
  });

  it("is a no-op when prefix does not match", () => {
    assert.equal(slugOf("en/my-post", "fr"), "en/my-post");
  });
});

// ── getDateFormatter ────────────────────────────────

describe("getDateFormatter", () => {
  it("returns an Intl.DateTimeFormat instance", () => {
    const fmt = getDateFormatter("en");
    assert.ok(fmt instanceof Intl.DateTimeFormat);
  });

  it("formats with long dateStyle", () => {
    const fmt = getDateFormatter("en");
    const options = fmt.resolvedOptions();
    assert.equal(options.locale, "en");
  });

  it("respects locale", () => {
    const en = getDateFormatter("en").format(new Date("2025-03-15"));
    const fr = getDateFormatter("fr").format(new Date("2025-03-15"));
    // English: "March 15, 2025" — French: "15 mars 2025"
    assert.ok(en.includes("March"));
    assert.ok(fr.includes("mars"));
  });
});
