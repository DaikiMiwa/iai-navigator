import assert from "node:assert/strict";
import test from "node:test";

await import("../web-extension/scroll-surface.js");

const {
  WINDOW_SURFACE_ID,
  canMoveScrollPosition,
  chooseScrollSurface,
  isScrollableOverflow,
  maxScroll,
} = globalThis.SafariKeyboardNavigationScroll;

test("chooses a probe scroll surface before the window", () => {
  assert.equal(
    chooseScrollSurface(
      [
        {
          id: "internal",
          kind: "probe",
          canScroll: true,
          canMove: true,
          visibleArea: 0,
        },
        {
          id: WINDOW_SURFACE_ID,
          kind: "window",
          canScroll: true,
          canMove: true,
          visibleArea: 1000,
        },
      ],
      { requireCanMove: true },
    ),
    "internal",
  );
});

test("falls back to the window when no probed surface can move", () => {
  assert.equal(
    chooseScrollSurface(
      [
        {
          id: "internal",
          kind: "probe",
          canScroll: true,
          canMove: false,
          visibleArea: 0,
        },
        {
          id: WINDOW_SURFACE_ID,
          kind: "window",
          canScroll: true,
          canMove: true,
          visibleArea: 1000,
        },
      ],
      { requireCanMove: true },
    ),
    WINDOW_SURFACE_ID,
  );
});

test("uses the largest visible scroll surface when probes and window cannot scroll", () => {
  assert.equal(
    chooseScrollSurface(
      [
        {
          id: WINDOW_SURFACE_ID,
          kind: "window",
          canScroll: false,
          canMove: false,
          visibleArea: 1000,
        },
        {
          id: "small",
          kind: "visible",
          canScroll: true,
          canMove: true,
          visibleArea: 100,
        },
        {
          id: "large",
          kind: "visible",
          canScroll: true,
          canMove: true,
          visibleArea: 500,
        },
      ],
      { requireCanMove: true },
    ),
    "large",
  );
});

test("can choose a scrollable surface for jump commands even at an edge", () => {
  assert.equal(
    chooseScrollSurface(
      [
        {
          id: "internal",
          kind: "probe",
          canScroll: true,
          canMove: false,
          visibleArea: 0,
        },
      ],
      { requireCanMove: false },
    ),
    "internal",
  );
});

test("identifies scrollable overflow values", () => {
  assert.equal(isScrollableOverflow("auto"), true);
  assert.equal(isScrollableOverflow("scroll"), true);
  assert.equal(isScrollableOverflow("overlay"), true);
  assert.equal(isScrollableOverflow("hidden"), false);
  assert.equal(isScrollableOverflow("clip"), false);
  assert.equal(isScrollableOverflow("visible"), false);
});

test("computes scroll range and directional movement", () => {
  assert.equal(maxScroll(1000, 600), 400);
  assert.equal(maxScroll(400, 600), 0);
  assert.equal(canMoveScrollPosition(0, 400, 1), true);
  assert.equal(canMoveScrollPosition(400, 400, 1), false);
  assert.equal(canMoveScrollPosition(400, 400, -1), true);
  assert.equal(canMoveScrollPosition(0, 400, -1), false);
  assert.equal(canMoveScrollPosition(200, 400, 0), false);
});
