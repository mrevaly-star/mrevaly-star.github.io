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
    if (kind === "rain" || kind === "storm") drops(layer, kind === "storm");
  }

  // Real rain is irregular, so every drop gets its own position, length, speed
  // and opacity. Still pages (reduced motion) get none of this.
  function drops(layer, heavy) {
    if (layer.querySelector(".wx-drop")) return;
    try {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch (e) {}
    var wide = Math.max(320, window.innerWidth || 1024);
    var count = Math.min(heavy ? 240 : 180, Math.round(wide / (heavy ? 5 : 7)));
    var tilt = heavy ? 15 : 11;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var near = Math.random();                       // 0 = far away, 1 = close
      var dur = (heavy ? 0.42 : 0.62) + (1 - near) * (heavy ? 0.5 : 0.75);
      var d = document.createElement("i");
      d.className = "wx-drop";
      d.style.setProperty("--x", (Math.random() * 108 - 4).toFixed(2) + "vw");
      d.style.setProperty("--len", (14 + near * (heavy ? 58 : 40)).toFixed(0) + "px");
      d.style.setProperty("--w", (0.9 + near * 0.9).toFixed(2) + "px");
      d.style.setProperty("--o", (0.16 + near * (heavy ? 0.46 : 0.34)).toFixed(2));
      d.style.setProperty("--dur", dur.toFixed(2) + "s");
      d.style.setProperty("--delay", (-Math.random() * dur).toFixed(2) + "s");
      // a couple of degrees either way, so the drops aren't all on one rail
      d.style.setProperty("--tilt", (tilt + (Math.random() * 4 - 2)).toFixed(1) + "deg");
      d.style.setProperty("--drift", (8 + near * 14).toFixed(0) + "vh");
      frag.appendChild(d);
    }
    // a few splashes where the drops land
    var splashes = heavy ? 16 : 10;
    for (var j = 0; j < splashes; j++) {
      var sp = document.createElement("i");
      sp.className = "wx-splash";
      sp.style.left = (Math.random() * 96 + 2).toFixed(2) + "vw";
      sp.style.setProperty("--w", (9 + Math.random() * 13).toFixed(0) + "px");
      sp.style.setProperty("--dur", (1.1 + Math.random() * 1.1).toFixed(2) + "s");
      sp.style.setProperty("--delay", (-Math.random() * 2).toFixed(2) + "s");
      frag.appendChild(sp);
    }
    layer.appendChild(frag);
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
