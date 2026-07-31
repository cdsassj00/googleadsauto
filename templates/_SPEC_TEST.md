# 계산모아 심리테스트 페이지 제작 규격

기본 규격은 `templates/_SPEC.md`(도구 페이지 규격)를 그대로 따르되, 아래만 다르다.
파일 위치: `/tests/<slug>.html`, canonical: `https://calcmoa.site/tests/<slug>`.

## 1. head 차이점
- canonical/og:url 이 `/tests/<slug>`
- `/js/quiz.js` 를 common.js 앞에 defer 로 추가:
  `<script src="/js/quiz.js" defer></script>` `<script src="/js/common.js" defer></script>`
- JSON-LD: WebApplication(applicationCategory는 "EntertainmentApplication") + FAQPage

## 2. body 차이점
- 브레드크럼: 홈 › <a href="/tests">심리테스트</a> › {{테스트명}}
- calc-card 자리에 퀴즈 마운트:
```html
<section class="calc-card" data-reveal>
  <div id="quiz"></div>
</section>
```
- 페이지 스크립트에서 CMQuiz.start 호출 (defer 로드이므로 DOMContentLoaded 안에서):
```js
document.addEventListener("DOMContentLoaded", function () {
  CMQuiz.start({
    mount: "#quiz",
    title: "연애 유형 테스트",       // 결과 복사 텍스트에 쓰임
    emoji: "💘",
    intro: "12문항으로 알아보는 나의 연애 스타일",
    minutes: 2,
    questions: [ { q: "...", a: [ { t: "...", v: {L:2} }, ... ] }, ... ],
    compute: function (picked) { /* v 합산 → results 의 key 반환 */ },
    results: { KEY: { emoji, title, sub, desc, traits: ["..."], good: "...", bad: "..." } }
  });
});
```

## 3. 콘텐츠 규칙 (퀴즈도 얇은 페이지 금지)
- 문항 10~12개, 보기 3~4개. **기존 유행 테스트 문항을 베끼지 말고 오리지널로 작성.**
- "MBTI" 라는 상표 명칭은 사용 금지. "성격 유형", "E/I 성향" 등 일반 용어만.
- 결과 유형은 4~8개. 각 결과: emoji, title(별명형), sub(한 줄), desc(4~6문장, 구체적), traits 3~4개, good/bad(잘 맞는·부딪히는 유형 — 해당 시).
- article.content 필수(600자+): 이 테스트가 무엇을 측정하는지 / 결과 유형 전체 소개 표(유형명+한줄) / 재미로 보는 테스트라는 한계 명시(과학적 진단 아님 — note) / FAQ 4개+.
- 스트레스 등 건강 관련 테스트는 "의학적 진단이 아니며 전문가 상담을 대체하지 않는다" 면책 필수.

## 4. 광고 슬롯
도구 페이지와 동일하게 top(h1 아래) / mid(퀴즈 아래) / bottom(관련 콘텐츠 아래) 3개.

## 5. 관련 카드
관련 테스트 3~4개 + 계산기 1~2개 섞어서 (tool-card 형식 동일).
