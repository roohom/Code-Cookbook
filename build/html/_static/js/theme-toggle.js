(function () {
  "use strict";

  var STORAGE_KEY = "cc-theme";

  var SUN_SVG =
    '<svg viewBox="0 0 24 24" class="cc-icon-sun">' +
    '<path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0-3a1 1 0 01-1-1V1a1 1 0 112 0v2a1 1 0 01-1 1zm0 18a1 1 0 01-1-1v-2a1 1 0 112 0v2a1 1 0 01-1 1zm9-9h-2a1 1 0 110-2h2a1 1 0 110 2zM6 13H4a1 1 0 110-2h2a1 1 0 110 2zm12.07-6.48a1 1 0 01-.7-.29l-1.42-1.42a1 1 0 111.41-1.41l1.42 1.41a1 1 0 01-.71 1.71zM7.05 19.36a1 1 0 01-.7-.29l-1.42-1.42a1 1 0 011.41-1.41l1.42 1.41a1 1 0 01-.71 1.71zM4.93 7.05a1 1 0 01-.71-.3 1 1 0 010-1.41l1.42-1.42a1 1 0 011.41 1.41L5.63 6.76a1 1 0 01-.7.29zm14.13 12.73a1 1 0 01-.71-.29l-1.41-1.42a1 1 0 011.41-1.41l1.42 1.41a1 1 0 01-.71 1.71z"/>' +
    "</svg>";

  var MOON_SVG =
    '<svg viewBox="0 0 24 24" class="cc-icon-moon">' +
    '<path d="M21.64 13a1 1 0 00-1.05-.14 8.05 8.05 0 01-3.37.73A8.15 8.15 0 019.08 5.49a8.59 8.59 0 01 .26-2 1 1 0 00-.31-1 1 1 0 00-1.05-.15 10 10 0 1011.66 9.66z"/>' +
    "</svg>";

  function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    document.documentElement.classList.toggle("cc-dark", theme === "dark");
  }

  function init() {
    var saved = localStorage.getItem(STORAGE_KEY);
    var theme = saved || getSystemTheme();
    applyTheme(theme);

    var btn = document.createElement("button");
    btn.className = "cc-theme-toggle";
    btn.setAttribute("aria-label", "切换主题");
    btn.innerHTML = SUN_SVG + MOON_SVG;
    document.body.appendChild(btn);

    btn.addEventListener("click", function () {
      var isDark = document.documentElement.classList.toggle("cc-dark");
      var newTheme = isDark ? "dark" : "light";
      localStorage.setItem(STORAGE_KEY, newTheme);
    });

    // Sync with system theme when no manual override
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function (e) {
        if (!localStorage.getItem(STORAGE_KEY)) {
          applyTheme(e.matches ? "dark" : "light");
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
