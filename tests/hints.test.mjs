import assert from "node:assert/strict";
import test from "node:test";

await import("../web-extension/hints.js");

const { DEFAULT_HINT_KEYS, generateHints, hasPrefixCollision } =
  globalThis.SafariKeyboardNavigationHints;

test("uses one-letter hints when all targets fit", () => {
  assert.deepEqual(generateHints(4), ["a", "s", "d", "f"]);
  assert.deepEqual(
    generateHints(DEFAULT_HINT_KEYS.length),
    Array.from(DEFAULT_HINT_KEYS),
  );
});

test("keeps hints prefix-free when multi-letter hints are needed", () => {
  for (const count of [10, 17, 18, 25, 89, 100, 250]) {
    const generated = generateHints(count);
    assert.equal(generated.length, count);
    assert.equal(new Set(generated).size, count);
    assert.equal(hasPrefixCollision(generated), false);
  }
});

test("preserves as many one-letter hints as possible after expanding to multi-letter hints", () => {
  const generated = generateHints(DEFAULT_HINT_KEYS.length + 1);
  const oneLetterHints = generated.filter((hint) => hint.length === 1);

  assert.equal(oneLetterHints.length, DEFAULT_HINT_KEYS.length - 1);
  assert.deepEqual(oneLetterHints, Array.from(DEFAULT_HINT_KEYS.slice(0, -1)));
});

test("rejects invalid inputs", () => {
  assert.throws(() => generateHints(-1), /non-negative/);
  assert.throws(() => generateHints(1.5), /non-negative/);
  assert.throws(() => generateHints(1, "aa"), /unique/);
  assert.throws(() => generateHints(1, "a"), /at least two/);
});
