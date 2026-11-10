#!/usr/bin/env node
import { buildManifest } from './lib.mjs';
const m = buildManifest();
const n = m.models.reduce((a, x) => a + x.tests.length, 0);
console.log(`manifest: ${m.models.length} model(s), ${n} submission(s)`);
