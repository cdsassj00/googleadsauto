/* ============================================================
   계산모아 공통 스크립트 (defer 로드)
   - 리빌 옵저버 (fade-up / stagger)
   - CM 헬퍼: countUp, shake, bindCopy, fmt, won, invalid
   ============================================================ */
(function () {
  var REDUCE = matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ---- 리빌: IntersectionObserver 1개로 통합 ---- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("show");
      io.unobserve(e.target);
    });
  }, { threshold: 0.15 });

  document.querySelectorAll("[data-reveal]").forEach(function (el) {
    if (el.hasAttribute("data-stagger")) {
      Array.prototype.forEach.call(el.children, function (c, i) {
        c.style.transitionDelay = (i * 60) + "ms";
      });
    }
    io.observe(el);
  });

  /* ---- 숫자 포맷 ---- */
  function fmt(n, decimals) {
    if (typeof decimals !== "number") decimals = 0;
    return Number(n).toLocaleString("ko-KR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
  function won(n) { return fmt(Math.round(n)) + "원"; }

  /* ---- 카운트업 (count-up): 결과 숫자 롤업 ---- */
  function countUp(el, value, opts) {
    opts = opts || {};
    var decimals = opts.decimals || 0;
    var prefix = opts.prefix || "";
    var suffix = opts.suffix || "";
    if (REDUCE) { el.textContent = prefix + fmt(value, decimals) + suffix; return; }
    var dur = opts.duration || 700;
    var t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmt(value * eased, decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---- 에러 셰이크 (스냅 리셋 패턴) ---- */
  function shake(el) {
    el.classList.remove("shake");
    void el.offsetWidth;
    el.classList.add("shake");
  }

  /* ---- 필드 오류 표시 ---- */
  function invalid(fieldEl, on) {
    fieldEl.classList.toggle("invalid", !!on);
    if (on) shake(fieldEl);
  }

  /* ---- 카피 피드백 ---- */
  function bindCopy(btn, getText) {
    var orig = btn.textContent;
    btn.addEventListener("click", function () {
      var txt = typeof getText === "function" ? getText() : String(getText);
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
        .then(done, function () {
          var ta = document.createElement("textarea");
          ta.value = txt; document.body.appendChild(ta);
          ta.select(); document.execCommand("copy"); ta.remove();
          done();
        });
    });
    function done() {
      btn.classList.add("done");
      btn.textContent = "복사됨 ✓";
      setTimeout(function () {
        btn.classList.remove("done");
        btn.textContent = orig;
      }, 1600);
    }
  }

  window.CM = {
    fmt: fmt, won: won, countUp: countUp,
    shake: shake, invalid: invalid, bindCopy: bindCopy,
    REDUCE: REDUCE
  };
})();
