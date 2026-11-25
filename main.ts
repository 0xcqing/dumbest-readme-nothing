import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINE = "My agent spent nine minutes rewriting the README to say 'no changes needed', then committed it as the only change.";

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const outputPath = join(outputDir, "entry.txt");

interface IncidentFacts {
  tool: string;
  minutes: number;
  characters: number;
  bytes: number;
}

const WORD_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  ninety: 90,
};

const KNOWN_TOOLS = [
  "claude code",
  "github copilot",
  "openai codex",
  "cursor",
  "copilot",
  "chatgpt",
  "codex",
  "git",
  "github",
  "npm",
  "pnpm",
  "yarn",
  "bash",
  "zsh",
  "powershell",
  "python",
  "node",
  "sed",
  "awk",
  "perl",
];

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function incidentFacts(text: string): IncidentFacts {
  const minutesPattern =
    /\b(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|ninety)\b[-\s]*(?:minutes?|mins?)\b/i;
  const minutesMatch = text.match(minutesPattern);
  let minutes = 0;
  if (minutesMatch) {
    const token = minutesMatch[1].toLowerCase();
    minutes = /^\d+$/.test(token) ? Number(token) : (WORD_NUMBERS[token] ?? 0);
  }

  let tool = "";
  for (const candidate of KNOWN_TOOLS) {
    const pattern = new RegExp(`\\b${candidate.replace(/ /g, "\\s+")}\\b`, "i");
    if (pattern.test(text)) {
      tool = candidate;
      break;
    }
  }
  if (tool === "" && /\bcommit(?:ted|s|ting)?\b/i.test(text)) {
    tool = "git";
  }
  if (tool === "") {
    tool = "agent";
  }

  return {
    tool,
    minutes,
    characters: Array.from(text).length,
    bytes: Buffer.byteLength(text, "utf8"),
  };
}

const facts = incidentFacts(LINE);

if (LINE.trim().length === 0) {
  fail("entry validation failed: text is empty after trimming");
}
if (/[\r\n]/.test(LINE)) {
  fail("entry validation failed: text must not contain newline characters");
}
if (!LINE.includes("README")) {
  fail("entry validation failed: text must mention README");
}
if (!LINE.includes(",")) {
  fail("entry validation failed: text must contain a comma");
}
if (facts.characters < 1 || facts.characters > 200) {
  fail(`entry validation failed: ${facts.characters} characters is outside the 1..200 range`);
}
if (facts.bytes < 1 || facts.bytes > 200) {
  fail(`entry validation failed: ${facts.bytes} bytes is outside the 1..200 range`);
}
if (!(facts.minutes > 0)) {
  fail("entry validation failed: text must state how many minutes the incident took");
}
if (facts.tool.length === 0) {
  fail("entry validation failed: text must name the tool involved");
}

const payload = `${LINE}\n`;
const expected = Buffer.from(payload, "utf8");

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, expected);

const written = readFileSync(outputPath);
if (!written.equals(expected)) {
  fail("entry validation failed: the bytes read back do not match the bytes written");
}

process.stdout.write(`path: ${outputPath}\n`);
process.stdout.write(`text: ${LINE}\n`);
process.stdout.write(`tool: ${facts.tool}\n`);
process.stdout.write(`minutes: ${facts.minutes}\n`);
process.stdout.write(`characters: ${facts.characters}\n`);
process.stdout.write(`bytes: ${facts.bytes}\n`);
