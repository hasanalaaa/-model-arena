// Shared helpers for the Model Arena scripts. No dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SUB = path.join(ROOT, 'submissions');
export const TESTS_JSON = path.join(ROOT, 'tests', 'tests.json');

export const slugify = (s) =>
  String(s).toLowerCase().trim().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');

export function readTests() {
  return JSON.parse(fs.readFileSync(TESTS_JSON, 'utf8'));
}

export function readMeta(slug) {
  try {
    return JSON.parse(fs.readFileSync(path.join(SUB, slug, 'meta.json'), 'utf8'));
  } catch {
    return {};
  }
}

/** Scan submissions/ and write submissions/manifest.json */
export function buildManifest() {
  const known = new Set(readTests().tests.map((t) => t.id));
  const models = [];
  if (fs.existsSync(SUB)) {
    for (const slug of fs.readdirSync(SUB).sort()) {
      const dir = path.join(SUB, slug);
      if (!fs.statSync(dir).isDirectory() || slug === 'thumbs') continue;
      const tests = fs.readdirSync(dir)
        .filter((f) => f.endsWith('.html'))
        .map((f) => f.slice(0, -5))
        .filter((id) => known.has(id))
        .sort();
      if (!tests.length) continue;
      const meta = readMeta(slug);
      models.push({
        slug,
        name: meta.name || slug,
        vendor: meta.vendor || '',
        date: meta.date || '',
        settings: meta.settings || '',
        notes: meta.notes || '',
        tests,
      });
    }
  }
  const manifest = { models };
  fs.mkdirSync(SUB, { recursive: true });
  fs.writeFileSync(path.join(SUB, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

/** Remove markdown fences / chatter around an HTML document. */
export function cleanHtml(raw) {
  let s = String(raw).replace(/^﻿/, '');
  const fence = s.match(/```(?:html|HTML)?\s*\n([\s\S]*?)\n```/);
  if (fence) s = fence[1];
  const start = s.search(/<!doctype html|<html[\s>]/i);
  if (start > 0) s = s.slice(start);
  const end = s.toLowerCase().lastIndexOf('</html>');
  if (end !== -1) s = s.slice(0, end + 7);
  return s.trim() + '\n';
}
