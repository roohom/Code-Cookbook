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
      fontFamily:
        '"JetBrains Mono", "Fira Code", "Cascadia Code", "SFMono-Regular", Menlo, Consolas, monospace',
      fontWeight: 760,
      fontSizeRatioDesktop: 0.122,
      fontSizeRatioMobile: 0.18,
      fontMinDesktop: 88,
      fontMaxDesktop: 150,
      fontMinMobile: 54,
      fontMaxMobile: 78,
      sampleStepDesktop: 6.2,
      sampleStepMobile: 5.4,
      maxParticlesDesktop: 1550,
      maxParticlesMobile: 1050,
      assembleDuration: 3500,
      settleDuration: 2100,
      settleKickX: 1.25,
      settleKickY: 0.9,
      settleShake: 1.2,
      idleDrift: 0.16
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
      var isMobile = width < 640;
      var lines = isMobile ? motionConfig.mobileLines : [motionConfig.desktopText];
      var fontSize = Math.max(
        isMobile ? motionConfig.fontMinMobile : motionConfig.fontMinDesktop,
        Math.min(
          width * (isMobile ? motionConfig.fontSizeRatioMobile : motionConfig.fontSizeRatioDesktop),
          isMobile ? motionConfig.fontMaxMobile : motionConfig.fontMaxDesktop
        )
      );
      var lineHeight = fontSize * 1.02;
      var textHeight = lines.length * lineHeight;
      var centerY =
        height *
        (isMobile ? motionConfig.textYRatioMobile : motionConfig.textYRatioDesktop);
      var targets = [];
      var maxLaunchRadius = 1.5 * Math.sqrt(width * width + height * height);
      var sampleStep = isMobile ? motionConfig.sampleStepMobile : motionConfig.sampleStepDesktop;
      var maxParticles = isMobile
        ? motionConfig.maxParticlesMobile
        : motionConfig.maxParticlesDesktop;
      var maskCanvas = document.createElement("canvas");
      var maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });

      maskCanvas.width = Math.ceil(width);
      maskCanvas.height = Math.ceil(Math.max(height, centerY + textHeight));
      maskCtx.fillStyle = "#fff";
      maskCtx.textAlign = "center";
      maskCtx.textBaseline = "middle";
      maskCtx.font =
        motionConfig.fontWeight + " " + fontSize + "px " + motionConfig.fontFamily;

      var topY = centerY - textHeight / 2;
      for (var lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        var text = normalizeMotionText(lines[lineIndex]);
        var lineY = topY + lineHeight * (lineIndex + 0.5);
        maskCtx.fillText(text, width / 2, lineY);
      }

      var imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      var data = imageData.data;
      for (var y = 0; y < maskCanvas.height; y += sampleStep) {
        for (var x = 0; x < maskCanvas.width; x += sampleStep) {
          var alphaIndex =
            (Math.floor(y) * maskCanvas.width + Math.floor(x)) * 4 + 3;
          if (data[alphaIndex] > 92) {
            targets.push({
              x: x + (Math.random() - 0.5) * 0.8,
              y: y + (Math.random() - 0.5) * 0.8
            });
          }
        }
      }

      if (targets.length > maxParticles) {
        var stride = targets.length / maxParticles;
        var compactTargets = [];
        for (var targetIndex = 0; targetIndex < maxParticles; targetIndex += 1) {
          compactTargets.push(targets[Math.floor(targetIndex * stride)]);
        }
        targets = compactTargets;
      }

      if (targets.length < maxParticles * 0.72 && sampleStep > 2.5) {
        var extraStep = sampleStep * 0.62;
        for (var extraY = extraStep / 2; extraY < maskCanvas.height; extraY += extraStep) {
          for (var extraX = extraStep / 2; extraX < maskCanvas.width; extraX += extraStep) {
            if (targets.length >= maxParticles) {
              break;
            }
            var extraAlphaIndex =
              (Math.floor(extraY) * maskCanvas.width + Math.floor(extraX)) * 4 + 3;
            if (data[extraAlphaIndex] > 120) {
              targets.push({
                x: extraX + (Math.random() - 0.5) * 0.65,
                y: extraY + (Math.random() - 0.5) * 0.65
              });
            }
          }
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
          size: isMobile ? 6 : 7,
          alpha: 0.54 + Math.random() * 0.42,
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
      ctx.font =
        (width < 640 ? 6 : 7) + "px ui-monospace, SFMono-Regular, Menlo, monospace";
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
            var force = ((82 - distance) / 82) * 4.2;
            p.vx += (dx / distance) * force;
            p.vy += (dy / distance) * force;
          }

          p.vx += (p.targetX - p.x) * 0.065;
          p.vy += (p.targetY - p.y) * 0.065;
          p.vx *= 0.84;
          p.vy *= 0.84;
        }

        p.x += p.vx;
        p.y += p.vy;

        var settleElapsed = Math.max(0, elapsed - assembleDuration);
        var settleShake =
          settleElapsed < motionConfig.settleDuration
            ? (1 - settleElapsed / motionConfig.settleDuration) * motionConfig.settleShake
            : 0;
        var drift = reducedMotion ? 0 : motionConfig.idleDrift + settleShake;
        var drawX = p.x + Math.sin(time * 0.0032 + p.seed) * drift;
        var drawY = p.y + Math.cos(time * 0.0026 + p.seed * 1.7) * drift * 0.55;

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
