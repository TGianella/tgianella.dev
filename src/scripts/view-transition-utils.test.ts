import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  stripLocale,
  getPageWeight,
  resolveDirection,
} from "./view-transition-utils.ts";

// ── stripLocale ─────────────────────────────────────

describe("stripLocale", () => {
  it("strips /en prefix", () => {
    assert.equal(stripLocale("/en/blog"), "/blog");
  });

  it("strips /fr prefix", () => {
    assert.equal(stripLocale("/fr/talks"), "/talks");
  });

  it('returns "/" for bare /en', () => {
    assert.equal(stripLocale("/en"), "/");
  });

  it('returns "/" for bare /fr', () => {
    assert.equal(stripLocale("/fr"), "/");
  });

  it("does not strip locale in the middle of a path", () => {
    assert.equal(stripLocale("/blog/en/post"), "/blog/en/post");
  });

  it("returns path unchanged when no locale prefix", () => {
    assert.equal(stripLocale("/blog"), "/blog");
  });

  it('handles root "/"', () => {
    assert.equal(stripLocale("/"), "/");
  });
});

// ── getPageWeight ───────────────────────────────────

describe("getPageWeight", () => {
  it("home = 0", () => {
    assert.equal(getPageWeight("/en"), 0);
    assert.equal(getPageWeight("/fr"), 0);
  });

  it("blog index = 10", () => {
    assert.equal(getPageWeight("/en/blog"), 10);
  });

  it("blog post = 15", () => {
    assert.equal(getPageWeight("/en/blog/my-post"), 15);
  });

  it("talks index = 20", () => {
    assert.equal(getPageWeight("/fr/talks"), 20);
  });

  it("talk detail = 25", () => {
    assert.equal(getPageWeight("/en/talks/my-talk"), 25);
  });

  it("gallery index = 30", () => {
    assert.equal(getPageWeight("/en/blue-screens"), 30);
  });

  it("gallery detail = 35", () => {
    assert.equal(getPageWeight("/fr/blue-screens/photo-1"), 35);
  });

  it("unknown route = -1", () => {
    assert.equal(getPageWeight("/en/unknown"), -1);
  });
});

// ── resolveDirection ────────────────────────────────

describe("resolveDirection", () => {
  it("returns forward when navigating to higher weight", () => {
    assert.equal(
      resolveDirection({ pathname: "/en" }, { pathname: "/en/blog" }),
      "forward",
    );
  });

  it("returns back when navigating to lower weight", () => {
    assert.equal(
      resolveDirection({ pathname: "/en/blog" }, { pathname: "/en" }),
      "back",
    );
  });

  it("returns none when weights are equal", () => {
    assert.equal(
      resolveDirection({ pathname: "/en/blog" }, { pathname: "/fr/blog" }),
      "none",
    );
  });

  it("returns none when either route is unknown", () => {
    assert.equal(
      resolveDirection({ pathname: "/en/unknown" }, { pathname: "/en/blog" }),
      "none",
    );
  });

  it("gallery: forward when to matches nextHref", () => {
    assert.equal(
      resolveDirection(
        { pathname: "/en/blue-screens/photo-1" },
        { pathname: "/en/blue-screens/photo-2" },
        { nextHref: "/en/blue-screens/photo-2" },
      ),
      "forward",
    );
  });

  it("gallery: back when to matches prevHref", () => {
    assert.equal(
      resolveDirection(
        { pathname: "/en/blue-screens/photo-2" },
        { pathname: "/en/blue-screens/photo-1" },
        { prevHref: "/en/blue-screens/photo-1" },
      ),
      "back",
    );
  });

  it("gallery: none when neither prev nor next matches", () => {
    assert.equal(
      resolveDirection(
        { pathname: "/en/blue-screens/photo-1" },
        { pathname: "/en/blue-screens/photo-3" },
        { prevHref: "/en/blue-screens/photo-0" },
      ),
      "none",
    );
  });

  it("blog to talks is forward", () => {
    assert.equal(
      resolveDirection({ pathname: "/en/blog" }, { pathname: "/en/talks" }),
      "forward",
    );
  });

  it("talks to blog is back", () => {
    assert.equal(
      resolveDirection({ pathname: "/en/talks" }, { pathname: "/en/blog" }),
      "back",
    );
  });
});
