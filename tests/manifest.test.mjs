import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const manifest = JSON.parse(
  await readFile(new URL("../web-extension/manifest.json", import.meta.url)),
);

test("loads content scripts early in every frame", () => {
  assert.equal(manifest.content_scripts.length, 1);

  const [contentScript] = manifest.content_scripts;

  assert.equal(contentScript.run_at, "document_start");
  assert.equal(contentScript.all_frames, true);
});

test("registers browser-level tab switching fallback commands", () => {
  assert.deepEqual(manifest.commands["switch-tab-previous"], {
    suggested_key: {
      default: "Alt+Shift+J",
      mac: "Alt+Shift+J",
    },
    description: "Switch to the tab on the left",
  });
  assert.deepEqual(manifest.commands["switch-tab-next"], {
    suggested_key: {
      default: "Alt+Shift+K",
      mac: "Alt+Shift+K",
    },
    description: "Switch to the tab on the right",
  });
});
