"use strict";
((global) => {
    const DEFAULT_HINT_KEYS = "asdfghjkl";
    function generateHints(count, keys = DEFAULT_HINT_KEYS) {
        if (!Number.isInteger(count) || count < 0) {
            throw new TypeError("count must be a non-negative integer");
        }
        const alphabet = Array.from(keys);
        if (new Set(alphabet).size !== alphabet.length || alphabet.length < 2) {
            throw new TypeError("keys must contain at least two unique characters");
        }
        if (count === 0) {
            return [];
        }
        const leaves = alphabet.slice();
        while (leaves.length < count) {
            const index = findLeafToExpand(leaves, alphabet.length);
            const prefix = leaves[index];
            const children = alphabet.map((key) => prefix + key);
            leaves.splice(index, 1, ...children);
        }
        return leaves.slice(0, count);
    }
    function findLeafToExpand(leaves, alphabetLength) {
        if (leaves.length === alphabetLength) {
            return leaves.length - 1;
        }
        let selectedIndex = -1;
        let selectedLength = Infinity;
        for (let index = leaves.length - 1; index >= 0; index -= 1) {
            const leaf = leaves[index];
            if (leaf.length > 1 && leaf.length < selectedLength) {
                selectedIndex = index;
                selectedLength = leaf.length;
            }
        }
        return selectedIndex === -1 ? leaves.length - 1 : selectedIndex;
    }
    function hasPrefixCollision(hints) {
        const sortedHints = hints.slice().sort();
        for (let index = 0; index < sortedHints.length - 1; index += 1) {
            if (sortedHints[index + 1].startsWith(sortedHints[index])) {
                return true;
            }
        }
        return false;
    }
    global.SafariKeyboardNavigationHints = {
        DEFAULT_HINT_KEYS,
        generateHints,
        hasPrefixCollision,
    };
})(globalThis);
