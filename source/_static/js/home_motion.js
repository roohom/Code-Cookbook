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
    var mouseX = 0;
    var mouseY = 0;
    var targetX = 0;
    var targetY = 0;
    var pointerActive = false;
    var time = 0;
    var colors = ["#315cf6", "#4a6cf7", "#5866df", "#7658c7", "#b64fa9", "#e15b8f"];

    function randomColor() {
      return colors[Math.floor(Math.random() * colors.length)];
    }

    function randomBaseX() {
      var roll = Math.random();
      if (roll < 0.56) {
        return Math.pow(Math.random(), 1.75) * width;
      }
      if (roll < 0.82) {
        return width * (0.22 + Math.random() * 0.48);
      }
      return width * (0.7 + Math.random() * 0.3);
    }

    function createParticles() {
      particles = [];
      var count = width < 760 ? 190 : 390;
      var centerX = width * 0.53;
      var centerY = height * 0.52;

      for (var i = 0; i < count; i += 1) {
        var baseX = randomBaseX();
        var baseY = Math.random() * height;
        var gapX = (baseX - centerX) / Math.max(width, 1);
        var gapY = (baseY - centerY) / Math.max(height, 1);
        var heroGap = Math.exp(-(gapX * gapX * 12 + gapY * gapY * 8));

        if (Math.random() < heroGap * 0.74) {
          baseX = baseX < centerX ? baseX - width * 0.16 : baseX + width * 0.16;
          baseY += (Math.random() > 0.5 ? 1 : -1) * height * 0.1;
        }

        var depth = 0.35 + Math.random() * 1.25;
        particles.push({
          baseX: baseX,
          baseY: baseY,
          x: baseX,
          y: baseY,
          vx: 0,
          vy: 0,
          size: (0.8 + Math.random() * 1.8) * depth,
          length: (3.5 + Math.random() * 8) * depth,
          depth: depth,
          angle: -0.45 + Math.random() * 1.1,
          seed: Math.random() * Math.PI * 2,
          drift: 0.35 + Math.random() * 0.85,
          alpha: 0.12 + Math.random() * 0.34,
          color: randomColor()
        });
      }
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
      targetX = mouseX = width * 0.5;
      targetY = mouseY = height * 0.5;
      createParticles();
    }

    function move(event) {
      pointerActive = true;
      targetX = event.clientX;
      targetY = event.clientY;
    }

    function leave() {
      pointerActive = false;
      targetX = width * 0.5;
      targetY = height * 0.5;
    }

    function drawParticle(p, x, y, wave, influence) {
      var angle = p.angle + Math.sin(time * 0.6 + p.seed) * 0.16 + influence * 0.75;
      var len = p.length * (0.72 + Math.abs(wave) * 0.55 + influence * 0.65);
      var radius = p.size * (0.62 + Math.abs(wave) * 0.25);
      var x1 = x - Math.cos(angle) * len * 0.5;
      var y1 = y - Math.sin(angle) * len * 0.5;
      var x2 = x + Math.cos(angle) * len * 0.5;
      var y2 = y + Math.sin(angle) * len * 0.5;

      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, radius);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    function animate() {
      time += 0.016;
      mouseX += (targetX - mouseX) * 0.08;
      mouseY += (targetY - mouseY) * 0.08;

      ctx.clearRect(0, 0, width, height);

      for (var i = 0; i < particles.length; i += 1) {
        var p = particles[i];
        var wave = Math.sin(time * (0.85 + p.drift) + p.seed);
        var sway = Math.cos(time * (0.48 + p.drift * 0.28) + p.seed * 1.7);
        var naturalX = p.baseX + wave * (7 + p.depth * 8) + sway * (2 + p.depth * 5);
        var naturalY = p.baseY + sway * (8 + p.depth * 9) + Math.sin(time * 0.42 + p.seed) * 4;

        var dx = naturalX - mouseX;
        var dy = naturalY - mouseY;
        var distance = Math.sqrt(dx * dx + dy * dy) || 1;
        var radius = width < 760 ? 135 : 210;
        var influence = pointerActive ? Math.max(0, 1 - distance / radius) : 0;
        var ripple = Math.sin(distance * 0.055 - time * 4.6 + p.seed) * influence;
        var push = influence * influence * (14 + p.depth * 24);
        var ripplePush = ripple * (10 + p.depth * 16);
        var targetParticleX = naturalX + (dx / distance) * (push + ripplePush);
        var targetParticleY = naturalY + (dy / distance) * (push + ripplePush) + ripple * 10;

        p.vx += (targetParticleX - p.x) * 0.035;
        p.vy += (targetParticleY - p.y) * 0.035;
        p.vx *= 0.84;
        p.vy *= 0.84;
        p.x += p.vx;
        p.y += p.vy;

        ctx.globalAlpha = p.alpha * (0.6 + Math.abs(wave) * 0.32 + influence * 0.32);
        drawParticle(p, p.x, p.y, wave, influence);
      }

      ctx.globalAlpha = 1;
      window.requestAnimationFrame(animate);
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
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerleave", leave, { passive: true });
    window.addEventListener("resize", resize);
    window.requestAnimationFrame(animate);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHomeMotion);
  } else {
    initHomeMotion();
  }
})();
