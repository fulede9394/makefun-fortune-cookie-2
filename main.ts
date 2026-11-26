// Fortune Cookie Funnies for Engineers — make.fun entry.
// A fortune-cookie lucky-numbers line written for a software engineer.
// The program composes the fortune, validates it against the gate
// (1-120 UTF-8 characters, one line, not only whitespace), writes it to
// $MAKEFUN_OUTPUT_DIR/entry.txt (default /output/entry.txt), then reads it
// back and proves the bytes on disk match what was composed.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";

// Frozen delivery rules for this bounty.
const FORTUNE_CONFIG = Object.freeze({
  minChars: 1,
  maxChars: 120,
  fileName: "entry.txt",
  defaultOutDir: "/output",
});

// The fortune itself, built from its three lucky numbers and the bug line.
const LUCKY_NUMBERS = Object.freeze(["404", "500"]);
const CLOSING_BUG = "the bug you closed as 'cannot reproduce'";

function composeFortune(): string {
  // Fortune-cookie form: "Your lucky numbers are ..." with the punchline
  // (the unreproducible bug) sitting at the very end.
  return `Your lucky numbers are ${LUCKY_NUMBERS.join(", ")}, and ${CLOSING_BUG}.`;
}

// Gate check: length 1-120 chars, a single line, not only whitespace.
function validate(fortune: string): void {
  const chars = [...fortune].length;
  if (chars < FORTUNE_CONFIG.minChars || chars > FORTUNE_CONFIG.maxChars) {
    throw new Error(`fortune is ${chars} chars, outside the 1-120 gate`);
  }
  if (fortune.trim().length === 0) {
    throw new Error("fortune is only whitespace");
  }
  if (fortune.includes("\n") || fortune.includes("\r")) {
    throw new Error("fortune must be a single line");
  }
  // Guard: reject invisible control characters that would look fine but
  // break the fortune's clean single-line read.
  if (/[\u0000-\u001f\u007f]/.test(fortune)) {
    throw new Error("fortune contains control characters");
  }
}

function resolveOutDir(): string {
  return process.env.MAKEFUN_OUTPUT_DIR ?? FORTUNE_CONFIG.defaultOutDir;
}

function checksum(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

// Writes the fortune and proves the file on disk is byte-identical.
async function deliver(fortune: string): Promise<void> {
  const outDir = resolveOutDir();
  await mkdir(outDir, { recursive: true });
  const target = join(outDir, FORTUNE_CONFIG.fileName);
  await writeFile(target, fortune, "utf8");
  const roundTrip = await readFile(target, "utf8");
  if (roundTrip !== fortune) {
    throw new Error("round-trip check failed: file differs from fortune");
  }
  console.log(`fortune (${[...fortune].length} chars, sha256 ${checksum(fortune)}):`);
  console.log(fortune);
}

const fortune = composeFortune();
validate(fortune);
await deliver(fortune);
