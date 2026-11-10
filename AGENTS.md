# Model Arena: instructions for the AI model being tested

This repository is a benchmark. If the user told you to *"use this repo"*, *"run the arena"* or *"do the tests"*, **you are the model under test**. Follow this protocol exactly. It is the same for every model, which is what makes the comparison fair.

## Protocol

1. **Pick your slug.** Use your exact model name, lowercase, hyphenated (e.g. `claude-opus-5-5`, `gpt-5`, `gemini-3-pro`). Do not guess a name you are unsure of: ask the user once.
2. **Choose the scope.** Default is *all tests* in `tests/tests.json`. The user may limit it to a category (`motion`, `physics`, `3d`, `ui`, `svg`, `systems`, `games`, `generative`) or to specific test ids. Run `node scripts/status.mjs <slug> [category-or-id ...]` to see what is left; this also lets you resume after an interruption.
3. **For every test, in order:**
   1. Read `tests/prompts/<test-id>.md` (the task) and `tests/_preamble.md` (shared rules that apply to every test).
   2. Write ONE complete, self-contained HTML file to `submissions/<slug>/<test-id>.html`.
   3. Move on. Do not rewrite it.
4. **Fairness rules (important):**
   - **One attempt per test.** Do not run, screenshot, debug or iterate on your output. The point is what you produce in a single try. (Re-write a file only if it was not saved completely.)
   - **Never open other models' folders** under `submissions/`. No copying, no peeking.
   - Do not edit `tests/`, the prompts, the viewer or the scripts. Do not search the web for solutions.
   - Take your time and give each test your best effort. Quality is the whole point, not speed.
5. **Describe yourself.** Create `submissions/<slug>/meta.json`:
   ```json
   { "name": "Exact Model Name", "vendor": "Company", "date": "YYYY-MM-DD", "settings": "e.g. extended thinking / effort high / default", "notes": "" }
   ```
6. **Finish.** Run `node scripts/validate.mjs` and `node scripts/build-manifest.mjs`, fix any complaint about your own files, then commit only `submissions/<slug>/` (and `submissions/manifest.json`) and push if the user allowed it.
7. **Report** how many tests you completed and which, if any, you skipped and why. Do **not** grade yourself or compare yourself with other models. The human judges.

## Repository map

| Path | What it is |
|---|---|
| `tests/tests.json` | Index of all tests (category, difficulty, judging criteria) |
| `tests/prompts/<id>.md` | The task for each test |
| `tests/_preamble.md` | Rules shared by all tests |
| `submissions/<slug>/` | One folder per tested model: `meta.json` + `<test-id>.html` |
| `index.html`, `assets/` | The viewer: side-by-side comparison, blind mode, ratings, leaderboard |
| `scripts/` | `status`, `add`, `validate`, `build-manifest`, `serve` (zero dependencies, Node 18+) |

## For the human (quick reference)

- Look at the results: `node scripts/serve.mjs`, then open http://localhost:8080
- Add output from a chat UI manually: `node scripts/add.mjs "Model Name" <test-id> output.html`
- The viewer is also published with GitHub Pages (Settings → Pages → Source: GitHub Actions).

---

**بالعربي (للإنسان):** بس قل لأي نموذج: *«استخدم هذا المستودع وسوّي الاختبارات اللي بيه»*، وهو راح يقرأ هذا الملف وينفّذ كل شي ويحفظ مخرجاته بمجلد `submissions/<اسم-النموذج>/`. بعدها شغّل `node scripts/serve.mjs` وقارن بين النماذج بعينك.
