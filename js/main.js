/* =========================================================
   MD Barbearia — main.js
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* ---------- Ano no rodapé ---------- */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Scroll: progress bar, navbar, voltar ao topo ---------- */
  var progress = $("#progressBar");
  var navbar = $("#navbar");
  var backTop = $("#backTop");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    navbar.classList.toggle("scrolled", y > 80);
    backTop.classList.toggle("show", y > 400);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  backTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------- Smooth scroll para âncoras ---------- */
  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      var top = target.getBoundingClientRect().top + window.pageYOffset - (id === "#inicio" ? 0 : 64);
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---------- Menu mobile ---------- */
  var burger = $("#hamburger");
  var navLinks = $("#navLinks");

  function closeMenu() {
    burger.classList.remove("active");
    navLinks.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir menu");
    document.body.style.overflow = "";
  }
  burger.addEventListener("click", function () {
    var open = !navLinks.classList.contains("open");
    burger.classList.toggle("active", open);
    navLinks.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    document.body.style.overflow = open ? "hidden" : "";
  });
  $$("a", navLinks).forEach(function (a) { a.addEventListener("click", closeMenu); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  /* ---------- Reveal com IntersectionObserver + stagger ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      // agrupa os elementos que entram juntos para escalonar 100ms entre eles
      var batch = entries.filter(function (en) { return en.isIntersecting; });
      batch.forEach(function (en, i) {
        var el = en.target;
        var delay = el.classList.contains("stagger") ? i * 100 : i * 60;
        el.style.transitionDelay = delay + "ms";
        el.classList.add("visible");
        // remove o delay após a entrada para não atrasar o hover
        setTimeout(function () { el.style.transitionDelay = ""; }, delay + 900);
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Lightbox da galeria ---------- */
  var items = $$(".gallery-item");
  var lb = $("#lightbox");
  var lbImg = $("#lbImg");
  var current = 0;
  var lastFocus = null;

  function show(i) {
    current = (i + items.length) % items.length;
    var img = $("img", items[current]);
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add("open"); });
    document.body.style.overflow = "hidden";
    $("#lbClose").focus();
  }
  function closeLb() {
    lb.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(function () { lb.hidden = true; }, 300);
    if (lastFocus) lastFocus.focus();
  }
  items.forEach(function (item, i) { item.addEventListener("click", function () { openLb(i); }); });
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", function () { show(current - 1); });
  $("#lbNext").addEventListener("click", function () { show(current + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });

  /* =========================================================
     HERO — Partículas douradas + tesoura interativa
     ========================================================= */
  var hero = $("#inicio");
  var canvas = $("#particles");
  var ctx = canvas.getContext("2d");
  var glow = $("#heroGlow");
  var svg = $("#scissors");
  var wrap = $("#scissorsWrap");
  var bladeA = $("#bladeA");
  var bladeB = $("#bladeB");

  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var dust = [];
  var hairs = [];

  function resize() {
    var r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(Math.min(90, (W * H) / 16000));
    dust = [];
    for (var i = 0; i < n; i++) dust.push(newDust(true));
  }
  function newDust(anyY) {
    return {
      x: Math.random() * W,
      y: anyY ? Math.random() * H : H + 10,
      r: Math.random() * 1.6 + 0.3,
      vy: -(Math.random() * 0.35 + 0.08),
      vx: (Math.random() - 0.5) * 0.15,
      a: Math.random() * 0.6 + 0.2,
      tw: Math.random() * Math.PI * 2
    };
  }
  window.addEventListener("resize", resize);
  resize();

  // estado da tesoura
  var mouse = { x: W * 0.7, y: H * 0.5, inside: false };
  var phase = 0;          // fase do "corte"
  var openAngle = 18;     // abertura atual (graus)
  var tiltX = 0, tiltY = 0, rot = 0;
  var lastMove = 0;
  var lastClosed = false;

  function onPointer(x, y) {
    var r = hero.getBoundingClientRect();
    var nx = x - r.left, ny = y - r.top;
    var dx = nx - mouse.x, dy = ny - mouse.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    phase += Math.min(dist, 80) * 0.045; // quanto mais o cursor anda, mais a tesoura corta
    mouse.x = nx; mouse.y = ny; mouse.inside = true;
    lastMove = performance.now();
    glow.style.opacity = "1";
    glow.style.transform = "translate(" + (nx - 320) + "px," + (ny - 320) + "px)";
  }
  hero.addEventListener("mousemove", function (e) { onPointer(e.clientX, e.clientY); });
  hero.addEventListener("touchmove", function (e) {
    if (e.touches[0]) onPointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  hero.addEventListener("mouseleave", function () { mouse.inside = false; glow.style.opacity = "0"; });

  // posição da ponta da tesoura em coordenadas do hero (para soltar fios de cabelo)
  function tipPoint() {
    var sr = svg.getBoundingClientRect();
    var hr = hero.getBoundingClientRect();
    var s = sr.width / 600;
    var cx = sr.left - hr.left + 300 * s, cy = sr.top - hr.top + 300 * s;
    var a = rot * Math.PI / 180;
    var len = 230 * s;
    return { x: cx + Math.cos(a) * len, y: cy + Math.sin(a) * len, s: s };
  }

  function spawnHairs() {
    var p = tipPoint();
    for (var i = 0; i < 7; i++) {
      hairs.push({
        x: p.x + (Math.random() - 0.5) * 60 * p.s,
        y: p.y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 1.6,
        vy: Math.random() * -1.2,
        len: Math.random() * 12 + 6,
        ang: Math.random() * Math.PI,
        va: (Math.random() - 0.5) * 0.15,
        life: 1,
        gold: Math.random() < 0.35
      });
    }
  }

  var heroVisible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { heroVisible = en[0].isIntersecting; }).observe(hero);
  }

  function frame(t) {
    requestAnimationFrame(frame);
    if (!heroVisible) return;

    // --- tesoura ---
    var idle = t - lastMove > 1400;
    if (idle) phase += 0.035;               // corte automático quando parado (e no mobile)
    var cycle = 0.5 + 0.5 * Math.sin(phase); // 0 fechada · 1 aberta
    var target = 2 + cycle * 26;
    openAngle += (target - openAngle) * 0.25;

    var closed = cycle < 0.08;
    if (closed && !lastClosed && !reduceMotion) spawnHairs();
    lastClosed = closed;

    bladeA.style.transform = "rotate(" + (-openAngle) + "deg)";
    bladeB.style.transform = "rotate(" + openAngle + "deg)";

    // inclina a tesoura na direção do cursor
    var wr = wrap.getBoundingClientRect();
    var hr = hero.getBoundingClientRect();
    var cx = wr.left - hr.left + wr.width / 2;
    var cy = wr.top - hr.top + wr.height / 2;
    var tx = mouse.inside ? (mouse.x - cx) / W : Math.sin(t / 2600) * 0.12;
    var ty = mouse.inside ? (mouse.y - cy) / H : Math.cos(t / 3100) * 0.1;
    tiltX += (ty * -22 - tiltX) * 0.06;
    tiltY += (tx * 26 - tiltY) * 0.06;
    rot += ((mouse.inside ? Math.atan2(mouse.y - cy, mouse.x - cx) * 57.3 * 0.18 : -8 + Math.sin(t / 2000) * 4) - rot) * 0.05;
    svg.style.transform = "perspective(900px) rotateX(" + tiltX.toFixed(2) + "deg) rotateY(" + tiltY.toFixed(2) + "deg) rotate(" + rot.toFixed(2) + "deg)";

    // --- partículas ---
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < dust.length; i++) {
      var d = dust[i];
      d.x += d.vx; d.y += d.vy; d.tw += 0.03;
      if (mouse.inside) {
        var ddx = d.x - mouse.x, ddy = d.y - mouse.y, dd = ddx * ddx + ddy * ddy;
        if (dd < 14000) { d.x += ddx * 0.004; d.y += ddy * 0.004; }
      }
      if (d.y < -10) dust[i] = newDust(false);
      var alpha = d.a * (0.6 + 0.4 * Math.sin(d.tw));
      ctx.beginPath();
      ctx.fillStyle = "rgba(226,187,107," + alpha.toFixed(3) + ")";
      ctx.shadowColor = "rgba(201,168,76,0.8)";
      ctx.shadowBlur = d.r * 4;
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // fios de cabelo caindo
    for (var j = hairs.length - 1; j >= 0; j--) {
      var h = hairs[j];
      h.vy += 0.06; h.vx *= 0.98;
      h.x += h.vx; h.y += h.vy; h.ang += h.va;
      h.life -= 0.011;
      if (h.life <= 0 || h.y > H) { hairs.splice(j, 1); continue; }
      ctx.save();
      ctx.translate(h.x, h.y);
      ctx.rotate(h.ang);
      ctx.strokeStyle = h.gold ? "rgba(226,187,107," + h.life + ")" : "rgba(210,210,210," + (h.life * 0.7) + ")";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-h.len / 2, 0);
      ctx.quadraticCurveTo(0, h.len * 0.18, h.len / 2, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  if (reduceMotion) {
    bladeA.style.transform = "rotate(-16deg)";
    bladeB.style.transform = "rotate(16deg)";
  } else {
    requestAnimationFrame(frame);
  }
})();
