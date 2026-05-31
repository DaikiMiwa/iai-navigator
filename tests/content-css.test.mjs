import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const contentCss = await readFile(
  new URL("../web-extension/content.css", import.meta.url),
  "utf8",
);

test("uses the configurable media hint font size for media controls", () => {
  assert.match(
    contentCss,
    /\.skne-hint-media-control\s*\{[^}]*font-size:\s*var\(--skne-hint-media-font-size,\s*15px\)/s,
  );
});
