/* ============================================================
   계산모아 퀴즈 엔진 (심리테스트 공용)
   사용법: CMQuiz.start({ mount, emoji, intro, meta, questions, compute, results })
   - questions: [{ q: "질문", a: [{ t: "보기", v: 점수객체 또는 숫자 }] }]
   - compute(picked): picked = 선택한 v 배열 → 결과 key 반환
   - results: { key: { emoji, title, sub, desc, traits: [], good: {k,t}, bad: {k,t} } }
   ============================================================ */
(function () {
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function start(cfg) {
    var mount = typeof cfg.mount === "string" ? document.querySelector(cfg.mount) : cfg.mount;
    if (!mount) return;
    var picked = [];
    var idx = 0;

    function renderIntro() {
      mount.innerHTML = "";
      var box = el("div", "quiz-intro");
      box.appendChild(el("div", "emoji", cfg.emoji || "🧠"));
      box.appendChild(el("p", null, cfg.intro || ""));
      box.appendChild(el("div", "quiz-meta", "총 " + cfg.questions.length + "문항 · 약 " + (cfg.minutes || 2) + "분 소요 · 결과는 저장되지 않습니다"));
      var btn = el("button", "btn btn-primary", "테스트 시작하기");
      btn.type = "button";
      btn.addEventListener("click", function () { idx = 0; picked = []; renderQ(); });
      box.appendChild(btn);
      mount.appendChild(box);
    }

    function renderQ() {
      mount.innerHTML = "";
      var total = cfg.questions.length;
      var q = cfg.questions[idx];

      var prog = el("div", "quiz-progress");
      var bar = el("i");
      prog.appendChild(bar);
      mount.appendChild(prog);
      mount.appendChild(el("div", "quiz-count", "Q" + (idx + 1) + " / " + total));
      mount.appendChild(el("div", "quiz-q", q.q));

      var wrap = el("div", "quiz-answers");
      q.a.forEach(function (ans) {
        var b = el("button", null, ans.t);
        b.type = "button";
        b.addEventListener("click", function () {
          picked[idx] = ans.v;
          idx++;
          if (idx >= total) renderResult();
          else renderQ();
        });
        wrap.appendChild(b);
      });
      mount.appendChild(wrap);

      if (idx > 0) {
        var back = el("button", "btn btn-ghost quiz-back", "← 이전 문항");
        back.type = "button";
        back.addEventListener("click", function () { idx--; renderQ(); });
        mount.appendChild(back);
      }
      requestAnimationFrame(function () {
        bar.style.width = Math.round(((idx) / total) * 100) + "%";
        requestAnimationFrame(function () {
          bar.style.width = Math.round(((idx + 1) / total) * 100) + "%";
        });
      });
    }

    function renderResult() {
      var key = cfg.compute(picked);
      var r = cfg.results[key];
      if (!r) { renderIntro(); return; }
      mount.innerHTML = "";
      var box = el("div", "result-card");
      box.appendChild(el("div", "emoji", r.emoji || "✨"));
      box.appendChild(el("div", "rtitle", r.title));
      if (r.sub) box.appendChild(el("div", "rsub", r.sub));
      box.appendChild(el("div", "rdesc", r.desc));
      if (r.traits && r.traits.length) {
        var ul = el("ul", "traits");
        r.traits.forEach(function (t) { ul.appendChild(el("li", null, t)); });
        box.appendChild(ul);
      }
      if (r.good || r.bad) {
        var pair = el("div", "pair");
        if (r.good) pair.appendChild(el("div", null, "<b>" + (cfg.goodLabel || "잘 맞는 유형") + "</b>" + r.good));
        if (r.bad) pair.appendChild(el("div", null, "<b>" + (cfg.badLabel || "부딪히기 쉬운 유형") + "</b>" + r.bad));
        box.appendChild(pair);
      }
      var actions = el("div", "actions", "");
      actions.style.marginTop = "18px";
      actions.style.display = "flex";
      actions.style.gap = "8px";
      actions.style.justifyContent = "center";
      actions.style.flexWrap = "wrap";

      var copyBtn = el("button", "btn btn-ghost copy-btn", "결과 복사");
      copyBtn.type = "button";
      var shareText = "[" + (cfg.title || document.title) + "]\n내 결과: " + r.title.replace(/<[^>]+>/g, "") + "\n" + location.href;
      if (window.CM) CM.bindCopy(copyBtn, function () { return shareText; });
      actions.appendChild(copyBtn);

      var retry = el("button", "btn btn-ghost", "다시 하기");
      retry.type = "button";
      retry.addEventListener("click", renderIntro);
      actions.appendChild(retry);
      box.appendChild(actions);
      mount.appendChild(box);

      if (typeof cfg.onResult === "function") cfg.onResult(key, r);
    }

    renderIntro();
  }

  window.CMQuiz = { start: start };
})();
