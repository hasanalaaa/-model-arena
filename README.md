# Model Arena · ساحة النماذج

**بالعربي:** مستودع لاختبار نماذج الذكاء الاصطناعي بـ **اختبارات تنشاف بالعين**: حركة، فيزياء، مجسمات 3D، تصاميم، SVG، أنظمة كاملة، ألعاب، وشيدرات. ما فيه نتائج جاهزة ولا نموذج مفضّل. المستودع فقط **الاختبارات + أدوات المقارنة**، وانت تحكم بنفسك أي نموذج أفضل.

**English:** A benchmark repository for AI models using **tests you judge with your own eyes**: motion, physics, 3D, UI design, SVG, full systems, games and shaders. No built-in results and no favourite model: just the **tests + a comparison viewer**. You decide which model is better.

## كيف تختبر نموذج / How to test a model

### 1) نموذج ينفّذ الاختبارات بنفسه (الطريقة الأسهل)
افتح النموذج داخل هذا المستودع (أداة فيها وصول للملفات: Claude Code, Codex, Cursor, Gemini CLI…) وقل له:

> استخدم هذا المستودع وسوّي الاختبارات اللي بيه.

يقرأ [`AGENTS.md`](AGENTS.md) (أو `CLAUDE.md`) وينفّذ كل شي: يحل كل اختبار بمحاولة وحدة ويحفظ الناتج في `submissions/<اسم-النموذج>/`. تگدر تحدد جزء: «سوّي اختبارات فئة 3d فقط» أو «سوّي p-cloth وp-fluid».

*Open the model inside this repo with a tool that can read and write files and tell it: "use this repo and do the tests". It follows [`AGENTS.md`](AGENTS.md), solves every test in a single attempt and saves the output to `submissions/<model>/`. You can limit the scope to a category or to specific test ids.*

### 2) نماذج الدردشة (ChatGPT, Gemini, Claude.ai…)
1. افتح العارض (تحت)، اختر اختبار، اضغط **نسخ البرومبت** والصقه بالنموذج. المحاولة الأولى فقط.
2. الصق ناتج النموذج بصفحة **معاينة سريعة** لتشوفه فوراً، أو احفظه:
   ```bash
   node scripts/add.mjs "اسم النموذج" m-hexagon-balls output.html --vendor "الشركة"
   ```
   (السكربت ينظّف أسوار الماركداون ويحدّث الفهرس.)

## شوف النتائج / See the results

```bash
node scripts/serve.mjs      # ثم افتح http://localhost:8080
```

- **مقارنة** حتى 4 نماذج جنب بعض بنفس الاختبار، كل واحد داخل `iframe` معزول (sandbox).
- **وضع أعمى:** الأسماء مخفية (A/B/C)، تختار الأفضل بعينك، وبعدين تنكشف الأسماء.
- **تقييم** بالنجوم لكل معيار + ملاحظات، محفوظ في متصفحك مع تصدير/استيراد JSON.
- **لوحة ترتيب** من تقييماتك ومواجهاتك العمياء، حسب الفئة والإجمالي.
- عربي/إنجليزي، فاتح/داكن، يشتغل على الموبايل.

العارض منشور أيضاً على GitHub Pages: *Settings → Pages → Source: GitHub Actions* (مرة وحدة).

## الاختبارات / The tests

38 اختبار بـ 8 فئات وثلاث مستويات صعوبة (🟢 أساسي · 🟡 صعب · 🔴 قاسي). كل اختبار مصمم حتى يكشف فرق حقيقي بين النماذج: فيزياء لازم تكون صحيحة، 3D لازم ينبني من الصفر، أو نظام كامل بحالات كثيرة.

| الفئة | Category | أمثلة / Examples |
|---|---|---|
| 🌀 حركة | Motion | كرات بسداسي يدور، ساعة مسننات، مخلوق IK |
| ⚛️ فيزياء | Physics | قماش يتمزق، سوائل، بندول مزدوج، رمل متساقط |
| 🧊 ثلاثي الأبعاد | 3D | مكعب روبيك يحل نفسه، raymarching، تضاريس، سيارة |
| 🖥️ واجهات | UI | لوحة تحليلات، صفحة عربية RTL، مشغل موسيقى |
| 🎨 SVG | SVG | بجعة تركب دراجة، مدينة أيزومترية، ساعة فاخرة |
| ⚙️ أنظمة | Systems | نظام تشغيل مصغّر، محرر عُقد، جدول بيانات بمعادلات |
| 🎮 ألعاب | Games | سباق، دفاع أبراج، منصات، شطرنج بخصم |
| ✨ توليدي | Generative | فراكتال بتقريب عميق، شيدر محيط، reaction-diffusion |

كل برومبت بالإنجليزي (حتى يكون عادل لكل النماذج)، وتحته قواعد مشتركة في [`tests/_preamble.md`](tests/_preamble.md). فهرس الاختبارات ومعايير الحكم: [`tests/tests.json`](tests/tests.json).

## بروتوكول العدالة / Fairness protocol

نفس البرومبت حرفياً · **محاولة واحدة** بدون تصحيح أو تكرار · الإعدادات الافتراضية للنموذج (سجّل وضع التفكير بـ `meta.json`) · ما يشوف مخرجات نماذج ثانية · الحكم دائماً بعين الإنسان.

*Identical prompt, one attempt with no fixes, default settings (record thinking mode in `meta.json`), no peeking at other models' outputs, human judgment only.*

## إضافة اختبار جديد / Adding a test

1. اكتب `tests/prompts/<id>.md` (المعرّف يبدأ بحرف الفئة: `m-`, `p-`, `d-`, `u-`, `svg-`, `sys-`, `g-`, `gen-`).
2. أضف الاختبار إلى `tests/tests.json`: العنوان بالعربي والإنجليزي، الصعوبة، 3-4 معايير حكم، وأشهر نقطة فشل.
3. `node scripts/validate.mjs`

## الأدوات / Scripts (Node 18+، بدون أي اعتماديات)

| Command | What it does |
|---|---|
| `node scripts/serve.mjs [port]` | Local viewer server |
| `node scripts/status.mjs <slug> [category/id…]` | What a model has done / still has to do |
| `node scripts/add.mjs "Model" <test-id> <file\|->` | Save an output (cleans markdown fences) |
| `node scripts/validate.mjs` | Consistency checks |
| `node scripts/build-manifest.mjs` | Rebuild `submissions/manifest.json` |

> ملاحظة: افتح العارض عبر `serve.mjs` وليس بالنقر المزدوج على `index.html`؛ المتصفح يمنع قراءة الملفات من `file://`.
