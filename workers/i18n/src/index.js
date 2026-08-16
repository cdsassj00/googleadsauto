/**
 * calcmoa-i18n — calcmoa.site 실시간 번역 워커
 *
 * 아키텍처
 *  - Vercel(calcmoa.site)이 /en|/zh|/ja 요청 중 정적 파일이 없는 경로를 이 워커로 rewrite
 *  - 워커가 한국어 원본 페이지를 fetch → Workers AI(m2m100)로 문장 단위 번역
 *  - 번역 결과는 Durable Object(SQLite storage)에 문장 캐시 + 완성 페이지 캐시로 저장 (KV 미사용)
 *  - 첫 방문은 부분 번역일 수 있으나(요청당 AI 호출 상한) 캐시가 누적되어 수 회 내 완전 번역으로 수렴
 */
import { DurableObject } from "cloudflare:workers";

const LANGS = {
  en: { m2m: "english", html: "en", og: "en_US", label: "English", flag: "flag-us.png" },
  zh: { m2m: "chinese", html: "zh-CN", og: "zh_CN", label: "中文", flag: "flag-cn.png" },
  ja: { m2m: "japanese", html: "ja", og: "ja_JP", label: "日本語", flag: "flag-jp.png" },
  fr: { m2m: "french", html: "fr", og: "fr_FR", label: "Français", flag: "flag-fr.png" },
};
const KO = /[가-힣]/;
const V = "2"; // 번역 로직 변경 시 범프 → 캐시 무효화
const MAX_AI_CALLS = 30; // 무료 플랜 서브리퀘스트 한도(50) 내 안전 상한 (origin+DO 호출 여유분 확보)
const BRAND = "CalcMoa"; // 브랜드명은 번역기에 넘기지 않고 고정 표기
// m2m100이 오역하는 핵심 용어는 타깃 표현으로 사전 치환 (버전 GV — 바꾸면 해당 문장만 재번역)
const GV = "g1";
const GLOSS = {
  en: { "실수령액": "take-home pay", "만 나이": "international age", "주휴수당": "weekly holiday pay", "디데이": "D-day" },
  zh: { "실수령액": "到手工资", "만 나이": "周岁", "주휴수당": "每周假日津贴", "디데이": "倒数日" },
  ja: { "실수령액": "手取り額", "만 나이": "満年齢", "주휴수당": "週休手当", "디데이": "Dデー" },
  fr: { "실수령액": "salaire net", "만 나이": "âge international", "주휴수당": "indemnité hebdomadaire", "디데이": "jour J" },
};
const hasGloss = (t, lang) => Object.keys(GLOSS[lang]).some((k) => t.includes(k));
const applyGloss = (t, lang) => {
  let s = t.replaceAll("계산모아", BRAND);
  for (const [k, v] of Object.entries(GLOSS[lang])) s = s.replaceAll(k, v);
  return s;
};
const ATTR_RE = /(content|alt|placeholder|aria-label|title|data-label)="([^"]*)"/g;

const fnv = (s) => {
  let h = 0xcbf29ce484222325n;
  for (let i = 0; i < s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(36);
};

const decodeEnt = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&middot;/g, "·")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
const escText = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => escText(s).replace(/"/g, "&quot;");

export class TranslationCache extends DurableObject {
  async getPage(path, hash) {
    const v = await this.ctx.storage.get("page" + V + GV + ":" + path);
    return v && v.hash === hash ? v.html : null;
  }
  async putPage(path, hash, html) {
    await this.ctx.storage.put("page" + V + GV + ":" + path, { hash, html });
  }
  async getSegs(keys) {
    const out = {};
    for (let i = 0; i < keys.length; i += 128) {
      const m = await this.ctx.storage.get(keys.slice(i, i + 128));
      for (const [k, v] of m) out[k] = v;
    }
    return out;
  }
  async putSegs(obj) {
    const entries = Object.entries(obj);
    for (let i = 0; i < entries.length; i += 128) {
      await this.ctx.storage.put(Object.fromEntries(entries.slice(i, i + 128)));
    }
  }
}

async function translateBatch(env, texts, targetM2m, lang) {
  const out = {};
  let calls = 0;
  for (const t of texts) {
    if (calls >= MAX_AI_CALLS) break;
    calls++;
    try {
      const r = await env.AI.run("@cf/meta/m2m100-1.2b", {
        text: applyGloss(decodeEnt(t), lang).replace(/\s+/g, " ").trim(),
        source_lang: "korean",
        target_lang: targetM2m,
      });
      const tr = (r && r.translated_text || "").trim();
      if (tr && !KO.test(tr)) out[t] = tr;
    } catch (e) {
      break; // AI 한도 초과 등 — 남은 문장은 다음 요청에서
    }
  }
  return out;
}

// 과거 정적 현지화 페이지 URL(/en/dday 등) → 통일된 번역 경로로 301
const LEGACY_MAP = {
  "/dday": "/tools/dday",
  "/age": "/tools/age",
  "/percent": "/tools/percent",
  "/bmi": "/tools/bmi",
  "/compound": "/tools/compound",
  "/charcount": "/tools/charcount",
};
function langPath(lang, path) {
  return "/" + lang + (path === "/" ? "" : path);
}

function rewriteHref(path, lang) {
  if (!path.startsWith("/")) return path;
  if (path === "/") return "/" + lang;
  if (path.startsWith("/#")) return "/" + lang + path.slice(1);
  if (/^\/(en|ja|fr|zh)(\/|$|#)/.test(path)) return path;
  if (/^\/(css|js|img)\//.test(path)) return path;
  if (/^\/(ads\.txt|robots\.txt|sitemap[^/]*\.xml|rss\.xml|og\.png)$/.test(path)) return path;
  return "/" + lang + path;
}

function langFloat(lang) {
  const items = [
    ["", "flag-kr.png", "한국어", "ko"],
    ["en", "flag-us.png", "English", "en"],
    ["zh", "flag-cn.png", "中文", "zh"],
    ["ja", "flag-jp.png", "日本語", "ja"],
    ["fr", "flag-fr.png", "Français", "fr"],
  ];
  const links = items
    .map(([p, flag, label, code]) => {
      const on = code === lang ? ' class="on"' : "";
      return `  <a href="/${p}"${on}><img src="/img/${flag}" alt="${label}" width="28" height="21" loading="lazy"><span>${label}</span></a>`;
    })
    .join("\n");
  return `<nav class="lang-float" aria-label="Language">\n${links}\n</nav>`;
}

async function translatePage(koHtml, lang, path, env, stub) {
  const L = LANGS[lang];
  // 1) script/style/주석 보호
  const saved = [];
  let html = koHtml.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/gi, (m) => {
    saved.push(m);
    return `${saved.length - 1}`;
  });

  // 2) 태그 단위 분해, 번역 대상 수집 (문서 순서 유지)
  const parts = html.split(/(<[^>]+>)/);
  const units = []; // {kind:'text'|'attr', idx, raw, key}
  const seen = new Map(); // raw -> key
  const addUnit = (raw) => {
    const t = raw.trim();
    if (!t || !KO.test(t)) return null;
    if (!seen.has(t)) seen.set(t, "s" + V + (hasGloss(t, lang) ? GV : "") + ":" + fnv(t));
    return t;
  };
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p) continue;
    if (p[0] === "<") {
      let m;
      ATTR_RE.lastIndex = 0;
      while ((m = ATTR_RE.exec(p))) addUnit(m[2]);
    } else if (!p.includes("")) {
      addUnit(p);
    }
  }

  // 3) 캐시 조회 → 미번역분만 AI 호출(문서 순서 = 중요도 순서)
  const raws = [...seen.keys()];
  const keys = raws.map((r) => seen.get(r));
  const cached = await stub.getSegs(keys);
  const missing = raws.filter((r) => !(seen.get(r) in cached));
  let fresh = {};
  if (missing.length) {
    fresh = await translateBatch(env, missing, L.m2m, lang);
    const toStore = {};
    for (const [raw, tr] of Object.entries(fresh)) toStore[seen.get(raw)] = tr;
    if (Object.keys(toStore).length) await stub.putSegs(toStore);
  }
  const lookup = (t) => {
    const k = seen.get(t);
    return (k && cached[k]) || fresh[t] || null;
  };

  // 4) 치환: 텍스트 노드 + 속성값 + 내부 링크 prefix
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p) continue;
    if (p[0] === "<") {
      let tag = p.replace(ATTR_RE, (m0, name, val) => {
        const t = val.trim();
        if (!t || !KO.test(t)) return m0;
        const tr = lookup(t);
        return tr ? `${name}="${escAttr(tr)}"` : m0;
      });
      tag = tag.replace(/href="([^"]*)"/g, (m0, href) => `href="${rewriteHref(href, lang)}"`);
      parts[i] = tag;
    } else if (!p.includes("")) {
      const t = p.trim();
      if (t && KO.test(t)) {
        const tr = lookup(t);
        if (tr) {
          const lead = p.match(/^\s*/)[0];
          const tail = p.match(/\s*$/)[0];
          parts[i] = lead + escText(tr) + tail;
        }
      }
    }
  }
  html = parts.join("");

  // 5) head/SEO 조정
  const self = "https://calcmoa.site/" + lang + (path === "/" ? "" : path);
  html = html
    .replace(/<html lang="ko">/, `<html lang="${L.html}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${self}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${self}">`)
    .replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*">\s*/g, "");
  const base = "https://calcmoa.site" + (path === "/" ? "" : path);
  const alt = [
    `<link rel="alternate" hreflang="ko" href="${base === "https://calcmoa.site" ? base + "/" : base}">`,
    ...["en", "zh", "ja", "fr"].map((l) => `<link rel="alternate" hreflang="${l === "zh" ? "zh-CN" : l}" href="https://calcmoa.site${langPath(l, path)}">`),
    `<link rel="alternate" hreflang="x-default" href="https://calcmoa.site${langPath("en", path)}">`,
  ].join("\n");
  html = html.replace("</head>", alt + "\n<meta property=\"og:locale\" content=\"" + L.og + "\">\n</head>");

  // 6) 언어 스위처 재생성
  html = html.replace(/<nav class="lang-float"[\s\S]*?<\/nav>/, langFloat(lang));

  // 7) 보호 블록 복원 + JSON-LD 언어 표기
  html = html.replace(/(\d+)/g, (m, n) => saved[+n]);
  html = html.replace(/"inLanguage":"ko"/g, `"inLanguage":"${L.html}"`);

  const remaining = missing.filter((r) => !(r in fresh)).length;
  return { html, complete: remaining === 0, remaining };
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/(en|zh|ja|fr)(\/.*)?$/);
    if (!m) return new Response("Not found", { status: 404 });
    const lang = m[1];
    let rest = m[2] || "/";
    if (rest !== "/" && rest.endsWith("/")) rest = rest.slice(0, -1);

    // 과거 정적 페이지 URL은 통일 경로로 301
    if (LEGACY_MAP[rest] !== undefined) {
      return Response.redirect("https://calcmoa.site/" + lang + LEGACY_MAP[rest], 301);
    }

    const oRes = await fetch(env.ORIGIN + (rest === "/" ? "/" : rest), {
      headers: { "user-agent": "calcmoa-i18n-worker" },
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
    if (!oRes.ok) return new Response("Not found", { status: oRes.status });
    const ct = oRes.headers.get("content-type") || "";
    if (!ct.includes("text/html")) return oRes;

    const koHtml = await oRes.text();
    const hash = fnv(koHtml);
    const stub = env.CACHE.get(env.CACHE.idFromName(lang));

    const cachedPage = await stub.getPage(rest, hash);
    if (cachedPage) {
      return new Response(cachedPage, {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=3600", "x-i18n": "hit" },
      });
    }

    let html, complete, remaining;
    try {
      ({ html, complete, remaining } = await translatePage(koHtml, lang, rest, env, stub));
    } catch (e) {
      // 한도 초과 등 — 500 대신 원본이라도 서빙 (다음 요청에서 캐시로 수렴)
      return new Response(koHtml, {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-i18n": "error" },
      });
    }
    if (complete) ctx.waitUntil(stub.putPage(rest, hash, html));
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": complete ? "public, max-age=3600" : "no-store",
        "x-i18n": complete ? "complete" : "partial:" + remaining,
      },
    });
  },
};
