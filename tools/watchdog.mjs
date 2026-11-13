#!/usr/bin/env node
// Pizza Way disk watchdog. Zero dependencies.
// Watches heavy folders (node_modules, .next, caches) and warns / cleans when too big.
//
//   node tools/watchdog.mjs            -> one report
//   node tools/watchdog.mjs --watch    -> check every 60s, auto-clean regenerable folders
//   node tools/watchdog.mjs --clean    -> clean regenerable folders now (.next, caches)
//
// Never deletes node_modules automatically (reinstall is slow). It only warns.

import { readdirSync, statSync, rmSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MB = 1024 * 1024;

// Limits in MB. Edit freely.
const LIMITS = {
  nodeModules: 600, // warn only
  next: 300, // auto-clean when exceeded
  total: 1200, // warn on whole project
  minFreeGB: 20, // warn when drive C free space is below this
};

const CLEANABLE = [".next", join("node_modules", ".cache"), ".turbo", "tsconfig.tsbuildinfo"];

function sizeOf(path) {
  let total = 0;
  let st;
  try {
    st = statSync(path);
  } catch {
    return 0;
  }
  if (!st.isDirectory()) return st.size;
  for (const name of readdirSync(path)) total += sizeOf(join(path, name));
  return total;
}

// Find heavy folders (does not descend into them).
function findHeavy(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = join(dir, e.name);
    if (e.name === "node_modules" || e.name === ".next") out.push(p);
    else if (e.name !== ".git") findHeavy(p, out);
  }
  return out;
}

function freeGB() {
  try {
    const out = execSync(
      'powershell -NoProfile -Command "(Get-PSDrive C).Free"',
      { encoding: "utf8" },
    );
    return Number(out.trim()) / (1024 * MB);
  } catch {
    return null;
  }
}

function clean() {
  for (const dir of findHeavy(ROOT).map((p) => resolve(p, ".."))) {
    for (const rel of CLEANABLE) {
      const target = join(dir, rel);
      if (existsSync(target)) {
        const mb = (sizeOf(target) / MB).toFixed(0);
        rmSync(target, { recursive: true, force: true });
        console.log(`  cleaned ${target} (${mb} MB)`);
      }
    }
  }
}

function report({ autoClean }) {
  const rows = findHeavy(ROOT).map((p) => ({ path: p, mb: sizeOf(p) / MB }));
  const total = rows.reduce((n, r) => n + r.mb, 0);
  console.log(`\n[${new Date().toLocaleTimeString()}] Pizza Way disk report`);
  for (const r of rows) {
    const rel = r.path.replace(ROOT, "").replace(/^[\\/]/, "");
    const isNext = r.path.endsWith(".next");
    const limit = isNext ? LIMITS.next : LIMITS.nodeModules;
    const flag = r.mb > limit ? "  !! OVER LIMIT" : "";
    console.log(`  ${rel.padEnd(34)} ${r.mb.toFixed(0).padStart(6)} MB (limit ${limit})${flag}`);
    if (r.mb > limit && isNext && autoClean) {
      rmSync(r.path, { recursive: true, force: true });
      console.log(`  -> auto-cleaned ${rel}`);
    }
  }
  console.log(`  total heavy folders: ${total.toFixed(0)} MB (limit ${LIMITS.total})`);
  if (total > LIMITS.total) console.log("  !! Project is over its total disk limit");
  const free = freeGB();
  if (free !== null) {
    console.log(`  drive C free: ${free.toFixed(1)} GB`);
    if (free < LIMITS.minFreeGB) console.log(`  !! Drive C below ${LIMITS.minFreeGB} GB free`);
  }
}

const args = process.argv.slice(2);
if (args.includes("--clean")) {
  clean();
} else if (args.includes("--watch")) {
  report({ autoClean: true });
  setInterval(() => report({ autoClean: true }), 60_000);
} else {
  report({ autoClean: false });
}
