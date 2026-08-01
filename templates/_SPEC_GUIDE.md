# 계산모아 가이드(아티클) 페이지 제작 규격

기본은 `templates/_SPEC.md`(head/body 골격·클린 URL·금지사항)를 따르되 아래만 다르다.
파일 위치: `/guide/<slug>.html`, canonical: `https://calcmoa.site/guide/<slug>`.

## head 차이
- JSON-LD: Article + FAQPage 배열
```json
[{"@context":"https://schema.org","@type":"Article","headline":"{{제목}}","description":"{{요약}}","datePublished":"2026-08-01","dateModified":"2026-08-01","author":{"@type":"Organization","name":"계산모아"},"publisher":{"@type":"Organization","name":"계산모아"},"mainEntityOfPage":"https://calcmoa.site/guide/{{slug}}","inLanguage":"ko"}, {FAQPage...}]
```

## body 차이
- 브레드크럼: 홈 › <a href="/guide">가이드</a> › {{제목}}
- calc-card(계산기 폼) 없음. 대신 본문 중간에 관련 계산기 CTA 박스 1개:
```html
<section class="calc-card" data-reveal style="text-align:center">
  <p style="margin:0 0 14px;color:var(--sub)">{{한 줄 유도문}}</p>
  <a class="btn btn-primary" style="width:auto" href="/tools/{{slug}}">{{계산기명}} 바로가기 →</a>
</section>
```
- 구조: h1 → lead → ad(top) → article.content(도입부 2~3문단 → h2 섹션 3~5개, 표 적극 활용 → 중간에 위 CTA 박스 + ad(mid) → FAQ 4개+) → 관련 도구 카드 3~4개 → ad(bottom)
- 헤더 site-nav (6개, 순서 고정):
```html
<a href="/#cat-date">날짜·디데이</a>
<a href="/#cat-money">돈·급여</a>
<a href="/#cat-life">생활·건강</a>
<a href="/tests">테스트</a>
<a href="/guide">가이드</a>
<a href="/about">소개</a>
```

## 콘텐츠 규칙
- 실질 한국어 **1,500자 이상**. 검색 의도에 정면으로 답하는 실용 정보. 표·리스트·구체 예시 필수.
- 수치·법령은 지시받은 것만 사용, 근사·변동 가능성 명시. 과장/추측 금지. ~합니다체.
- 내부 링크: 관련 계산기 2~3개를 본문 문장 안에서도 자연스럽게 링크.
