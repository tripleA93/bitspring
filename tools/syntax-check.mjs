// tools/syntax-check.mjs — verifies the game's module JS parses. Run from repo root: node tools/syntax-check.mjs
// Auto-detects layout: inline <script type="module"> in index.html AND/OR src/main.js (post-refactor).
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const targets = [];
const html = readFileSync('index.html', 'utf8');
const m = html.match(/<script type="module">([\s\S]*?)<\/script>/);
if (m) targets.push(['index.html inline module', m[1]]);
if (existsSync('src/main.js')) targets.push(['src/main.js', readFileSync('src/main.js', 'utf8')]);
if (!targets.length) { console.error('FAIL: no game JS found (no inline module, no src/main.js)'); process.exit(1); }

const dir = mkdtempSync(join(tmpdir(), 'bitspring-'));
let fail = false;
for (const [name, code] of targets) {
  const f = join(dir, 'check.mjs');
  writeFileSync(f, code);
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
    console.log(`PASS: ${name} parses (${code.length} chars)`);
  } catch (e) {
    fail = true;
    console.error(`FAIL: ${name}`);
    console.error(String(e.stderr || e.message).slice(0, 2000));
  }
}
process.exit(fail ? 1 : 0);
