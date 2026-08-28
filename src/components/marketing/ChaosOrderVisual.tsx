"use client";

import { useEffect, useRef } from "react";

const ICON_SIZE = 44;
const REPEL_RADIUS = 90;
const REPEL_STRENGTH = 1.4;

const ICONS: { label: string; svg: string }[] = [
  {
    label: "Notion",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 7h4M7 12h10M7 17h7"/></svg>',
  },
  {
    label: "GitHub",
    svg: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .3a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.6-4.04-1.6-.55-1.38-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.82 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3Z"/></svg>',
  },
  {
    label: "Slack",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="4" height="8" rx="2"/><rect x="9" y="14" width="4" height="8" rx="2"/><rect x="14" y="9" width="8" height="4" rx="2"/><rect x="2" y="9" width="8" height="4" rx="2"/></svg>',
  },
  {
    label: "VS Code",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  },
  {
    label: "Browser Tabs",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 8h20M8 4v4M16 4v4"/></svg>',
  },
  {
    label: "Terminal",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
  },
  {
    label: "Text File",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>',
  },
  {
    label: "Bookmark",
    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  },
];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

interface Particle {
  el: HTMLDivElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  pulsePhase: number;
}

function ChaosBox() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chaosBox = containerRef.current;
    if (!chaosBox) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const particles: Particle[] = ICONS.map((icon) => {
      const el = document.createElement("div");
      el.className =
        "absolute flex h-11 w-11 items-center justify-center rounded-[10px] border border-marketing-border-strong bg-marketing-bg text-marketing-text-muted [&_svg]:h-[22px] [&_svg]:w-[22px] will-change-transform";
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
        pulsePhase: rand(0, Math.PI * 2),
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

    const onMouseMove = (e: MouseEvent) => {
      const rect = chaosBox.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      mouseActive = true;
    };
    const onMouseLeave = () => {
      mouseActive = false;
    };
    chaosBox.addEventListener("mousemove", onMouseMove);
    chaosBox.addEventListener("mouseleave", onMouseLeave);

    particles.forEach((p) => {
      p.x = rand(0, Math.max(boxWidth - ICON_SIZE, 10));
      p.y = rand(0, Math.max(boxHeight - ICON_SIZE, 10));
    });

    let lastTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - lastTime, 48);
      lastTime = now;
      const t = now / 1000;

      const maxX = Math.max(boxWidth - ICON_SIZE, 0);
      const maxY = Math.max(boxHeight - ICON_SIZE, 0);

      particles.forEach((p) => {
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

        const step = dt / 16.6;
        p.x += p.vx * step;
        p.y += p.vy * step;

        p.vx *= 0.98;
        p.vy *= 0.98;

        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < 0.12) {
          p.vx += rand(-0.05, 0.05);
          p.vy += rand(-0.05, 0.05);
        }

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

        const scale = prefersReducedMotion ? 1 : 0.92 + Math.sin(t * 1.4 + p.pulsePhase) * 0.08;

        p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.rotation}deg) scale(${scale})`;
      });

      rafId = requestAnimationFrame(tick);
    };

    if (prefersReducedMotion) {
      particles.forEach((p, i) => {
        const cols = 4;
        const col = i % cols;
        const row = Math.floor(i / cols);
        p.el.style.transform = `translate(${col * 56 + 12}px, ${row * 56 + 12}px)`;
      });
    } else {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", measure);
      chaosBox.removeEventListener("mousemove", onMouseMove);
      chaosBox.removeEventListener("mouseleave", onMouseLeave);
      particles.forEach((p) => p.el.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative h-full flex-1 overflow-hidden rounded-2xl bg-marketing-bg-card"
      style={{
        backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.04), transparent 60%)",
      }}
    />
  );
}

function DashboardPreview() {
  const navDots = ["#3b82f6", "#f59e0b", "#06b6d4", "#22c55e", "#ec4899"];
  const cardColors = ["#3b82f6", "#f59e0b", "#06b6d4", "#22c55e", "#ec4899", "#6366f1"];

  return (
    <div className="grid flex-1 grid-cols-[64px_1fr] overflow-hidden rounded-2xl border border-marketing-border bg-marketing-bg-card">
      <div className="flex flex-col items-center gap-3.5 border-r border-marketing-border bg-white/[0.02] py-4">
        <div className="mb-1.5 h-5 w-5 rounded-md bg-gradient-to-br from-blue-500 to-violet-500" />
        {navDots.map((color, i) => (
          <div
            key={color}
            className={`flex h-[26px] w-8 items-center justify-center rounded-md ${i === 0 ? "bg-white/[0.06]" : ""}`}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3.5 p-4">
        <div className="h-[22px] w-3/5 rounded-md border border-marketing-border bg-white/[0.04]" />
        <div className="grid grid-cols-3 gap-2.5">
          {cardColors.map((color, i) => (
            <div
              key={`${color}-${i}`}
              className="aspect-[4/3] rounded-lg border border-marketing-border border-t-[3px] bg-white/[0.03] transition-transform duration-200 hover:-translate-y-0.5"
              style={{ borderTopColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChaosOrderVisual() {
  return (
    <div className="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
      <div className="flex h-80 flex-col gap-3.5 rounded-2xl border border-marketing-border bg-marketing-bg-elevated p-5 shadow-[inset_0_0_60px_rgba(236,72,153,0.04)]">
        <span className="text-center text-[0.8rem] font-semibold text-marketing-text-dim">
          Your knowledge today...
        </span>
        <ChaosBox />
      </div>

      <div className="flex items-center justify-center py-1 md:rotate-0 rotate-90">
        <svg
          className="h-6 w-[60px] animate-arrow-pulse"
          viewBox="0 0 60 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M2 12H52" stroke="url(#arrowGradient)" strokeWidth="3" strokeLinecap="round" />
          <path
            d="M42 3L54 12L42 21"
            stroke="url(#arrowGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="arrowGradient" x1="0" y1="0" x2="60" y2="0" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#ec4899" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex h-80 flex-col gap-3.5 rounded-2xl border border-blue-500/25 bg-marketing-bg-elevated p-5 shadow-[0_0_80px_rgba(59,130,246,0.15)]">
        <span className="text-center text-[0.8rem] font-semibold text-marketing-text-dim">
          ...with DevDrop
        </span>
        <DashboardPreview />
      </div>
    </div>
  );
}
