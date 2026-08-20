# 계산모아 (calcmoa.site)

일상 계산기 16종을 제공하는 정적 사이트. 구글 애드센스 수익화를 목표로 설계되었습니다.

- 순수 HTML/CSS/JS (빌드 불필요), Vercel 정적 호스팅 기준 (`vercel.json` cleanUrls)
- 모든 계산은 클라이언트에서만 실행 — 서버·DB 없음

## 구조

```
index.html          홈 (도구 그리드)
tools/*.html        계산기 16종
about/contact/privacy/terms.html   애드센스 승인용 필수 페이지
css/style.css       디자인 시스템 (다크모드 자동)
js/config.js        ★ 사이트 설정 (애드센스 ID 여기만 수정)
js/ads.js           애드센스/GA 로더 (ID 없으면 광고 슬롯 자동 숨김)
js/common.js        리빌 애니메이션 + CM 헬퍼
ads.txt / robots.txt / sitemap.xml / vercel.json
```

## 운영 순서 (수익화 체크리스트)

1. **배포** — Vercel에 이 레포 연결 (Framework: Other, 빌드 명령 없음)
2. **도메인 연결** — 커스텀 도메인(예: calcmoa.site)을 Vercel 프로젝트에 추가
   - 도메인이 다르면: `js/config.js`의 `siteUrl` 수정 + 전체 치환
     `grep -rl "calcmoa.site" --include="*.html" --include="*.xml" --include="*.txt" . | xargs sed -i 's/calcmoa\.site/새도메인/g'`
3. **서치콘솔 등록** — [Google Search Console](https://search.google.com/search-console)과
   [네이버 서치어드바이저](https://searchadvisor.naver.com)에 도메인 등록, `sitemap.xml` 제출
   (한국 트래픽은 네이버 유입이 크므로 둘 다 필수)
4. **2~4주 콘텐츠 숙성** — 트래픽이 조금이라도 잡힌 뒤 신청하면 승인율이 올라감
5. **애드센스 신청** — [adsense.google.com](https://adsense.google.com) → 사이트 추가
6. **승인 후**:
   - `js/config.js` → `adsenseClient: "ca-pub-본인ID"` 입력 (모든 페이지 광고 자동 활성화)
   - `ads.txt` → 주석 해제하고 pub ID 교체
   - 광고 단위를 직접 만들었으면 `adSlots`에 슬롯 ID 입력 (안 넣으면 자동 형식)
7. **GA4(선택)** — `js/config.js` → `gaId: "G-XXXX"`

## 새 계산기 추가하기

`templates/_SPEC.md` 규격대로 `tools/새이름.html` 생성 후:
1. `index.html` 해당 카테고리에 tool-card 추가
2. `sitemap.xml`에 URL 추가
3. 관련 페이지들의 "관련 계산기"에 상호 링크

## 주의

- 세율·요율(4대보험, 최저시급 등)은 **2026년 기준** — 매년 1월 갱신 필요
  (`tools/salary.html`, `tools/hourly.html` 본문 표 포함)
- 문의 이메일은 `js/config.js`와 `contact.html`, `privacy.html`, `terms.html`에 있음

## 다국어 실시간 번역 (workers/i18n)

- `/en` `/zh` `/ja` 경로 중 **정적 파일이 없는 페이지**는 `vercel.json` rewrites가
  Cloudflare Worker(주소는 `vercel.json` rewrites 참조)로 프록시한다.
- 워커는 한국어 원본을 fetch → **Workers AI(m2m100)** 로 문장 단위 번역 →
  **Durable Object(SQLite storage)** 에 문장/페이지 캐시 저장 (KV 미사용).
- 요청당 AI 호출 상한(40)이 있어 첫 방문은 부분 번역일 수 있고, 반복 방문으로 수렴.
  배포/원본 대량 수정 후에는 `node workers/i18n/warmup.mjs` (또는 `warmup.mjs zh` 처럼
  언어 지정)로 전 페이지를 미리 번역해 캐시를 채울 것.
- 번역 로직을 바꾸면 `src/index.js`의 `V` 상수를 올려 캐시를 무효화한 뒤
  `npx wrangler deploy` (요구: `CLOUDFLARE_API_TOKEN`).
- 수작업 현지화 정적 페이지(en/ja/fr의 dday·age·percent·bmi·compound·charcount)는
  `STATIC_MAP`에 등록되어 워커가 301로 넘긴다. 새 정적 번역판을 만들면 여기에 추가.
- 다국어 SEO: 전 KR 페이지에 hreflang(ko/en/zh-CN/ja) 상호참조,
  번역 URL은 `sitemap-i18n.xml`(robots.txt에 등록)에 별도 수록 — GSC에 추가 제출 가능.
