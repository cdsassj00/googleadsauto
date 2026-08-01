/* ============================================================
   계산모아 홈 전용 이펙트 (defer, common.js 뒤에 로드)
   1) 3D 플로팅 계산기: 자동 궤도 + 마우스 패럴랙스 (lerp)
   2) 파티클 성좌 (constellation): 히어로 캔버스
   3) 3D 틸트 카드: 데스크톱 포인터 전용
   4) 카운트업 스탯
   전부 reduced-motion 가드, transform/opacity만 애니메이션.
   ============================================================ */
(function () {
  var REDUCE = matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* ---- 1) 3D 계산기: 자동 궤도 + 마우스 오버라이드 ---- */
  var calc = document.querySelector(".calc3d");
  if (calc && !REDUCE) {
    var tRX = 14, tRY = -16, cRX = 14, cRY = -16, hasMouse = false, T = 0;
    addEventListener("pointermove", function (e) {
      hasMouse = true;
      var nx = e.clientX / innerWidth - 0.5;   // -0.5 ~ 0.5
      var ny = e.clientY / innerHeight - 0.5;
      tRY = nx * 42;
      tRX = 16 - ny * 30;
    }, { passive: true });
    (function loop() {
      T += 0.008;
      if (!hasMouse) { tRY = -16 + Math.cos(T) * 14; tRX = 14 + Math.sin(T * 1.3) * 6; }
      cRX += (tRX - cRX) * 0.07;
      cRY += (tRY - cRY) * 0.07;
      calc.style.setProperty("--rx", cRX.toFixed(2) + "deg");
      calc.style.setProperty("--ry", cRY.toFixed(2) + "deg");
      requestAnimationFrame(loop);
    })();
    /* 스크린 숫자 롤링 */
    var screen = calc.querySelector(".screen");
    if (screen) {
      var vals = ["1,004", "36,500", "2,156,880", "D-100", "만 26세", "477,415", "25.4평", "BMI 22.5"];
      var vi = 0;
      setInterval(function () {
        vi = (vi + 1) % vals.length;
        screen.style.opacity = "0";
        setTimeout(function () { screen.textContent = vals[vi]; screen.style.opacity = "1"; }, 240);
      }, 2200);
      screen.style.transition = "opacity .24s ease";
    }
  }

  /* ---- 2) 파티클 성좌 ---- */
  var cv = document.getElementById("fx");
  if (cv && !REDUCE) {
    var ctx = cv.getContext("2d");
    var W, H, DPR, pts = [], mouse = { x: -9e9, y: -9e9 };
    var running = true;

    function fit() {
      DPR = Math.min(2, devicePixelRatio || 1);
      var r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = W * DPR; cv.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    fit();
    addEventListener("resize", fit, { passive: true });

    var N = Math.min(70, Math.floor(W / 16));
    for (var i = 0; i < N; i++) {
      pts.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6,
        gold: Math.random() < 0.12
      });
    }
    cv.parentElement.addEventListener("pointermove", function (e) {
      var r = cv.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    cv.parentElement.addEventListener("pointerleave", function () {
      mouse.x = -9e9; mouse.y = -9e9;
    }, { passive: true });

    new IntersectionObserver(function (es) {
      running = es[0].isIntersecting;
      if (running) requestAnimationFrame(draw);
    }, { threshold: 0 }).observe(cv);

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      var LINK = 110;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        /* 마우스 인력 (부드럽게) */
        var dxm = mouse.x - p.x, dym = mouse.y - p.y;
        var dm2 = dxm * dxm + dym * dym;
        if (dm2 < 22500) { p.x += dxm * 0.006; p.y += dym * 0.006; }

        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j];
          var dx = p.x - q.x, dy = p.y - q.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            var a = (1 - Math.sqrt(d2) / LINK) * 0.35;
            ctx.strokeStyle = "rgba(64,156,255," + a.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        ctx.fillStyle = p.gold ? "rgba(255,210,87,.8)" : "rgba(120,180,255,.75)";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();
      }
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  /* ---- 3) 3D 틸트 카드 ---- */
  if (!REDUCE && matchMedia("(hover:hover) and (pointer:fine)").matches) {
    document.querySelectorAll(".tool-card").forEach(function (card) {
      var raf = null;
      card.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          card.classList.add("tilting");
          card.style.transform =
            "perspective(700px) rotateX(" + (-py * 8).toFixed(2) + "deg) rotateY(" + (px * 10).toFixed(2) + "deg) translateY(-3px)";
        });
      });
      card.addEventListener("pointerleave", function () {
        card.classList.remove("tilting");
        card.style.transform = "";
      });
    });
  }

  /* ---- 4) 카운트업 스탯 ---- */
  var stats = document.querySelector(".stats");
  if (stats && window.CM) {
    new IntersectionObserver(function (es, io) {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      stats.querySelectorAll(".num[data-to]").forEach(function (el) {
        var to = parseInt(el.getAttribute("data-to"), 10);
        var suffix = el.getAttribute("data-suffix") || "";
        var target = el.querySelector("span:not(.u)") || el;
        CM.countUp(target, to, { duration: 900, suffix: "" });
        void suffix;
      });
    }, { threshold: 0.4 }).observe(stats);
  }
})();
