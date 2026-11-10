#!/usr/bin/env node
// Usage: node scripts/add.mjs "<Model name>" <test-id> <file|-> [--vendor X] [--settings "..."] [--notes "..."]
// Saves a model's output for a test, stripping markdown fences, and refreshes the manifest.
import fs from 'node:fs';
import path from 'node:path';
import { SUB, slugify, readTests, readMeta, cleanHtml, buildManifest } from './lib.mjs';

const args = process.argv.slice(2);
const flags = {};
const pos = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) flags[args[i].slice(2)] = args[++i];
  else pos.push(args[i]);
}
const [model, testId, file] = pos;
if (!model || !testId || !file) {
  console.error('Usage: node scripts/add.mjs "<Model name>" <test-id> <file|-> [--vendor X] [--settings "..."] [--notes "..."]');
  process.exit(1);
}
if (!readTests().tests.some((t) => t.id === testId)) {
  console.error(`Unknown test id "${testId}". See tests/tests.json`);
  process.exit(1);
}
const raw = file === '-' ? fs.readFileSync(0, 'utf8') : fs.readFileSync(file, 'utf8');
const html = cleanHtml(raw);
if (!/<html|<!doctype|<body|<script|<svg/i.test(html)) {
  console.error('This does not look like HTML. Aborting.');
  process.exit(1);
}
const slug = slugify(model);
const dir = path.join(SUB, slug);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${testId}.html`), html);

const meta = { name: model, ...readMeta(slug) };
if (flags.vendor) meta.vendor = flags.vendor;
if (flags.settings) meta.settings = flags.settings;
if (flags.notes) meta.notes = flags.notes;
meta.date = meta.date || new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');

buildManifest();
console.log(`saved submissions/${slug}/${testId}.html (${(html.length / 1024).toFixed(1)} KB)`);
