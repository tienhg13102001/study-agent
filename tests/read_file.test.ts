import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

test("readFile rejects a symlink from src to a file outside src", async () => {
  const originalCwd = process.cwd();
  const moduleUrl = pathToFileURL(path.join(originalCwd, "src/read_file.ts")).href;
  const fixtureDir = await fs.mkdtemp(path.join(os.tmpdir(), "read-file-test-"));

  try {
    await fs.mkdir(path.join(fixtureDir, "src"));
    await fs.writeFile(path.join(fixtureDir, "outside.txt"), "outside marker");
    await fs.symlink(
      path.join(fixtureDir, "outside.txt"),
      path.join(fixtureDir, "src", "shortcut.txt"),
    );

    process.chdir(fixtureDir);
    const { readFile } = await import(moduleUrl);
    const result = await readFile("shortcut.txt");

    assert.equal(result.ok, false);
  } finally {
    process.chdir(originalCwd);
    await fs.rm(fixtureDir, { recursive: true, force: true });
  }
});
