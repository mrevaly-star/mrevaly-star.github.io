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
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
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
    });
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
