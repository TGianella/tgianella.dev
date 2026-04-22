import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getPageWeight, resolveDirection } from "./view-transition-utils.ts";

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

// Regression guard: prod serves routes like `/talks/` while `<a href>` values
// are authored bare. The page-weight / direction helpers must not care which
// side of the transition carries a trailing slash — otherwise lang-switch VT
// groups silently fail to form (as they did on prod before this was fixed).
describe("trailing-slash isometry", () => {
  /** Returns the same path with and without a trailing slash (root unchanged). */
  function variants(path: string): string[] {
    if (path === "/") return ["/"];
    return path.endsWith("/") ? [path, path.slice(0, -1)] : [path, `${path}/`];
  }

  describe("getPageWeight", () => {
    const PATHS = [
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

    for (const path of PATHS) {
      it(`is invariant for ${path}`, () => {
        const results = variants(path).map(getPageWeight);
        assert.equal(
          new Set(results).size,
          1,
          `getPageWeight differs across slash variants: ${JSON.stringify(results)}`,
        );
      });
    }
  });

  describe("resolveDirection", () => {
    // [from, to, expected direction]
    const CASES: Array<[string, string, string]> = [
      ["/", "/blog", "forward"],
      ["/blog", "/", "back"],
      ["/blog", "/talks", "forward"],
      ["/talks", "/blog", "back"],
      ["/blog", "/blog/my-post", "forward"],
      ["/blog/my-post", "/blog", "back"],
      // Language switches: same logical page, different locale → "none"
      ["/talks", "/fr/talks", "none"],
      ["/fr/talks", "/talks", "none"],
      ["/", "/fr", "none"],
      ["/fr", "/", "none"],
    ];

    for (const [from, to, expected] of CASES) {
      it(`${from} → ${to} resolves to "${expected}" regardless of trailing slashes`, () => {
        for (const f of variants(from)) {
          for (const t of variants(to)) {
            assert.equal(
              resolveDirection({ pathname: f }, { pathname: t }),
              expected,
              `resolveDirection(${f} → ${t}) should be "${expected}"`,
            );
          }
        }
      });
    }

    it("gallery direction resolves regardless of trailing slashes on either side", () => {
      const hrefVariants = ["/blue-screens/photo-2", "/blue-screens/photo-2/"];
      for (const pathnameVariant of [
        "/blue-screens/photo-2",
        "/blue-screens/photo-2/",
      ]) {
        for (const hrefVariant of hrefVariants) {
          assert.equal(
            resolveDirection(
              { pathname: "/blue-screens/photo-1" },
              { pathname: pathnameVariant },
              { nextHref: hrefVariant },
            ),
            "forward",
            `nextHref=${hrefVariant}, to.pathname=${pathnameVariant}`,
          );
          assert.equal(
            resolveDirection(
              { pathname: "/blue-screens/photo-3" },
              { pathname: pathnameVariant },
              { prevHref: hrefVariant },
            ),
            "back",
            `prevHref=${hrefVariant}, to.pathname=${pathnameVariant}`,
          );
        }
      }
    });
  });
});
