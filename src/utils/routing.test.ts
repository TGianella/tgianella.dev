import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stripLocale } from "./routing.ts";

describe("stripLocale", () => {
  it("strips /fr prefix", () => {
    assert.equal(stripLocale("/fr/talks"), "/talks");
  });

  it('returns "/" for bare /fr', () => {
    assert.equal(stripLocale("/fr"), "/");
  });

  it('returns "/" for /fr/ (trailing slash)', () => {
    assert.equal(stripLocale("/fr/"), "/");
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

  it("strips trailing slash", () => {
    assert.equal(stripLocale("/talks/"), "/talks");
    assert.equal(stripLocale("/blog/my-post/"), "/blog/my-post");
  });

  it("strips both locale prefix and trailing slash", () => {
    assert.equal(stripLocale("/fr/talks/"), "/talks");
    assert.equal(stripLocale("/fr/blog/my-post/"), "/blog/my-post");
  });
});

// Regression guard: Astro's directory-format build serves pages with a trailing
// slash in prod while app-authored hrefs are bare. Any asymmetry between the
// two broke lang-switch and scroll-restore detection (see git history). These
// tests pin the invariant — the same logical path must normalize the same way
// regardless of whether it carries a trailing slash.
describe("stripLocale trailing-slash isometry", () => {
  const LOGICAL_PATHS = [
    "/",
    "/blog",
    "/blog/my-post",
    "/talks",
    "/talks/my-talk",
    "/blue-screens",
    "/blue-screens/photo-1",
    "/fr",
    "/fr/blog",
    "/fr/blog/my-post",
    "/fr/talks",
    "/fr/blue-screens/photo-1",
  ];

  for (const path of LOGICAL_PATHS) {
    it(`stripLocale(${path}) === stripLocale(${path}/)`, () => {
      const withSlash = path.endsWith("/") ? path : `${path}/`;
      assert.equal(stripLocale(path), stripLocale(withSlash));
    });
  }
});
