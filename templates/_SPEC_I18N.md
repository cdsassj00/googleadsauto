# 계산모아 다국어(i18n) 도구 페이지 규격

한국어 원본(`tools/<slug>.html`)을 **현지화**(단순 번역 금지)해 `/{lang}/<slug>.html` 로 만든다.
lang ∈ {en, ja, fr}. canonical: `https://calcmoa.site/{lang}/<slug>`.

## 원칙
- 한국 전용 제도/수치(주휴수당, 4대보험, 원화 표기 등)는 **삭제하거나 보편 내용으로 대체**. 통화 예시는 en=$/일반 숫자, ja=¥, fr=€.
- 본문 콘텐츠(사용법/원리/FAQ)는 해당 언어로 **자연스럽게 재작성** — 기계번역 티 금지. 현지 검색 의도에 맞는 내용 추가(예: ja 나이 계산기엔 数え年·早生まれ, fr BMI엔 IMC 용어).
- 사이트명 표기: en "CalcMoa", ja "CalcMoa(カルクモア)", fr "CalcMoa".
- 날짜 포맷: en YYYY-MM-DD 또는 "Aug 1, 2026" / ja YYYY年M月D日 / fr 1 août 2026. 숫자 포맷은 toLocaleString('en-US'|'ja-JP'|'fr-FR').

## head (한국어 SPEC과 동일 구조, 차이만)
- `<html lang="{en|ja|fr}">`
- title/description/og 전부 해당 언어. og:locale = en_US / ja_JP / fr_FR
- naver-site-verification 줄은 **제외**. google verification·adsense·config.js·ads.js는 유지.
- hreflang 링크(자기 자신 + 다른 언어판 + 한국어판 + x-default). 예(en/percent):
```html
<link rel="alternate" hreflang="ko" href="https://calcmoa.site/tools/percent">
<link rel="alternate" hreflang="en" href="https://calcmoa.site/en/percent">
<link rel="alternate" hreflang="ja" href="https://calcmoa.site/ja/percent">
<link rel="alternate" hreflang="fr" href="https://calcmoa.site/fr/percent">
<link rel="alternate" hreflang="x-default" href="https://calcmoa.site/en/percent">
```
- JSON-LD: WebApplication + FAQPage (해당 언어, inLanguage 일치)

## body
- **프로모션 배너 넣지 않음** (한국어 페이지 전용)
- 헤더:
```html
<header class="site-header">
  <div class="bar">
    <a class="logo" href="/{lang}"><span class="mark">=</span>CalcMoa</a>
    <nav class="site-nav">
      <a href="/{lang}">{Tools|ツール|Outils}</a>
      <a href="/en">EN</a><a href="/ja">日本語</a><a href="/fr">FR</a><a href="/">한국어</a>
    </nav>
  </div>
</header>
```
(현재 언어 링크도 그대로 노출 — 단순함 우선)
- 브레드크럼: {Home|ホーム|Accueil}(/{lang}) › 도구명
- 구조는 한국어 SPEC 동일: h1 → lead → ad(top) → calc-card(폼+결과) → ad(mid) → content(사용법/원리/FAQ 4개+) → related 카드(같은 언어 도구만 3개) → ad(bottom)
- 푸터: 간단 버전 — 사이트 설명 한 줄(해당 언어) + 링크 {About→/about, Privacy→/privacy, Terms→/terms} (한국어 페이지로 연결, 명시적으로 "(Korean)" 표기) + © 2026 CalcMoa (calcmoa.site)
- 스크립트: /js/common.js defer + 페이지 계산 로직(한국어판 로직 재사용, 라벨·포맷만 현지화). CM 헬퍼의 fmt는 ko-KR 고정이므로 **숫자 표기는 Number.prototype.toLocaleString('{locale}') 직접 사용** (CM.countUp 대신 결과 즉시 표시 가능).

## 금지
- 한국 법령·원화 요율을 그대로 번역해 싣는 것
- lorem/빈 섹션, 낯선 클래스 발명(기존 style.css 클래스만)
