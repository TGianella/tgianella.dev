import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  stripLocale,
  getPageWeight,
  resolveDirection,
} from "./view-transition-utils.ts";

// ── stripLocale ─────────────────────────────────────

describe("stripLocale", () => {
  it("strips /fr prefix", () => {
    assert.equal(stripLocale("/fr/talks"), "/talks");
  });

  it('returns "/" for bare /fr', () => {
    assert.equal(stripLocale("/fr"), "/");
  });

  it("leaves /en paths unchanged (en has no prefix)", () => {
    assert.equal(stripLocale("/en/blog"), "/en/blog");
    assert.equal(stripLocale("/en"), "/en");
  });

  it("does not strip locale in the middle of a path", () => {
    assert.equal(stripLocale("/blog/fr/post"), "/blog/fr/post");
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
    assert.equal(getPageWeight("/"), 0);
    assert.equal(getPageWeight("/fr"), 0);
    assert.equal(getPageWeight("/fr/"), 0);
  });

  it("blog index = 10", () => {
    assert.equal(getPageWeight("/blog"), 10);
    assert.equal(getPageWeight("/fr/blog"), 10);
  });

  it("blog post = 15", () => {
    assert.equal(getPageWeight("/blog/my-post"), 15);
  });

  it("talks index = 20", () => {
    assert.equal(getPageWeight("/fr/talks"), 20);
    assert.equal(getPageWeight("/talks"), 20);
  });

  it("talk detail = 25", () => {
    assert.equal(getPageWeight("/talks/my-talk"), 25);
  });

  it("gallery index = 30", () => {
    assert.equal(getPageWeight("/blue-screens"), 30);
  });

  it("gallery detail = 35", () => {
    assert.equal(getPageWeight("/fr/blue-screens/photo-1"), 35);
  });

  it("unknown route = -1", () => {
    assert.equal(getPageWeight("/unknown"), -1);
  });
});

// ── resolveDirection ────────────────────────────────

describe("resolveDirection", () => {
  it("returns forward when navigating to higher weight", () => {
    assert.equal(
      resolveDirection({ pathname: "/" }, { pathname: "/blog" }),
      "forward",
    );
  });

  it("returns back when navigating to lower weight", () => {
    assert.equal(
      resolveDirection({ pathname: "/blog" }, { pathname: "/" }),
      "back",
    );
  });

  it("returns none when weights are equal", () => {
    assert.equal(
      resolveDirection({ pathname: "/blog" }, { pathname: "/fr/blog" }),
      "none",
    );
  });

  it("returns none when either route is unknown", () => {
    assert.equal(
      resolveDirection({ pathname: "/unknown" }, { pathname: "/blog" }),
      "none",
    );
  });

  it("gallery: forward when to matches nextHref", () => {
    assert.equal(
      resolveDirection(
        { pathname: "/blue-screens/photo-1" },
        { pathname: "/blue-screens/photo-2" },
        { nextHref: "/blue-screens/photo-2" },
      ),
      "forward",
    );
  });

  it("gallery: back when to matches prevHref", () => {
    assert.equal(
      resolveDirection(
        { pathname: "/blue-screens/photo-2" },
        { pathname: "/blue-screens/photo-1" },
        { prevHref: "/blue-screens/photo-1" },
      ),
      "back",
    );
  });

  it("gallery: none when neither prev nor next matches", () => {
    assert.equal(
      resolveDirection(
        { pathname: "/blue-screens/photo-1" },
        { pathname: "/blue-screens/photo-3" },
        { prevHref: "/blue-screens/photo-0" },
      ),
      "none",
    );
  });

  it("blog to talks is forward", () => {
    assert.equal(
      resolveDirection({ pathname: "/blog" }, { pathname: "/talks" }),
      "forward",
    );
  });

  it("talks to blog is back", () => {
    assert.equal(
      resolveDirection({ pathname: "/talks" }, { pathname: "/blog" }),
      "back",
    );
  });
});
