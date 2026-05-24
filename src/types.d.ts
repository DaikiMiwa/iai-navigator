interface SafariKeyboardNavigationHints {
  DEFAULT_HINT_KEYS: string;
  generateHints(count: number, keys?: string): string[];
  hasPrefixCollision(hints: string[]): boolean;
}

interface ScrollSurfaceCandidate {
  id: string;
  kind: "probe" | "window" | "visible";
  canScroll: boolean;
  canMove: boolean;
  visibleArea: number;
}

interface SafariKeyboardNavigationScroll {
  WINDOW_SURFACE_ID: string;
  canMoveScrollPosition(
    scrollPosition: number,
    maxScroll: number,
    direction: number,
  ): boolean;
  chooseScrollSurface(
    candidates: ScrollSurfaceCandidate[],
    options: { requireCanMove: boolean },
  ): string;
  isScrollableOverflow(overflow: string): boolean;
  maxScroll(scrollSize: number, clientSize: number): number;
}
