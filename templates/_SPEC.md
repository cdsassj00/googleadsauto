# 계산모아 도구 페이지 제작 규격 (필독)

모든 도구 페이지는 `/tools/<이름>.html` 에 위치하며 아래 규격을 **정확히** 따른다.
내부 링크는 전부 **확장자 없는 클린 URL** 사용: `/tools/anniversary`, `/privacy`, `/` (vercel.json cleanUrls).

## 1. HEAD 템플릿 (그대로 복사 후 {{ }} 만 치환)

```html
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{TITLE}}</title>
<meta name="description" content="{{DESC — 80~140자, 핵심 키워드 포함}}">
<link rel="canonical" href="https://calcmoa.site/tools/{{SLUG}}">
<meta property="og:type" content="website">
<meta property="og:title" content="{{TITLE}}">
<meta property="og:description" content="{{DESC}}">
<meta property="og:url" content="https://calcmoa.site/tools/{{SLUG}}">
<meta property="og:site_name" content="계산모아">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%232b5bd7'/%3E%3Ctext x='16' y='22' font-size='16' font-weight='900' fill='white' text-anchor='middle' font-family='sans-serif'%3E%3D%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="/css/style.css">
<script src="/js/config.js"></script>
<script src="/js/ads.js"></script>
<script type="application/ld+json">
{{JSONLD — WebApplication + FAQPage (아래 5절)}}
</script>
</head>
```

## 2. BODY 골격 (순서 고정)

```html
<body>
<header class="site-header">
  <div class="bar">
    <a class="logo" href="/"><span class="mark">=</span>계산모아</a>
    <nav class="site-nav">
      <a href="/#cat-date">날짜·디데이</a>
      <a href="/#cat-money">돈·급여</a>
      <a href="/#cat-life">생활·건강</a>
      <a href="/about">소개</a>
    </nav>
  </div>
</header>

<main class="page">
  <nav class="breadcrumb">
    <a href="/">홈</a><span class="sep">›</span>
    <a href="/#cat-{{CAT}}">{{카테고리명}}</a><span class="sep">›</span>
    <span>{{도구명}}</span>
  </nav>

  <h1>{{H1 — 핵심 키워드 그대로}}</h1>
  <p class="lead">{{한두 문장 설명}}</p>

  <div class="ad-slot" data-ad="top"></div>

  <section class="calc-card" data-reveal>
    {{계산기 폼 + 결과}}
  </section>

  <div class="ad-slot" data-ad="mid"></div>

  <article class="content" data-reveal>
    {{롱폼 콘텐츠 — 3절 참고}}
  </article>

  <section data-reveal>
    <h2>관련 계산기</h2>
    <div class="tool-grid">
      {{관련 도구 카드 3~4개 — 4절 형식}}
    </div>
  </section>

  <div class="ad-slot" data-ad="bottom"></div>
</main>

<footer class="site-footer">
  <div class="cols">
    <div>
      <b style="color:var(--ink)">계산모아</b> — 일상에 필요한 모든 계산기<br>
      결과는 참고용이며 법적 효력이 없습니다.
    </div>
    <nav class="links">
      <a href="/about">소개</a>
      <a href="/contact">문의</a>
      <a href="/privacy">개인정보처리방침</a>
      <a href="/terms">이용약관</a>
    </nav>
  </div>
  <p class="tiny">© 2026 계산모아 (calcmoa.site). All rights reserved.</p>
</footer>

<script src="/js/common.js" defer></script>
<script>
/* 페이지 계산 로직 — DOMContentLoaded 이후 실행되도록 defer 특성상 아래처럼 감싼다 */
document.addEventListener("DOMContentLoaded", function () {
  // ...
});
</script>
</body>
</html>
```

## 3. 콘텐츠 (애드센스 승인의 핵심 — 얇은 페이지 금지)

`article.content` 안에 **한국어 600자 이상(단어 아님, 실질 본문)**:
- `<h2>사용법</h2>` — 단계별 사용 방법 (ol 리스트)
- `<h2>{{주제}} 계산 원리</h2>` — 공식·기준·법령을 구체적으로. 표(`<table>`)가 어울리면 표 사용
- `<h2>알아두면 좋은 정보</h2>` — 실용 팁, 관련 제도, 예시 계산 등 (독창적 내용)
- `<h2>자주 묻는 질문</h2>` — `<div class="faq">` 안에 `<details><summary>질문</summary><p>답변</p></details>` 4개 이상
- 필요 시 `<p class="note">…참고/면책…</p>`

문체: ~합니다체. 과장 금지, 검색 의도(사용자가 이 키워드를 치는 이유)에 정확히 답할 것.

## 4. 관련 도구 카드 형식

```html
<a class="tool-card" href="/tools/{{slug}}"><div class="ico">{{이모지}}</div><b>{{도구명}}</b><span>{{한 줄 설명}}</span></a>
```

## 5. JSON-LD

WebApplication + FAQPage 를 배열로:
```json
[
 {"@context":"https://schema.org","@type":"WebApplication","name":"{{도구명}}","url":"https://calcmoa.site/tools/{{SLUG}}","applicationCategory":"UtilityApplication","operatingSystem":"Web","offers":{"@type":"Offer","price":"0","priceCurrency":"KRW"},"inLanguage":"ko"},
 {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"질문","acceptedAnswer":{"@type":"Answer","text":"답변"}}, ...]}
]
```
FAQPage 의 질문/답변은 본문 FAQ 와 동일 내용.

## 6. 계산기 UI/동작 규칙

- 폼은 `<form>` 없이 div + 버튼 클릭 처리(모바일 키보드 제출 이슈 방지). 엔터 처리 원하면 keydown 에서 직접.
- 실행 버튼: `<button type="button" class="btn btn-primary" id="calcBtn">계산하기</button>`
- 입력 검증 실패: 해당 `.field` 에 `CM.invalid(fieldEl, true)` + `.field-error` 요소에 메시지. 성공 시 `CM.invalid(fieldEl, false)`.
- 결과: `<div class="result" hidden id="result">` → 계산 성공 시 `hidden = false`.
  - 대표 수치는 `<div class="big" id="rMain"></div>` 에 `CM.countUp(el, value, {suffix:"원"})` 사용.
  - 상세 내역은 `.rows > .row` (`<div class="row"><span>라벨</span><b>값</b></div>`).
  - 복사 버튼(선택): `<button type="button" class="btn btn-ghost copy-btn" id="copyBtn">결과 복사</button>` + `CM.bindCopy(btn, fn)`.
- 날짜 입력은 `<input type="date">`. 기본값은 오늘로 세팅(JS에서).
- 금액 입력엔 `inputmode="numeric"`. 입력 중 콤마 자동표시는 선택사항(구현 시 커서 위치 주의).
- 모든 수치 표기는 `CM.fmt` / `CM.won` 사용. 소수는 필요한 자리만.
- 계산은 전부 클라이언트에서. 외부 요청/저장 금지.

## 7. 금지사항

- 외부 JS 라이브러리 로드 금지 (Pretendard CSS 제외)
- 헤더/푸터/광고 슬롯 마크업 변형 금지
- lorem ipsum, 빈 섹션, "준비 중" 문구 금지
- 사실 불확실한 수치(세율·법령 등)를 지어내지 말 것 — 지시받은 수치만 사용하고, 근사치임을 본문에 명시
