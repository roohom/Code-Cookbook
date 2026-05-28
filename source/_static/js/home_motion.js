(function () {
  "use strict";

  function initHomeMotion() {
    var home = document.querySelector(".cc-home-shell");
    if (!home) {
      return;
    }

    document.body.classList.add("cc-home-page");

    var canvas = home.querySelector(".cc-home-particles");
    if (!canvas) {
      return;
    }

    var ctx = canvas.getContext("2d");
    var particles = [];
    var width = 0;
    var height = 0;
    var dpr = 1;
    var startTime = 0;
    var frameId = 0;
    var pointer = { x: -9999, y: -9999 };
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var motionConfig = {
      desktopText: "roohom dong",
      mobileLines: ["roohom", "dong"],
      textTransform: "lowercase",
      textYRatioDesktop: 0.43,
      textYRatioMobile: 0.43,
      cellMin: 8,
      cellMax: 13,
      mobileCellMax: 10,
      cellWidthRatio: 0.009,
      cellGapRatio: 0.34,
      letterGapRatio: 1.15,
      lineGapRatio: 1.8,
      assembleDuration: 3500,
      settleDuration: 1500,
      settleKickX: 7.5,
      settleKickY: 5.2,
      settleShake: 8,
      idleDrift: 0.9
    };
    var glyphs = {
      " ": ["000", "000", "000", "000", "000", "000", "000"],
      d: ["00001", "00001", "01101", "10011", "10001", "10011", "01101"],
      g: ["00000", "01111", "10001", "10001", "01111", "00001", "11110"],
      h: ["10000", "10000", "10110", "11001", "10001", "10001", "10001"],
      m: ["00000", "00000", "11010", "10101", "10101", "10101", "10101"],
      n: ["00000", "00000", "10110", "11001", "10001", "10001", "10001"],
      o: ["00000", "00000", "01110", "10001", "10001", "10001", "01110"],
      r: ["00000", "00000", "10110", "11001", "10000", "10000", "10000"]
    };

    function normalizeMotionText(text) {
      if (motionConfig.textTransform === "lowercase") {
        return text.toLowerCase();
      }
      if (motionConfig.textTransform === "uppercase") {
        return text.toUpperCase();
      }
      return text;
    }

    function createParticles() {
      particles = [];
      var lines = width < 640 ? motionConfig.mobileLines : [motionConfig.desktopText];
      var cell = Math.max(
        motionConfig.cellMin,
        Math.min(
          width * motionConfig.cellWidthRatio,
          width < 640 ? motionConfig.mobileCellMax : motionConfig.cellMax
        )
      );
      var cellGap = cell * motionConfig.cellGapRatio;
      var letterGap = cell * motionConfig.letterGapRatio;
      var lineGap = cell * motionConfig.lineGapRatio;
      var lineHeight = cell * 7;
      var textHeight = lines.length * lineHeight + (lines.length - 1) * lineGap;
      var centerY =
        height *
        (width < 640 ? motionConfig.textYRatioMobile : motionConfig.textYRatioDesktop);
      var targets = [];
      var maxLaunchRadius = 1.5 * Math.sqrt(width * width + height * height);

      var topY = centerY - textHeight / 2;
      for (var lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        var text = normalizeMotionText(lines[lineIndex]);
        var textWidth = 0;

        for (var t = 0; t < text.length; t += 1) {
          textWidth += (glyphs[text[t]] || glyphs[" "])[0].length * cell + letterGap;
        }
        textWidth -= letterGap;

        var cursorX = (width - textWidth) / 2;
        var lineY = topY + lineIndex * (lineHeight + lineGap);
        for (var charIndex = 0; charIndex < text.length; charIndex += 1) {
          var glyph = glyphs[text[charIndex]] || glyphs[" "];
          for (var row = 0; row < glyph.length; row += 1) {
            for (var col = 0; col < glyph[row].length; col += 1) {
              if (glyph[row][col] !== "1") {
                continue;
              }
              targets.push({ x: cursorX + col * cell, y: lineY + row * cell });
              targets.push({ x: cursorX + col * cell + cellGap, y: lineY + row * cell });
              targets.push({ x: cursorX + col * cell, y: lineY + row * cell + cellGap });
              targets.push({
                x: cursorX + col * cell + cellGap,
                y: lineY + row * cell + cellGap
              });
            }
          }
          cursorX += glyph[0].length * cell + letterGap;
        }
      }

      for (var i = 0; i < targets.length; i += 1) {
        var targetX = targets[i].x;
        var targetY = targets[i].y;
        var launchAngle = Math.random() * Math.PI * 2;
        var launchRadius = maxLaunchRadius * (0.28 + Math.random() * 0.72);
        var startX = targetX + Math.cos(launchAngle) * launchRadius;
        var startY = targetY + Math.sin(launchAngle) * launchRadius;

        particles.push({
          x: reducedMotion ? targetX : startX,
          y: reducedMotion ? targetY : startY,
          startX: startX,
          startY: startY,
          targetX: targetX,
          targetY: targetY,
          vx: 0,
          vy: 0,
          char: Math.random() > 0.5 ? "1" : "0",
          size: width < 640 ? 6 : 8,
          alpha: 0.48 + Math.random() * 0.48,
          seed: Math.random() * Math.PI * 2,
          settled: false
        });
      }

      window.__ccParticleCount = particles.length;
    }

    function resize() {
      var rect = home.getBoundingClientRect();
      width = rect.width;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      startTime = Date.now();
      createParticles();
    }

    function move(event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }

    function leave() {
      pointer.x = -9999;
      pointer.y = -9999;
    }

    function animate() {
      ctx.clearRect(0, 0, width, height);
      ctx.font = (width < 640 ? 6 : 8) + "px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      var elapsed = Date.now() - startTime;
      var assembleDuration = motionConfig.assembleDuration;
      var assembling = elapsed < assembleDuration;
      var progress = Math.min(elapsed / assembleDuration, 1);
      var easedProgress = 1 - Math.pow(1 - progress, 3);
      var time = Date.now();

      for (var i = 0; i < particles.length; i += 1) {
        var p = particles[i];
        if (assembling) {
          p.x = p.startX + (p.targetX - p.startX) * easedProgress;
          p.y = p.startY + (p.targetY - p.startY) * easedProgress;
          p.vx = 0;
          p.vy = 0;
        } else if (!reducedMotion) {
          if (!p.settled) {
            p.vx += Math.sin(p.seed) * motionConfig.settleKickX;
            p.vy += Math.cos(p.seed * 1.3) * motionConfig.settleKickY;
            p.settled = true;
          }

          var dx = p.x - pointer.x;
          var dy = p.y - pointer.y;
          var distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 82 && distance > 0) {
            var force = ((82 - distance) / 82) * 8;
            p.vx += (dx / distance) * force;
            p.vy += (dy / distance) * force;
          }

          p.vx += (p.targetX - p.x) * 0.08;
          p.vy += (p.targetY - p.y) * 0.08;
          p.vx *= 0.92;
          p.vy *= 0.92;
        }

        p.x += p.vx;
        p.y += p.vy;

        var settleElapsed = Math.max(0, elapsed - assembleDuration);
        var settleShake =
          settleElapsed < motionConfig.settleDuration
            ? (1 - settleElapsed / motionConfig.settleDuration) * motionConfig.settleShake
            : 0;
        var drift = reducedMotion ? 0 : motionConfig.idleDrift + settleShake;
        var drawX = p.x + Math.sin(time * 0.012 + p.seed) * drift;
        var drawY = p.y + Math.cos(time * 0.01 + p.seed * 1.7) * drift * 0.72;

        ctx.fillStyle = "rgba(50, 240, 140, " + p.alpha + ")";
        ctx.fillText(p.char, drawX, drawY);
      }

      ctx.globalAlpha = 1;
      if (!reducedMotion) {
        frameId = window.requestAnimationFrame(animate);
      }
    }

    function initReveal() {
      var sections = document.querySelectorAll("[data-home-reveal]");
      if (!("IntersectionObserver" in window)) {
        sections.forEach(function (section) {
          section.classList.add("is-visible");
        });
        return;
      }

      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.16 }
      );

      sections.forEach(function (section) {
        observer.observe(section);
      });
    }

    resize();
    initReveal();
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseleave", leave, { passive: true });
    window.addEventListener("resize", resize);
    frameId = window.requestAnimationFrame(animate);

    window.addEventListener("beforeunload", function () {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHomeMotion);
  } else {
    initHomeMotion();
  }
})();
