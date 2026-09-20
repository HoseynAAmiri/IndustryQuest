"use client";

import type { PointerEvent, ReactNode } from "react";

export function InteractiveHero({ children }: { children: ReactNode }) {
  function followPointer(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "touch") return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;
    const y = (event.clientY - box.top) / box.height;
    event.currentTarget.style.setProperty("--hero-x", `${x * 100}%`);
    event.currentTarget.style.setProperty("--hero-y", `${y * 100}%`);
    event.currentTarget.style.setProperty("--wave-x", `${(x - 0.5) * 18}px`);
    event.currentTarget.style.setProperty("--wave-y", `${(y - 0.5) * 12}px`);
  }

  return (
    <section className="hero-shell relative overflow-hidden" onPointerMove={followPointer}>
      <div className="hero-wave-field" aria-hidden>
        <svg viewBox="0 0 1440 760" preserveAspectRatio="none">
          <defs>
            <path id="hero-field-wave" d="M-180 190 C20 24 170 352 370 178 S704 24 904 190 1234 348 1620 132" />
          </defs>
          <g>
            {[-270, -180, -90, 0, 90, 180, 270, 360, 450, 540].map((y) => <use key={y} href="#hero-field-wave" y={y} />)}
          </g>
        </svg>
      </div>
      {children}
    </section>
  );
}
