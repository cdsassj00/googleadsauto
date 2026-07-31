/* ============================================================
   광고/분석 로더 — <head>에서 config.js 다음에 로드됩니다.
   adsenseClient 가 설정된 경우에만 애드센스 스크립트를 주입하고
   .ad-slot 요소를 실제 광고 유닛으로 변환합니다.
   ============================================================ */
(function () {
  var c = window.SITE_CONFIG || {};

  /* ---- Google AdSense ---- */
  if (c.adsenseClient && /^ca-pub-\d{10,}$/.test(c.adsenseClient)) {
    var s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + c.adsenseClient;
    document.head.appendChild(s);

    document.addEventListener("DOMContentLoaded", function () {
      document.querySelectorAll(".ad-slot").forEach(function (el) {
        var ins = document.createElement("ins");
        ins.className = "adsbygoogle";
        ins.style.display = "block";
        ins.setAttribute("data-ad-client", c.adsenseClient);
        var key = el.getAttribute("data-ad");
        if (c.adSlots && c.adSlots[key]) {
          ins.setAttribute("data-ad-slot", c.adSlots[key]);
        }
        ins.setAttribute("data-ad-format", "auto");
        ins.setAttribute("data-full-width-responsive", "true");
        el.appendChild(ins);
        el.classList.add("on");
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      });
    });
  }

  /* ---- Google Analytics 4 ---- */
  if (c.gaId && /^G-[A-Z0-9]+$/.test(c.gaId)) {
    var g = document.createElement("script");
    g.async = true;
    g.src = "https://www.googletagmanager.com/gtag/js?id=" + c.gaId;
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag("js", new Date());
    gtag("config", c.gaId);
  }
})();
