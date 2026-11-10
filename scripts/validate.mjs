#!/usr/bin/env node
// Consistency checks for tests and submissions. Exits non-zero on problems.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, SUB, readTests } from './lib.mjs';

const errors = [];
const data = readTests();
const catIds = new Set(data.categories.map((c) => c.id));
const ids = new Set();
for (const t of data.tests) {
  if (ids.has(t.id)) errors.push(`duplicate test id ${t.id}`);
  ids.add(t.id);
  if (!catIds.has(t.category)) errors.push(`${t.id}: unknown category ${t.category}`);
  if (![1, 2, 3].includes(t.difficulty)) errors.push(`${t.id}: bad difficulty`);
  for (const k of ['en', 'ar']) {
    if (!t.title?.[k]) errors.push(`${t.id}: missing title.${k}`);
    if (!t.pitfalls?.[k]) errors.push(`${t.id}: missing pitfalls.${k}`);
  }
  if (!t.criteria?.length) errors.push(`${t.id}: no criteria`);
  for (const c of t.criteria || []) if (!c.en || !c.ar) errors.push(`${t.id}: criterion missing a language`);
  if (!fs.existsSync(path.join(ROOT, 'tests/prompts', `${t.id}.md`))) errors.push(`${t.id}: missing prompt file`);
}
for (const f of fs.readdirSync(path.join(ROOT, 'tests/prompts'))) {
  if (!ids.has(f.replace(/\.md$/, ''))) errors.push(`orphan prompt file ${f}`);
}
let subs = 0;
if (fs.existsSync(SUB)) {
  for (const slug of fs.readdirSync(SUB)) {
    const dir = path.join(SUB, slug);
    if (!fs.statSync(dir).isDirectory() || slug === 'thumbs') continue;
    for (const f of fs.readdirSync(dir)) {
      if (f === 'meta.json') continue;
      if (!f.endsWith('.html')) { errors.push(`${slug}/${f}: unexpected file`); continue; }
      subs++;
      if (!ids.has(f.slice(0, -5))) errors.push(`${slug}/${f}: no such test id`);
      const html = fs.readFileSync(path.join(dir, f), 'utf8');
      if (!/<html|<!doctype/i.test(html)) errors.push(`${slug}/${f}: not an HTML document`);
      if (/```/.test(html)) errors.push(`${slug}/${f}: contains markdown fence`);
    }
    if (!fs.existsSync(path.join(dir, 'meta.json'))) errors.push(`${slug}: missing meta.json`);
  }
}
if (errors.length) {
  console.error(errors.map((e) => ' ✗ ' + e).join('\n'));
  process.exit(1);
}
console.log(`ok: ${data.tests.length} tests, ${subs} submission(s)`);
