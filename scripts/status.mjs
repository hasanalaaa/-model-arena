#!/usr/bin/env node
// Usage: node scripts/status.mjs <model-slug> [category-or-test-id ...]
// Shows which tests this model has already done and which are still missing (safe to resume after an interruption).
import fs from 'node:fs';
import path from 'node:path';
import { SUB, readTests } from './lib.mjs';

const [slug, ...filters] = process.argv.slice(2);
if (!slug) { console.error('Usage: node scripts/status.mjs <model-slug> [category-or-test-id ...]'); process.exit(1); }
const data = readTests();
let tests = data.tests;
if (filters.length && !filters.includes('all')) tests = tests.filter((t) => filters.includes(t.id) || filters.includes(t.category));
const dir = path.join(SUB, slug);
const done = tests.filter((t) => fs.existsSync(path.join(dir, t.id + '.html')));
const todo = tests.filter((t) => !done.includes(t));
console.log(`model: ${slug}   done: ${done.length}/${tests.length}`);
if (todo.length) {
  console.log('\nremaining (in order):');
  for (const t of todo) console.log(`  ${t.id.padEnd(26)} [${t.category}, difficulty ${t.difficulty}]  tests/prompts/${t.id}.md`);
} else console.log('\nall requested tests are done.');
if (!fs.existsSync(path.join(dir, 'meta.json'))) console.log(`\nnote: submissions/${slug}/meta.json is missing (see AGENTS.md step 5).`);
