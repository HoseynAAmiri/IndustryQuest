"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote as QuoteIcon, Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export type Quote = { initials: string; name: string; role: string; text: string; stars: number };

function Stars({ n }: { n: number }) {
  return (
    <p className="flex gap-0.5" aria-label={`${n} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`size-4 ${i < n ? "fill-current text-primary" : "text-muted-foreground/40"}`} aria-hidden />
      ))}
    </p>
  );
}

export function Quotes({ quotes }: { quotes: Quote[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);
  const [kick, setKick] = useState(0);

  function step(dir: 1 | -1, smooth = true) {
    const el = scroller.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const atEnd = el.scrollLeft >= max - 4;
    const atStart = el.scrollLeft <= 4;
    const left = dir > 0 && atEnd ? 0 : dir < 0 && atStart ? max : el.scrollLeft + dir * el.clientWidth;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left, behavior: reduce || !smooth ? "auto" : "smooth" });
  }

  function go(dir: 1 | -1) {
    step(dir);
    setKick((k) => k + 1);
  }

  function goTo(n: number) {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ left: n * el.clientWidth, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    setKick((k) => k + 1);
  }

  useEffect(() => {
    if (hover || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => step(1, false), 5500);
    return () => clearInterval(id);
  }, [hover, kick]);

  return (
    <section id="stories" aria-labelledby="stories-title" className="testimonial-shell relative scroll-mt-20 overflow-hidden rounded-3xl border px-4 py-10 sm:px-10 sm:py-12"
      onPointerEnter={() => setHover(true)} onPointerLeave={() => setHover(false)}>
      <div className="relative z-10 grid min-w-0 gap-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary">Notes from the demo cohort</p>
          <h2 id="stories-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Clear work makes for better stories</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Fictional examples from the demo show what students, mentors and companies get from a well-scoped project.</p>
        </div>
        <div className="relative mx-auto min-w-0 max-w-4xl px-0 sm:px-14">
          <Button type="button" variant="outline" size="icon" aria-label="Previous quote" onClick={() => go(-1)}
            className="absolute top-1/2 left-0 z-10 hidden size-10 -translate-y-1/2 rounded-full bg-background shadow-sm hover:border-primary hover:text-primary sm:inline-flex">
            <ChevronLeft />
          </Button>
          <div
            ref={scroller}
            className="flex min-w-0 snap-x snap-mandatory overflow-x-auto rounded-2xl shadow-lg scrollbar-none"
            aria-roledescription="carousel"
            aria-label="Sample notes"
            onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          >
            {quotes.map((q) => (
              <Card key={q.name} className="w-full min-w-full shrink-0 snap-start overflow-hidden rounded-2xl border-0 bg-background/95">
                <div className="grid min-h-72 min-w-0 sm:grid-cols-[.8fr_1.4fr]">
                  <div className="flex min-w-0 flex-col justify-between gap-8 border-b bg-primary/6 p-7 sm:border-r sm:border-b-0 sm:p-8">
                    <Stars n={q.stars} />
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-12 shrink-0"><AvatarFallback className="bg-primary text-primary-foreground">{q.initials}</AvatarFallback></Avatar>
                      <div className="min-w-0">
                        <CardTitle className="text-base">{q.name}</CardTitle>
                        <CardDescription className="mt-1">{q.role}</CardDescription>
                      </div>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col justify-center p-7 sm:p-10">
                    <QuoteIcon className="mb-5 size-9 fill-primary/10 text-primary/40" aria-hidden />
                    <blockquote className="text-xl leading-relaxed font-medium tracking-tight sm:text-2xl">{q.text}</blockquote>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Button type="button" variant="outline" size="icon" aria-label="Next quote" onClick={() => go(1)}
            className="absolute top-1/2 right-0 z-10 hidden size-10 -translate-y-1/2 rounded-full bg-background shadow-sm hover:border-primary hover:text-primary sm:inline-flex">
            <ChevronRight />
          </Button>
        </div>
        <div className="flex items-center justify-center gap-1 sm:hidden">
          <Button type="button" variant="ghost" size="icon" aria-label="Previous quote" onClick={() => go(-1)}><ChevronLeft /></Button>
          <span className="min-w-14 text-center text-sm text-muted-foreground">{i + 1} / {quotes.length}</span>
          <Button type="button" variant="ghost" size="icon" aria-label="Next quote" onClick={() => go(1)}><ChevronRight /></Button>
        </div>
        <div className="hidden justify-center gap-0.5 sm:flex">
          {quotes.map((q, n) => (
            <button key={q.name} type="button" aria-label={`Show quote from ${q.name}`} aria-current={n === i || undefined}
              className="grid size-7 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-ring"
              onClick={() => goTo(n)}><span className={`block h-1.5 rounded-full transition-[width,background-color] ${n === i ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"}`} /></button>
          ))}
        </div>
      </div>
    </section>
  );
}
