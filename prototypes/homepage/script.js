(() => {
  "use strict";

  /* ==========================================================================
     Footer year
     ========================================================================== */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ==========================================================================
     Navbar opacity on scroll
     ========================================================================== */
  const navbar = document.getElementById("navbar");
  const onScroll = () => {
    if (window.scrollY > 12) {
      navbar.classList.add("is-scrolled");
    } else {
      navbar.classList.remove("is-scrolled");
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ==========================================================================
     Scroll fade-in
     ========================================================================== */
  const fadeEls = document.querySelectorAll(".fade-in");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    fadeEls.forEach((el) => observer.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ==========================================================================
     Pricing toggle
     ========================================================================== */
  const pricingToggle = document.getElementById("pricingToggle");
  if (pricingToggle) {
    const monthlyLabel = document.querySelector('[data-period-label="monthly"]');
    const yearlyLabel = document.querySelector('[data-period-label="yearly"]');
    const priceAmount = document.querySelector("[data-price-monthly]");
    const pricePeriod = document.querySelector("[data-period-monthly]");

    const setPeriod = (yearly) => {
      pricingToggle.setAttribute("aria-checked", String(yearly));
      monthlyLabel.classList.toggle("is-active", !yearly);
      yearlyLabel.classList.toggle("is-active", yearly);

      if (priceAmount) {
        priceAmount.textContent = yearly
          ? priceAmount.dataset.priceYearly
          : priceAmount.dataset.priceMonthly;
      }
      if (pricePeriod) {
        pricePeriod.textContent = yearly
          ? pricePeriod.dataset.periodYearly
          : pricePeriod.dataset.periodMonthly;
      }
    };

    setPeriod(false);

    pricingToggle.addEventListener("click", () => {
      const isYearly = pricingToggle.getAttribute("aria-checked") === "true";
      setPeriod(!isYearly);
    });
  }

  /* ==========================================================================
     Chaos icons: floating, bouncing, mouse-repelling animation
     ========================================================================== */
  const chaosBox = document.getElementById("chaosBox");
  if (!chaosBox) return;

  const ICONS = [
    { label: "Notion", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h4M7 12h10M7 17h7"/></svg>' },
    { label: "GitHub", svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.6-4.04-1.6-.55-1.38-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.82 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3Z"/></svg>' },
    { label: "Slack", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="4" height="8" rx="2"/><rect x="9" y="14" width="4" height="8" rx="2"/><rect x="14" y="9" width="8" height="4" rx="2"/><rect x="2" y="9" width="8" height="4" rx="2"/></svg>' },
    { label: "VS Code", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' },
    { label: "Browser Tabs", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20M8 4v4M16 4v4"/></svg>' },
    { label: "Terminal", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>' },
    { label: "Text File", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>' },
    { label: "Bookmark", svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>' },
  ];

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ICON_SIZE = 44;

  const rand = (min, max) => Math.random() * (max - min) + min;

  const particles = ICONS.map((icon, i) => {
    const el = document.createElement("div");
    el.className = "chaos-icon";
    el.title = icon.label;
    el.innerHTML = icon.svg;
    chaosBox.appendChild(el);

    return {
      el,
      x: rand(0, 200),
      y: rand(0, 200),
      vx: rand(-0.35, 0.35) || 0.2,
      vy: rand(-0.35, 0.35) || 0.2,
      rotation: rand(0, 360),
      rotationSpeed: rand(-0.15, 0.15),
      baseScale: 1,
      pulsePhase: rand(0, Math.PI * 2),
      seed: i,
    };
  });

  let boxWidth = 0;
  let boxHeight = 0;
  let mouseX = -9999;
  let mouseY = -9999;
  let mouseActive = false;

  const measure = () => {
    boxWidth = chaosBox.clientWidth;
    boxHeight = chaosBox.clientHeight;
  };
  measure();
  window.addEventListener("resize", measure);

  chaosBox.addEventListener("mousemove", (e) => {
    const rect = chaosBox.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    mouseActive = true;
  });
  chaosBox.addEventListener("mouseleave", () => {
    mouseActive = false;
  });

  // Seed initial positions within bounds once we know the box size.
  particles.forEach((p) => {
    p.x = rand(0, Math.max(boxWidth - ICON_SIZE, 10));
    p.y = rand(0, Math.max(boxHeight - ICON_SIZE, 10));
  });

  const REPEL_RADIUS = 90;
  const REPEL_STRENGTH = 1.4;

  let lastTime = performance.now();

  const tick = (now) => {
    const dt = Math.min(now - lastTime, 48);
    lastTime = now;
    const t = now / 1000;

    const maxX = Math.max(boxWidth - ICON_SIZE, 0);
    const maxY = Math.max(boxHeight - ICON_SIZE, 0);

    particles.forEach((p) => {
      // Mouse repulsion
      if (mouseActive) {
        const cx = p.x + ICON_SIZE / 2;
        const cy = p.y + ICON_SIZE / 2;
        const dx = cx - mouseX;
        const dy = cy - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0.01) {
          const force = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_STRENGTH;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // Integrate position (frame-rate independent-ish, dt in ms)
      const step = dt / 16.6;
      p.x += p.vx * step;
      p.y += p.vy * step;

      // Damping so mouse impulses settle back down
      p.vx *= 0.98;
      p.vy *= 0.98;

      // Keep a minimum drift speed so icons don't stall
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed < 0.12) {
        p.vx += rand(-0.05, 0.05);
        p.vy += rand(-0.05, 0.05);
      }

      // Bounce off walls
      if (p.x <= 0) {
        p.x = 0;
        p.vx = Math.abs(p.vx);
      } else if (p.x >= maxX) {
        p.x = maxX;
        p.vx = -Math.abs(p.vx);
      }
      if (p.y <= 0) {
        p.y = 0;
        p.vy = Math.abs(p.vy);
      } else if (p.y >= maxY) {
        p.y = maxY;
        p.vy = -Math.abs(p.vy);
      }

      p.rotation += p.rotationSpeed * step;

      const scale = prefersReducedMotion
        ? 1
        : 0.92 + Math.sin(t * 1.4 + p.pulsePhase) * 0.08;

      p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${scale})`;
    });

    requestAnimationFrame(tick);
  };

  if (prefersReducedMotion) {
    // Lay icons out in a static grid instead of animating.
    particles.forEach((p, i) => {
      const cols = 4;
      const col = i % cols;
      const row = Math.floor(i / cols);
      p.el.style.transform = `translate(${col * 56 + 12}px, ${row * 56 + 12}px)`;
    });
  } else {
    requestAnimationFrame(tick);
  }
})();
