"use strict";
((global) => {
    const WINDOW_SURFACE_ID = "window";
    function chooseScrollSurface(candidates, options) {
        const probeCandidate = candidates.find((candidate) => candidate.kind === "probe" && isEligible(candidate, options));
        if (probeCandidate) {
            return probeCandidate.id;
        }
        const windowCandidate = candidates.find((candidate) => candidate.kind === "window" && isEligible(candidate, options));
        if (windowCandidate) {
            return windowCandidate.id;
        }
        const visibleCandidate = candidates
            .filter((candidate) => candidate.kind === "visible" && isEligible(candidate, options))
            .sort((a, b) => b.visibleArea - a.visibleArea)[0];
        return visibleCandidate?.id ?? WINDOW_SURFACE_ID;
    }
    function isEligible(candidate, options) {
        return (candidate.canScroll && (!options.requireCanMove || candidate.canMove));
    }
    function isScrollableOverflow(overflow) {
        return (overflow !== "hidden" && overflow !== "clip" && overflow !== "visible");
    }
    function maxScroll(scrollSize, clientSize) {
        return Math.max(0, scrollSize - clientSize);
    }
    function canMoveScrollPosition(scrollPosition, maxScroll, direction) {
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
})(globalThis);
