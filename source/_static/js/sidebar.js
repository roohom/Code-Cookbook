(function () {
  "use strict";

  var NAV_SEL = ".wy-nav-side";
  var WRAP_SEL = ".wy-nav-content-wrap";
  var MIN_WIDTH = 260;
  var MAX_WIDTH = 700;

  function isHomePage() {
    var p = window.location.pathname;
    return (
      p === "/" ||
      p === "/index.html" ||
      (p.endsWith("/index.html") && p.split("/").length <= 3)
    );
  }

  function init() {
    var nav = document.querySelector(NAV_SEL);
    var wrap = document.querySelector(WRAP_SEL);
    if (!nav || !wrap) return;

    // Hide sidebar on homepage
    if (document.querySelector(".cc-home-shell") || isHomePage()) {
      nav.style.display = "none";
      wrap.style.marginLeft = "0";
      return;
    }

    // --- Toggle button ---
    document.body.classList.add("cc-has-sidebar-toggle");

    var btn = document.createElement("button");
    btn.className = "cc-sidebar-toggle";
    btn.setAttribute("aria-label", "Toggle sidebar");
    btn.textContent = "☰";
    wrap.appendChild(btn);

    btn.addEventListener("click", function () {
      var collapsed = nav.classList.toggle("cc-sidebar-collapsed");
      wrap.classList.toggle("cc-sidebar-collapsed", collapsed);
    });

    // --- Drag-to-resize handle ---
    var handle = document.createElement("div");
    handle.className = "cc-sidebar-resize-handle";
    nav.appendChild(handle);

    var dragging = false;
    var startX = 0;
    var startWidth = 0;

    handle.addEventListener("mousedown", function (e) {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startWidth = nav.offsetWidth;
      document.body.classList.add("cc-sidebar-resizing");
    });

    document.addEventListener("mousemove", function (e) {
      if (!dragging) return;
      var newWidth = startWidth + (e.clientX - startX);
      if (newWidth < MIN_WIDTH) newWidth = MIN_WIDTH;
      if (newWidth > MAX_WIDTH) newWidth = MAX_WIDTH;
      document.documentElement.style.setProperty("--cc-nav-width", newWidth + "px");
    });

    document.addEventListener("mouseup", function () {
      if (!dragging) return;
      dragging = false;
      document.body.classList.remove("cc-sidebar-resizing");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
