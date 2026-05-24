((
  global: typeof globalThis & {
    SafariKeyboardNavigationScroll?: SafariKeyboardNavigationScroll;
  },
) => {
  const WINDOW_SURFACE_ID = "window";

  function chooseScrollSurface(
    candidates: ScrollSurfaceCandidate[],
    options: { requireCanMove: boolean },
  ): string {
    const probeCandidate = candidates.find(
      (candidate) =>
        candidate.kind === "probe" && isEligible(candidate, options),
    );
    if (probeCandidate) {
      return probeCandidate.id;
    }

    const windowCandidate = candidates.find(
      (candidate) =>
        candidate.kind === "window" && isEligible(candidate, options),
    );
    if (windowCandidate) {
      return windowCandidate.id;
    }

    const visibleCandidate = candidates
      .filter(
        (candidate) =>
          candidate.kind === "visible" && isEligible(candidate, options),
      )
      .sort((a, b) => b.visibleArea - a.visibleArea)[0];

    return visibleCandidate?.id ?? WINDOW_SURFACE_ID;
  }

  function isEligible(
    candidate: ScrollSurfaceCandidate,
    options: { requireCanMove: boolean },
  ): boolean {
    return (
      candidate.canScroll && (!options.requireCanMove || candidate.canMove)
    );
  }

  function isScrollableOverflow(overflow: string): boolean {
    return (
      overflow !== "hidden" && overflow !== "clip" && overflow !== "visible"
    );
  }

  function maxScroll(scrollSize: number, clientSize: number): number {
    return Math.max(0, scrollSize - clientSize);
  }

  function canMoveScrollPosition(
    scrollPosition: number,
    maxScroll: number,
    direction: number,
  ): boolean {
    if (direction > 0) {
      return scrollPosition < maxScroll - 1;
    }

    if (direction < 0) {
      return scrollPosition > 1;
    }

    return false;
  }

  global.SafariKeyboardNavigationScroll = {
    WINDOW_SURFACE_ID,
    canMoveScrollPosition,
    chooseScrollSurface,
    isScrollableOverflow,
    maxScroll,
  };
})(
  globalThis as typeof globalThis & {
    SafariKeyboardNavigationScroll?: SafariKeyboardNavigationScroll;
  },
);
