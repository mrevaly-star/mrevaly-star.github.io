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
  if (giscusBox) {
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
    window.addEventListener("message", function (e) {
      if (e.origin !== "https://giscus.app") return;
      var loading = document.querySelector(".giscus-loading");
      if (loading) loading.parentNode.removeChild(loading);
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
