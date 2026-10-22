import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const excluded = new Set(['.git', 'node_modules', 'dist', 'release', 'work', '.superpowers', 'test-results', 'playwright-report', '.DS_Store', '.idea', '.vscode']);
export function copySource(source, destination, { includeDist = false } = {}) {
  mkdirSync(destination, { recursive: true });
  for (const entry of readdirSync(source, { withFileTypes: true })) {
    if ((excluded.has(entry.name) && !(includeDist && entry.name === 'dist')) || entry.name.startsWith('.env') || entry.name.endsWith('.tsbuildinfo') || /\.(log|tar\.gz)$/.test(entry.name)) continue;
    const from = join(source, entry.name); const to = join(destination, entry.name);
    // Never follow symlinks into dependencies, secrets or another checkout.
    if (lstatSync(from).isSymbolicLink()) continue;
    if (entry.isDirectory()) copySource(from, to, { includeDist });
    else if (entry.isFile()) copyFileSync(from, to);
  }
}
export function requireAbsent(path) { if (existsSync(path)) throw new Error(`目标已存在，拒绝覆盖：${path}`); }
export function fail(error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; }
