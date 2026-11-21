#!/usr/bin/env node
// Build the leaderboard clip for one question.
//   node leaderboard/make.js <question> [--alpha] [--preview <background.jpg>] [--data <file.json>]
//   node leaderboard/make.js chain 16,18,21,23   one continuous clip through several questions
//                                               -> Leaderboard_Q<first-1>-Q<last>_greenscreen.mp4
//   node leaderboard/make.js chain 16,18,21,23 --separate   same, but one clip per question
//                                               -> Leaderboard_Q<n>_streak_greenscreen.mp4
// Output (in leaderboard/videos/):
//   Leaderboard_Q<n>_greenscreen.mp4   (default, H.264 on #00FF00 for LumaFusion Chroma Key)
//   Leaderboard_Q<n>_alpha.mov         (--alpha, ProRes 4444 with transparency)
//   Leaderboard_Q<n>_preview.mp4       (--preview, composited over a photo, for checking)
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const args = process.argv.slice(2);
const CHAIN = args[0] === 'chain' ? args[1].split(',').map(Number) : null;
const Q = CHAIN ? CHAIN[CHAIN.length - 1] : parseInt(args[0], 10);
if (!Q) { console.error('usage: make.js <question> [--alpha] [--preview bg.jpg] [--data file.json]'); process.exit(1); }
const SEPARATE = process.argv.includes('--separate');
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? (args[i + 1] ?? true) : null; };
const HERE = __dirname;
const cfg = JSON.parse(fs.readFileSync(opt('--data') || path.join(HERE, 'standings.json'), 'utf8'));
const FPS = 30;
const PALETTE = ['#8e6fd8', '#e0803a', '#2bb5a8', '#c45bb0', '#7a8a99', '#b5823c', '#5a7fd6', '#d6604d'];

// ---------- standings math ----------
const pts = (place) => cfg.points_by_place[place - 1] ?? 0;

function standingsAfter(n, prevOrder) {
  const totals = {};
  for (let q = 1; q <= n; q++) {
    const res = cfg.questions[q];
    if (!res) throw new Error(`No results recorded for question ${q} in standings.json`);
    for (const { team } of res) totals[team] ??= 0;
    for (const { team, place } of res) totals[team] += pts(place);
  }
  // keep teams seen in earlier questions even if absent from this one
  const prevIdx = (name) => { const i = (prevOrder || []).indexOf(name); return i < 0 ? 1e9 : i; };
  const order = Object.keys(totals).sort((a, b) =>
    totals[b] - totals[a] || prevIdx(a) - prevIdx(b) || a.localeCompare(b));
  const rank = {};
  order.forEach((name, i) => {
    rank[name] = (i > 0 && totals[name] === totals[order[i - 1]]) ? rank[order[i - 1]] : i + 1;
  });
  return { totals, order, rank };
}

function buildData(Q) {
  const green = !opt('--alpha') || opt('--green');
  let prev = null, cur = null;
  for (let q = 1; q <= Q; q++) { prev = cur; cur = standingsAfter(q, prev && prev.order); }
  const maxRows = cfg.max_rows || 8;
  const colorOf = (() => {
    // teams without a set color get one from the palette, in the order they first placed,
    // so a team keeps the same color in every clip
    let k = 0; const assigned = {};
    Object.keys(cfg.questions).sort((x, y) => x - y).forEach(q => cfg.questions[q].forEach(({ team }) => {
      if (!cfg.colors[team] && !assigned[team]) assigned[team] = PALETTE[k++ % PALETTE.length];
    }));
    return (name) => {
      let c = cfg.colors[name] || assigned[name] || '#7a8a99';
      if (green) { // darken green-ish chips so the chroma key doesn't eat them
        const [r, g, b] = [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
        if (g > r * 1.2 && g > b * 1.2) c = '#' + [r, g, b].map(v => Math.round(v * 0.55).toString(16).padStart(2, '0')).join('');
      }
      return c;
    };
  })();
  // optional on-screen renames from a given question on (totals stay keyed by the original name)
  const shown = (name) => { const r = (cfg.display_names || {})[name]; return r && Q >= r.from_question ? r.name : name; };
  const shownNow = cur.order.slice(0, maxRows);
  if (Q === 1) {
    return { mode: 'intro', question: Q, duration: cfg.duration_seconds, green,
      rows: shownNow.map((name, i) => ({ name: shown(name), color: colorOf(name), highlight: name === cfg.highlight,
        fromSlot: null, toSlot: i, toRank: cur.rank[name], toScore: cur.totals[name] })) };
  }
  const shownPrev = prev.order.slice(0, maxRows);
  const names = [...new Set([...shownPrev, ...shownNow])];
  const res = Object.fromEntries(cfg.questions[Q].map(r => [r.team, pts(r.place)]));
  // questions where nobody placed get no clip, so the title rolls from the last question that had one
  let prevQ = Q - 1;
  while (prevQ > 1 && (cfg.questions[prevQ] || []).length === 0) prevQ--;
  // on-screen question numbers (the competition skipped some questions, so later ones are renumbered)
  const label = (q) => (cfg.question_labels || {})[q] ?? q;
  // optional custom title text for a question (e.g. the last one shows "FINAL SCORE")
  const titleOf = (q) => (cfg.question_titles || {})[q] ?? null;
  return { mode: 'update', question: label(Q), prevQuestion: label(prevQ), title: titleOf(Q), prevTitle: titleOf(prevQ), duration: cfg.duration_seconds, green,
    rows: names.map(name => {
      const fs_ = shownPrev.indexOf(name), ts = shownNow.indexOf(name);
      return { name: shown(name), color: colorOf(name), highlight: name === cfg.highlight,
        fromSlot: fs_ < 0 ? null : fs_, toSlot: ts < 0 ? null : ts,
        fromRank: prev.rank[name] ?? null, toRank: cur.rank[name],
        fromScore: prev.totals[name] ?? 0, toScore: cur.totals[name], delta: res[name] ?? 0 };
    }) };
}

// ---------- render ----------
(async () => {
  if (!CHAIN && Q > 1 && (cfg.questions[Q] || []).length === 0) {
    console.log(`Question ${Q} has no placings: no clip (the next clip starts from the last board shown).`);
    return;
  }
  const qs = CHAIN || [Q];
  const MID_SEG = 3.2; // chained segments: move + short hold, no outro
  const segs = qs.map((q, i) => {
    const d = buildData(q);
    if (!SEPARATE && i < qs.length - 1) { d.duration = MID_SEG; d.noOutro = true; d.fadeBadgesAt = MID_SEG - 0.3; }
    return d;
  });
  if (CHAIN) { // the highlighted team's points line up as a streak of badges across the chain
    const hd = segs.map(d => (d.rows.find(r => r.highlight && r.toSlot != null) || {}).delta ?? 0);
    segs.forEach((d, i) => {
      d.streak = { earned: hd.slice(0, i),
        caption: null };
    });
  }
  const data = segs[segs.length - 1];
  if (opt("--dump")) { console.log(JSON.stringify(segs)); return; }
  for (const d of segs) {
    console.log(`Question ${d.question} standings:`);
    d.rows.filter(r => r.toSlot != null).sort((a, b) => a.toSlot - b.toSlot)
      .forEach(r => console.log(`  ${String(r.toRank).padStart(2)}  ${r.name.padEnd(36)} ${String(r.toScore).padStart(3)}` +
        (d.mode === 'update' ? `  (+${r.delta}, was ${r.fromRank ?? '-'})` : '')));
  }

  const outDir = path.join(HERE, 'videos'); fs.mkdirSync(outDir, { recursive: true });
  // --separate: each question in the chain becomes its own clip (streak badges carried over)
  const groups = SEPARATE ? segs.map(d => [d]) : [segs];
  for (const group of groups) {
  const base = path.join(outDir, SEPARATE ? `Leaderboard_Q${group[0].question}_streak`
    : CHAIN ? `Leaderboard_Q${segs[0].prevQuestion}-Q${segs[segs.length - 1].question}` : `Leaderboard_Q${Q}`);
  const frames = fs.mkdtempSync(path.join(os.tmpdir(), 'lb-frames-'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.join(HERE, 'template.html'));
  await page.evaluate(() => document.fonts.ready);
  let f = 0;
  for (const d of group) {
    await page.evaluate((x) => window.setup(x), d);
    const n = Math.round(d.duration * FPS);
    for (let i = 0; i < n; i++) {
      await page.evaluate((t) => window.render(t), i / FPS);
      await page.screenshot({ path: path.join(frames, `f${String(f++).padStart(4, '0')}.png`), omitBackground: !d.green });
    }
  }
  await browser.close();

  const ff = (a) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
  const pattern = path.join(frames, 'f%04d.png');
  if (data.green) {
    ff(['-framerate', FPS, '-i', pattern, '-vf', 'format=yuv420p', '-c:v', 'libx264', '-crf', '12',
        '-preset', 'slow', '-movflags', '+faststart', `${base}_greenscreen.mp4`].map(String));
    console.log(`wrote ${base}_greenscreen.mp4`);
  } else {
    ff(['-framerate', FPS, '-i', pattern, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le',
        '-alpha_bits', '16', '-vendor', 'apl0', `${base}_alpha.mov`].map(String));
    console.log(`wrote ${base}_alpha.mov`);
  }
  const bg = opt('--preview');
  if (bg && bg !== true) {
    const key = data.green ? '[1]colorkey=0x00FF00:0.3:0.05[k];' : '[1]copy[k];';
    ff(['-loop', '1', '-framerate', FPS, '-i', bg, '-framerate', FPS, '-i', pattern, '-filter_complex',
        `[0]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,format=gbrp[bg];${key}[bg][k]overlay=format=rgb:shortest=1,format=yuv420p`,
        '-c:v', 'libx264', '-crf', '18', `${base}_preview.mp4`].map(String));
    console.log(`wrote ${base}_preview.mp4`);
  }
  fs.rmSync(frames, { recursive: true, force: true });
  }
})();
