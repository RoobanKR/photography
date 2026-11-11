"use client";

// Reusable motion pieces for the public website

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useInView, useScroll, useTransform } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

// Fades and lifts its children in when they scroll into view
export function Reveal({
  children,
  delay = 0,
  y = 40,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// Wide-tracked serif heading whose letters rise in one after another
export function LetterHeading({
  text,
  className = "",
  as: Tag = "h2",
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2";
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const words = text.split(" ");
  let index = 0;

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((word, w) => (
        <span key={w} className="inline-block whitespace-nowrap" aria-hidden>
          {word.split("").map((char) => {
            const i = index++;
            return (
              <span key={i} className="inline-block overflow-hidden align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  animate={inView ? { y: 0 } : undefined}
                  transition={{ duration: 0.8, delay: i * 0.035, ease: EASE }}
                >
                  {char}
                </motion.span>
              </span>
            );
          })}
          {w < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </Tag>
  );
}

// Image that is uncovered by a curtain wipe, then drifts slightly while scrolling
export function RevealImage({
  src,
  alt,
  className = "",
  imgClassName = "",
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Watch the unclipped wrapper: a fully clipped element never counts as "in view"
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0"
        initial={{ clipPath: "inset(100% 0 0 0)" }}
        animate={inView ? { clipPath: "inset(0% 0 0 0)" } : undefined}
        transition={{ duration: 1.3, ease: EASE }}
      >
        <motion.img
          src={src}
          alt={alt}
          loading="lazy"
          style={{ y }}
          className={`absolute inset-x-0 -top-[6%] h-[112%] w-full object-cover ${imgClassName}`}
        />
      </motion.div>
    </div>
  );
}

// Full-bleed background photo that moves slower than the page
export function ParallaxBackdrop({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <motion.img src={src} alt="" style={{ y }} className={`absolute inset-0 h-[130%] w-full -top-[15%] object-cover ${className}`} />
    </div>
  );
}

// Number that counts up once it scrolls into view
export function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration: 2.2,
      ease: EASE,
      onUpdate: (v) => setShown(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value]);

  return (
    <span ref={ref}>
      {shown}
      {suffix}
    </span>
  );
}

// Soft floating light circles, like out-of-focus fairy lights
export function Bokeh({ count = 18, tone = "gold" }: { count?: number; tone?: "gold" | "white" }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Random positions are generated on the client only, so server and client HTML match
  const lights = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 8 + Math.random() * 60,
        duration: 10 + Math.random() * 14,
        delay: -Math.random() * 20,
        x: (Math.random() - 0.5) * 120,
        y: -40 - Math.random() * 120,
        opacity: 0.15 + Math.random() * 0.35,
      })),
    [count]
  );

  if (!mounted) return null;
  const color = tone === "gold" ? "rgba(214, 178, 110, 0.9)" : "rgba(255, 255, 255, 0.8)";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {lights.map((l, i) => (
        <span
          key={i}
          className="site-bokeh absolute rounded-full blur-[2px]"
          style={
            {
              left: `${l.left}%`,
              top: `${l.top}%`,
              width: l.size,
              height: l.size,
              background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
              animationDelay: `${l.delay}s`,
              "--bokeh-duration": `${l.duration}s`,
              "--bokeh-x": `${l.x}px`,
              "--bokeh-y": `${l.y}px`,
              "--bokeh-opacity": l.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

// Animated film grain laid over dark photos
export function Grain() {
  return <div className="site-grain pointer-events-none absolute -inset-[50%] opacity-[0.07] mix-blend-overlay" aria-hidden />;
}

// Thin vertical line that draws itself downwards
export function DrawLine({ className = "" }: { className?: string }) {
  return (
    <motion.span
      className={`block w-px origin-top bg-current ${className}`}
      initial={{ scaleY: 0 }}
      whileInView={{ scaleY: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.4, ease: EASE }}
    />
  );
}
