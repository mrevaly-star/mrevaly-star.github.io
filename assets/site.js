(function () {
  "use strict";
  var root = document.body.getAttribute("data-root") || "./";

  var navToggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector("[data-site-nav]");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    var closeNav = function () {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    };
    nav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeNav); });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && !navToggle.contains(e.target)) closeNav();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
  }

  document.querySelectorAll("pre > code").forEach(function (code) {
    var pre = code.parentElement;
    if (!pre || pre.querySelector(".copy-btn")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code");
    pre.style.position = "relative";
    pre.appendChild(btn);
    btn.addEventListener("click", function () {
      var text = code.textContent || "";
      var done = function () {
        btn.textContent = "Copied!";
        setTimeout(function () { btn.textContent = "Copy"; }, 1500);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else {
        var ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
  });

  var STORAGE_KEY = "bb-theme-mode";
  var darkToggle = document.querySelector("[data-dark-toggle]");
  try {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") document.documentElement.setAttribute("data-theme", stored);
  } catch (e) {}
  if (darkToggle) {
    darkToggle.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme");
      var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      var effectiveDark = current ? current === "dark" : prefersDark;
      var next = effectiveDark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
      sendGiscusTheme();
    });
  }

  var giscusBox = document.querySelector(".giscus[data-repo]");
  function giscusTheme() {
    var mode = giscusBox && giscusBox.getAttribute("data-mode");
    var dark;
    if (mode === "dark" || mode === "light") {
      dark = mode === "dark";
    } else {
      var current = document.documentElement.getAttribute("data-theme");
      dark = current ? current === "dark" : !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
    // Our own stylesheet only exists on the published site; previews fall back to giscus's built-in look.
    if (location.protocol === "https:" || location.protocol === "http:") {
      try { return new URL(root + "assets/giscus" + (dark ? "-dark" : "") + ".css", location.href).href; } catch (e) {}
    }
    return dark ? "dark" : "light";
  }
  function sendGiscusTheme() {
    var frame = document.querySelector("iframe.giscus-frame");
    if (frame) frame.contentWindow.postMessage({ giscus: { setConfig: { theme: giscusTheme() } } }, "https://giscus.app");
  }
  // The comments box is a whole app of its own: load it only when the reader
  // scrolls near it, so it doesn't compete with the post itself. Straight away
  // when coming back from signing in (?giscus=…) or following a #comments link.
  function loadGiscus() {
    if (!giscusBox || giscusBox.getAttribute("data-loaded")) return;
    giscusBox.setAttribute("data-loaded", "1");
    var gs = document.createElement("script");
    gs.src = "https://giscus.app/client.js";
    gs.async = true;
    gs.crossOrigin = "anonymous";
    var gAttrs = {
      "data-repo": giscusBox.getAttribute("data-repo"),
      "data-repo-id": giscusBox.getAttribute("data-repo-id"),
      "data-category": giscusBox.getAttribute("data-category"),
      "data-category-id": giscusBox.getAttribute("data-category-id"),
      "data-mapping": "pathname",
      "data-strict": "0",
      "data-reactions-enabled": "1",
      "data-emit-metadata": "0",
      "data-input-position": "top",
      "data-lang": "en",
      "data-theme": giscusTheme()
    };
    Object.keys(gAttrs).forEach(function (k) { gs.setAttribute(k, gAttrs[k] || ""); });
    giscusBox.parentNode.appendChild(gs);
  }
  if (giscusBox) {
    var comeBack = /[?&]giscus=/.test(location.search) || location.hash === "#comments";
    if (comeBack || !("IntersectionObserver" in window)) {
      loadGiscus();
    } else {
      var io = new IntersectionObserver(function (entries) {
        if (entries.some(function (en) { return en.isIntersecting; })) { io.disconnect(); loadGiscus(); }
      }, { rootMargin: "800px 0px" });
      io.observe(giscusBox);
    }
    // The "sign in to comment" hint is only for visitors who haven't signed in to
    // giscus yet. giscus keeps its sign-in in this site's localStorage (and drops
    // it again when it expires), so re-check whenever the comments frame reports in.
    var hint = document.querySelector(".comments-hint");
    function updateCommentsHint() {
      if (!hint) return;
      var signedIn = false;
      try { signedIn = !!localStorage.getItem("giscus-session"); } catch (e) {}
      hint.hidden = signedIn;
    }
    updateCommentsHint();
    window.addEventListener("message", function (e) {
      if (e.origin !== "https://giscus.app") return;
      var loading = document.querySelector(".giscus-loading");
      if (loading) loading.parentNode.removeChild(loading);
      updateCommentsHint();
    });
  }

  var shareBox = document.querySelector("[data-share]");
  if (shareBox) {
    var shareUrl = window.location.href;
    var shareTitle = document.title;
    var networks = {
      x: "https://twitter.com/intent/tweet?url=" + encodeURIComponent(shareUrl) + "&text=" + encodeURIComponent(shareTitle),
      facebook: "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(shareUrl),
      linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(shareUrl)
    };
    shareBox.querySelectorAll("[data-share-network]").forEach(function (a) {
      var net = a.getAttribute("data-share-network");
      if (net && networks[net]) a.setAttribute("href", networks[net]);
    });
    var copyBtn = shareBox.querySelector("[data-share-copy]");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var done = function () {
          copyBtn.classList.add("is-copied");
          copyBtn.setAttribute("aria-label", "Link copied");
          setTimeout(function () {
            copyBtn.classList.remove("is-copied");
            copyBtn.setAttribute("aria-label", "Copy link");
          }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(shareUrl).then(done, done);
        } else {
          var ta = document.createElement("textarea");
          ta.value = shareUrl; ta.style.position = "fixed"; ta.style.opacity = "0";
          document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); } catch (e) {}
          document.body.removeChild(ta); done();
        }
      });
    }
  }

  var searchInputs = document.querySelectorAll("[data-search-input]");
  if (searchInputs.length) {
    var searchDataPromise = fetch(root + "search.json").then(function (r) { return r.json(); }).catch(function () { return []; });
    searchInputs.forEach(function (input) {
      var resultsEl = document.querySelector(input.getAttribute("data-search-input") || "[data-search-results]") || document.querySelector("[data-search-results]");
      function render(items, query) {
        if (!resultsEl) return;
        if (!query) { resultsEl.innerHTML = ""; resultsEl.hidden = true; return; }
        resultsEl.hidden = false;
        if (!items.length) { resultsEl.innerHTML = '<p class="search-empty">No results for "' + query.replace(/</g, "&lt;") + '"</p>'; return; }
        resultsEl.innerHTML = items.slice(0, 20).map(function (item) {
          var href = root + String(item.url || "").replace(/^\//, "");
          var title = String(item.title || "").replace(/</g, "&lt;");
          var excerpt = String(item.excerpt || "").replace(/</g, "&lt;");
          return '<a class="search-result" href="' + href + '"><strong>' + title + "</strong><span>" + excerpt + "</span></a>";
        }).join("");
      }
      input.addEventListener("input", function () {
        var q = input.value.trim().toLowerCase();
        searchDataPromise.then(function (data) {
          var items = !q ? [] : data.filter(function (item) {
            return (item.title + " " + item.excerpt + " " + (item.tags || []).join(" ")).toLowerCase().indexOf(q) !== -1;
          });
          render(items, q);
        });
      });
    });
  }
})();

(function () {
  "use strict";
  var URL = "https://api.open-meteo.com/v1/forecast?latitude=23.71&longitude=90.407" +
    "&current=weather_code,is_day&timezone=auto";
  var KEY = "bb-weather";
  var MAX_AGE = 30 * 60 * 1000;

  // WMO codes -> the handful of looks the stylesheet knows about
  function bucket(code) {
    if (code >= 95) return "storm";
    if (code >= 71 && code <= 77) return "snow";
    if (code === 85 || code === 86) return "snow";
    if (code >= 51 && code <= 67) return "rain";
    if (code >= 80 && code <= 82) return "rain";
    if (code === 45 || code === 48) return "fog";
    if (code >= 2 && code <= 3) return "cloud";
    if (code >= 0 && code <= 1) return "clear";
    return "";
  }

  function paint(code, isDay) {
    var kind = bucket(code);
    if (!kind) return;
    var html = document.documentElement;
    html.setAttribute("data-weather", kind);
    html.setAttribute("data-daylight", isDay ? "day" : "night");
    var layer = document.querySelector(".weather-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "weather-layer";
      layer.setAttribute("aria-hidden", "true");
      document.body.insertBefore(layer, document.body.firstChild);
    }
    if (kind === "rain" || kind === "storm") beads(layer, kind === "storm");
  }

  // Rain on a window, simulated rather than scripted.
  //
  // A bead is held by surface tension along its contact line, which grows with
  // radius, while gravity grows with volume. So there is a critical radius
  // above which it lets go — small beads cling forever, fat ones run. A runner
  // sheds water as it goes (that is the trail), shrinks, and re-pins when it
  // drops back under the threshold. If it passes over a clinging bead it
  // absorbs it, jumps in size and speeds up. Condensation slowly fattens the
  // clinging beads, so the glass keeps producing new runners.
  function beads(layer, heavy) {
    if (layer.querySelector(".wx-bead")) return;
    var still = false;
    try { still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

    var H = function () { return window.innerHeight || 800; };
    var W = function () { return window.innerWidth || 1024; };
    var GRAVITY = 1400;          // px/s², tuned so a run reads at screen scale
    var DRAG = 3.2;              // viscous resistance, per second
    var SLIP = 0.5;              // once moving, the contact line holds far less
                                 // back than it did at rest (stick-slip)
    var SHED = 0.0035;           // radius lost per px travelled, leaves the trail
    var list = [];
    var frag = document.createDocumentFragment();
    var count = Math.min(heavy ? 150 : 110, Math.round(Math.max(320, W()) / (heavy ? 8 : 11)));

    // The spread of sizes is the whole look, and it has to survive: condensation
    // otherwise walks every bead up to its own critical radius and the whole
    // population ends up the same size.
    function seed(b, fresh) {
      var big = Math.random();
      b.r = 1.4 + Math.pow(big, 1.45) * (heavy ? 12 : 10);
      // each bead sits on its own patch of glass — some collect water quickly,
      // many are nearly dry and stay small for good
      b.grow = Math.random() * Math.random() * (heavy ? 0.85 : 0.5);
      b.cap = b.r + Math.random() * Math.random() * 11;  // as fat as this one can get
      // a wide spread of thresholds, so some fat beads cling while smaller ones let go
      b.crit = (heavy ? 3.2 : 3.8) + Math.random() * Math.random() * 9;
      b.v = 0; b.run = false; b.trail = 0;
      b.el.style.setProperty("--o", (0.32 + big * 0.5).toFixed(2));
      if (fresh) { b.x = Math.random() * W(); b.y = -20 - Math.random() * H() * 0.4; }
    }

    for (var i = 0; i < count; i++) {
      var el = document.createElement("i");
      el.className = "wx-bead";
      var b = { el: el, x: Math.random() * W(), y: Math.random() * H(), r: 2, v: 0, run: false, crit: 6, grow: 0, cap: 8, trail: 0 };
      seed(b, false);
      size(b);
      place(b);
      list.push(b);
      frag.appendChild(el);
    }
    layer.appendChild(frag);
    if (still) return;           // beads cling, nothing runs

    function size(b) {
      b.el.style.setProperty("--d", b.r.toFixed(2) + "px");
      if (b.r > 4.5) b.el.classList.add("wx-bead--lens"); else b.el.classList.remove("wx-bead--lens");
    }
    function place(b) {
      b.el.style.transform = "translate3d(" + b.x.toFixed(1) + "px," + b.y.toFixed(1) + "px,0)";
      b.el.style.setProperty("--trail", b.trail.toFixed(1) + "px");
    }

    var last = 0;
    var frame = 0;
    function tick(now) {
      frame = requestAnimationFrame(tick);
      if (!last) { last = now; return; }
      var dt = Math.min(0.05, (now - last) / 1000);   // cap, so a backgrounded tab doesn't jump
      last = now;
      var h = H();

      for (var i = 0; i < list.length; i++) {
        var b = list[i];

        if (!b.run) {
          b.r = Math.min(b.r + b.grow * dt, b.cap);    // condensation, up to this bead's own ceiling
          if (b.r > b.crit) { b.run = true; } else { if (Math.random() < 0.02) size(b); continue; }
        }

        // gravity, less what surface tension still holds back, less drag.
        // The moving threshold is lower than the one that pinned it, which is
        // why a bead sits still for ages and then goes all at once.
        var hold = b.crit * SLIP;
        var accel = GRAVITY * (1 - hold / b.r) - DRAG * b.v;
        b.v = Math.max(0, b.v + accel * dt);
        var step = b.v * dt;
        b.y += step;
        b.trail = Math.min(b.trail + step, h * 0.55);
        b.r -= SHED * step;                            // water left on the glass

        // swallow anything it runs over
        for (var j = 0; j < list.length; j++) {
          var o = list[j];
          if (o === b || o.run) continue;
          if (Math.abs(o.x - b.x) < b.r + o.r && o.y > b.y - step - o.r && o.y < b.y + b.r) {
            b.r = Math.cbrt(b.r * b.r * b.r + o.r * o.r * o.r);
            seed(o, true);
            size(o); place(o);
          }
        }

        if (b.r < b.crit * SLIP * 0.92) { b.run = false; b.v = 0; b.trail *= 0.4; }   // dries out and re-pins
        if (b.y > h + 40) { seed(b, true); }

        size(b);
        place(b);
      }
    }
    frame = requestAnimationFrame(tick);

    // don't simulate a page nobody is looking at
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else if (!frame) { last = 0; frame = requestAnimationFrame(tick); }
    });
  }

  function cached() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var v = JSON.parse(raw);
      return v && Date.now() - v.at < MAX_AGE ? v : null;
    } catch (e) { return null; }
  }

  var hit = cached();
  if (hit) { paint(hit.code, hit.day); return; }

  fetch(URL)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      var c = d && d.current;
      if (!c || typeof c.weather_code !== "number") return;
      try { localStorage.setItem(KEY, JSON.stringify({ code: c.weather_code, day: c.is_day === 1, at: Date.now() })); } catch (e) {}
      paint(c.weather_code, c.is_day === 1);
    })
    .catch(function () { /* no weather, no layer — the page is fine without it */ });
})();
