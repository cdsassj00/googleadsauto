// DO 번역 캐시 워밍업: 모든 KR 페이지 × en/zh/ja를 complete 될 때까지 반복 요청
import { readdirSync } from "node:fs";
const ROOT = "/home/user/googleadsauto";
const base = "https://calcmoa-i18n.sjshin.workers.dev";
const paths = ["/", "/about", "/contact", "/privacy", "/terms", "/tests", "/guide"];
for (const dir of ["tools", "tests", "guide"]) {
  for (const f of readdirSync(`${ROOT}/${dir}`)) {
    if (f.endsWith(".html") && f !== "index.html") paths.push(`/${dir}/${f.replace(".html", "")}`);
  }
}
const langs = process.argv[2] ? process.argv[2].split(",") : ["zh", "en", "ja"];
const jobs = [];
for (const l of langs) for (const p of paths) jobs.push({ l, p });

let done = 0, partial = 0, failed = 0;
async function warm({ l, p }) {
  for (let i = 0; i < 10; i++) {
    try {
      const r = await fetch(`${base}/${l}${p === "/" ? "/" : p}`, { signal: AbortSignal.timeout(120000) });
      const s = r.headers.get("x-i18n") || "";
      await r.arrayBuffer();
      if (r.status !== 200) { failed++; console.log("FAIL", r.status, l, p); return; }
      if (s === "hit" || s === "complete") { done++; return; }
    } catch (e) { /* retry */ }
  }
  partial++; console.log("PARTIAL", l, p);
}
const CONC = 5;
let idx = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (idx < jobs.length) { const j = jobs[idx++]; await warm(j); }
}));
console.log(`done=${done} partial=${partial} failed=${failed} total=${jobs.length}`);
