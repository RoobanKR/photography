"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Instagram,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ScanFace,
  X,
  Youtube,
} from "lucide-react";
import { getToken } from "@/lib/api";
import {
  CONTACT_BACKDROP,
  COUNTERS,
  HERO_SLIDES,
  MARQUEE,
  PARALLAX_BACKDROP,
  PLANS,
  PORTFOLIO,
  SERVICES,
  STORIES,
  STUDIO,
} from "@/components/website/content";
import {
  Bokeh,
  Counter,
  DrawLine,
  Grain,
  LetterHeading,
  ParallaxBackdrop,
  Reveal,
  RevealImage,
} from "@/components/website/effects";

const EASE = [0.22, 1, 0.36, 1] as const;
const SLIDE_MS = 6500;

const NAV = [
  { href: "#about", label: "About" },
  { href: "#stories", label: "Stories" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#services", label: "Services" },
  { href: "#plans", label: "Plans" },
  { href: "#contact", label: "Contact" },
];

// Small uppercase label above section headings
const eyebrow = "font-sans text-[11px] font-medium uppercase tracking-[0.4em]";
// Large serif section heading with wide letter spacing
const display = "font-serif font-light uppercase tracking-[0.1em] sm:tracking-[0.18em]";

export default function Website() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setSignedIn(Boolean(getToken()));
    const timer = setTimeout(() => setLoading(false), 1800);

    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Lock page scroll while the full-screen menu is open; Escape closes it
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    if (menuOpen) window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const studioLink = signedIn ? "/dashboard" : "/login";

  return (
    <div className="scroll-smooth bg-[#f5f1ec] font-sans text-stone-800 selection:bg-[#b8935a]/30">
      <style>{`html { scroll-behavior: smooth; }`}</style>

      <Preloader show={loading} />

      {/* ================= HEADER ================= */}
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
          scrolled ? "bg-[#f5f1ec]/95 py-3 shadow-[0_1px_0_rgba(0,0,0,0.06)] backdrop-blur-md" : "py-6"
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 sm:px-10">
          <a href="#top" className="group flex flex-col leading-none">
            <span className={`font-serif text-3xl font-medium tracking-[0.25em] transition-colors ${scrolled ? "text-[#b8935a]" : "text-white"}`}>
              {STUDIO.name}
            </span>
            <span className={`mt-1 text-[8px] uppercase tracking-[0.5em] transition-colors ${scrolled ? "text-stone-500" : "text-white/70"}`}>
              {STUDIO.tagline}
            </span>
          </a>

          <div className="flex items-center gap-6 sm:gap-10">
            <Link
              href={studioLink}
              className={`hidden text-[11px] uppercase tracking-[0.35em] transition-colors sm:block ${
                scrolled ? "text-stone-600 hover:text-[#b8935a]" : "text-white/80 hover:text-white"
              }`}
            >
              {signedIn ? "Studio" : "Login"}
            </Link>
            <button
              onClick={() => setMenuOpen(true)}
              className={`group flex items-center gap-4 text-[11px] uppercase tracking-[0.35em] ${scrolled ? "text-stone-700" : "text-white"}`}
            >
              Menu
              <span className="flex w-10 flex-col gap-[5px]">
                <span className="h-px w-full bg-current transition-all duration-300 group-hover:w-6" />
                <span className="h-px w-6 self-end bg-current transition-all duration-300 group-hover:w-full" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <FullscreenMenu open={menuOpen} onClose={() => setMenuOpen(false)} studioLink={studioLink} signedIn={signedIn} />

      <Hero />
      <About />
      <Marquee />
      <Stories />
      <Counters />
      <Portfolio />
      <Services />
      <Galleries />
      <Plans />
      <Contact />
      <Footer studioLink={studioLink} signedIn={signedIn} />

      <BackToTop show={scrolled} />
      <WhatsAppButton />
    </div>
  );
}

/* ================= PRELOADER ================= */
function Preloader({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="site-preloader fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#141210]"
          exit={{ y: "-100%" }}
          transition={{ duration: 1, ease: EASE }}
        >
          <div className="flex overflow-hidden">
            {STUDIO.name.split("").map((char, i) => (
              <motion.span
                key={i}
                className="font-serif text-6xl font-light tracking-[0.3em] text-[#d6b26e] sm:text-7xl"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: EASE }}
              >
                {char}
              </motion.span>
            ))}
          </div>
          <motion.div
            className="mt-6 h-px w-40 origin-left bg-[#d6b26e]/60"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.4, delay: 0.3, ease: EASE }}
          />
          <motion.p
            className="mt-5 text-[10px] uppercase tracking-[0.6em] text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {STUDIO.tagline}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================= FULL-SCREEN MENU ================= */
function FullscreenMenu({
  open,
  onClose,
  studioLink,
  signedIn,
}: {
  open: boolean;
  onClose: () => void;
  studioLink: string;
  signedIn: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex overflow-hidden bg-[#141210] text-white"
          initial={{ clipPath: "circle(0% at 95% 4%)" }}
          animate={{ clipPath: "circle(150% at 95% 4%)" }}
          exit={{ clipPath: "circle(0% at 95% 4%)" }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <Bokeh count={14} />
          <button
            onClick={onClose}
            className="absolute right-5 top-6 z-10 flex items-center gap-3 text-[11px] uppercase tracking-[0.35em] text-white/70 hover:text-white sm:right-10"
          >
            Close <X className="h-5 w-5" />
          </button>

          <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-12 px-6 py-24 sm:px-10 lg:grid-cols-[1.4fr_1fr]">
            <nav className="flex flex-col gap-1">
              {NAV.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className="group flex items-baseline gap-5 py-1"
                  initial={{ opacity: 0, x: -60 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.25 + i * 0.07, ease: EASE }}
                >
                  <span className="font-sans text-xs text-[#d6b26e]">0{i + 1}</span>
                  <span className="font-serif text-4xl font-light uppercase tracking-[0.15em] text-white/80 transition-all duration-500 group-hover:translate-x-3 group-hover:text-[#d6b26e] sm:text-6xl">
                    {item.label}
                  </span>
                </motion.a>
              ))}
            </nav>

            <motion.div
              className="space-y-8 border-white/10 lg:border-l lg:pl-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: EASE }}
            >
              <div>
                <p className={`${eyebrow} text-white/40`}>Get in touch</p>
                <a href={`tel:${STUDIO.phone.replace(/\s/g, "")}`} className="mt-4 block font-serif text-2xl hover:text-[#d6b26e]">
                  {STUDIO.phone}
                </a>
                <a href={`mailto:${STUDIO.email}`} className="mt-1 block font-serif text-2xl italic hover:text-[#d6b26e]">
                  {STUDIO.email}
                </a>
              </div>
              <div className="flex gap-4">
                <SocialIcon href={STUDIO.instagram} label="Instagram"><Instagram className="h-4 w-4" /></SocialIcon>
                <SocialIcon href={STUDIO.youtube} label="YouTube"><Youtube className="h-4 w-4" /></SocialIcon>
              </div>
              <Link
                href={studioLink}
                className="inline-flex items-center gap-3 border border-[#d6b26e]/60 px-6 py-3 text-[11px] uppercase tracking-[0.35em] text-[#d6b26e] transition-colors hover:bg-[#d6b26e] hover:text-[#141210]"
              >
                {signedIn ? "Open studio" : "Studio login"} <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ================= HERO ================= */
function Hero() {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const timer = setTimeout(() => setIndex((i) => (i + 1) % HERO_SLIDES.length), SLIDE_MS);
    return () => clearTimeout(timer);
  }, [index]);

  const go = (step: number) => setIndex((i) => (i + step + HERO_SLIDES.length) % HERO_SLIDES.length);
  const slide = HERO_SLIDES[index];

  return (
    <section id="top" ref={ref} className="relative h-[100svh] min-h-[560px] overflow-hidden bg-[#141210]">
      <AnimatePresence initial={false}>
        <motion.div
          key={index}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        >
          <img src={slide.image} alt="" className="site-kenburns h-full w-full object-cover" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />
      <Grain />
      <Bokeh count={16} />

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.55)]"
      >
        <AnimatePresence mode="wait">
          <motion.div key={index} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}>
            <motion.p
              className={`${eyebrow} text-white/70`}
              initial={{ opacity: 0, letterSpacing: "0.8em" }}
              animate={{ opacity: 1, letterSpacing: "0.4em" }}
              transition={{ duration: 1.4, delay: 0.3, ease: EASE }}
            >
              {STUDIO.name} · {STUDIO.tagline}
            </motion.p>
            <LetterHeading
              as="h1"
              text={slide.title}
              className="mt-6 font-serif text-5xl font-light uppercase tracking-[0.15em] sm:text-8xl sm:tracking-[0.3em] lg:text-9xl"
            />
            <motion.p
              className="mt-6 font-serif text-xl italic text-white/85 sm:text-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7, ease: EASE }}
            >
              {slide.subtitle}
            </motion.p>
          </motion.div>
        </AnimatePresence>

        <motion.a
          href="#contact"
          className="group mt-12 inline-flex items-center gap-3 border border-white/50 px-8 py-4 text-[11px] uppercase tracking-[0.4em] backdrop-blur-sm transition-colors hover:border-white hover:bg-white hover:text-stone-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4, duration: 1 }}
        >
          Book your date <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </motion.a>
      </motion.div>

      {/* Socials on the left edge */}
      <div className="absolute bottom-10 left-5 z-10 hidden flex-col items-center gap-5 text-white/70 sm:flex sm:left-10">
        <a href={STUDIO.instagram} target="_blank" rel="noreferrer" className="hover:text-white"><Instagram className="h-4 w-4" /></a>
        <a href={STUDIO.youtube} target="_blank" rel="noreferrer" className="hover:text-white"><Youtube className="h-4 w-4" /></a>
        <span className="h-16 w-px bg-white/40" />
      </div>

      {/* Slide controls */}
      <div className="absolute bottom-10 right-5 z-10 flex items-center gap-5 text-white sm:right-10">
        <button onClick={() => go(-1)} className="rounded-full border border-white/30 p-2 hover:bg-white/10" aria-label="Previous slide">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setIndex(i)} className="relative h-px w-10 overflow-hidden bg-white/30" aria-label={`Slide ${i + 1}`}>
              {i === index && (
                <motion.span
                  className="absolute inset-y-0 left-0 bg-white"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: SLIDE_MS / 1000, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>
        <span className="font-serif text-sm tracking-widest">
          0{index + 1} / 0{HERO_SLIDES.length}
        </span>
        <button onClick={() => go(1)} className="rounded-full border border-white/30 p-2 hover:bg-white/10" aria-label="Next slide">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Scroll cue */}
      <a href="#about" className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-3 text-white/70 md:flex">
        <span className="text-[10px] uppercase tracking-[0.4em]">Scroll</span>
        <span className="relative h-12 w-px overflow-hidden bg-white/20">
          <motion.span
            className="absolute inset-x-0 top-0 h-1/2 bg-white"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </a>
    </section>
  );
}

/* ================= ABOUT ================= */
function About() {
  return (
    <section id="about" className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 sm:px-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <p className={`${eyebrow} text-[#b8935a]`}>Welcome to {STUDIO.name}</p>
          </Reveal>
          <LetterHeading
            text="Wedding Photography & Cinematography"
            className={`${display} mt-6 text-3xl leading-[1.25] text-stone-800 sm:text-5xl`}
          />
          <Reveal delay={0.3}>
            <p className="mt-8 max-w-xl font-serif text-xl italic leading-relaxed text-stone-500">
              We are a team of photographers and filmmakers who believe the best pictures are the ones you feel. We stay quiet,
              watch closely and capture your day as it truly happened — the laughter, the nerves and the little moments in between.
            </p>
          </Reveal>
          <Reveal delay={0.45}>
            <a
              href="#stories"
              className="group mt-10 inline-flex items-center gap-4 text-[11px] uppercase tracking-[0.4em] text-stone-800"
            >
              <span className="h-px w-12 bg-[#b8935a] transition-all duration-500 group-hover:w-20" />
              See our stories
            </a>
          </Reveal>
        </div>

        <div className="relative h-[520px] sm:h-[640px]">
          <RevealImage src={STORIES[0].image} alt="Wedding couple" className="absolute right-0 top-0 h-[80%] w-[72%]" />
          <RevealImage src={PORTFOLIO[0]} alt="Bride portrait" className="absolute bottom-0 left-0 h-[52%] w-[46%] border-[10px] border-[#f5f1ec]" />
          <div className="absolute -left-2 top-10 hidden text-[#b8935a] lg:block">
            <DrawLine className="h-40" />
          </div>
          <motion.div
            className="absolute bottom-10 right-4 font-serif text-[120px] font-light leading-none text-[#b8935a]/15 sm:text-[160px]"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: EASE }}
          >
            {STUDIO.name}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ================= MARQUEE ================= */
function Marquee() {
  const items = [...MARQUEE, ...MARQUEE];
  return (
    <div className="overflow-hidden border-y border-stone-300/60 bg-[#efe9e1] py-5">
      <div className="site-marquee flex w-max items-center gap-12 whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-12">
            <span
              className={`font-serif text-5xl font-light uppercase tracking-[0.15em] sm:text-7xl ${
                i % 2 ? "text-stone-800" : "text-transparent [-webkit-text-stroke:1px_#a8a29e]"
              }`}
            >
              {item}
            </span>
            <span className="text-2xl text-[#b8935a]">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ================= STORIES ================= */
function Stories() {
  return (
    <section id="stories" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-10">
        <div className="text-center">
          <Reveal>
            <p className={`${eyebrow} text-[#b8935a]`}>Love stories</p>
          </Reveal>
          <LetterHeading text="Our Wedding Stories" className={`${display} mt-5 text-3xl text-stone-800 sm:text-5xl`} />
          <Reveal delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl font-serif text-xl italic text-stone-500">
              Live your magic — we will keep the memories. A few of the couples who let us be part of their day.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-x-10 gap-y-14 md:grid-cols-2">
          {STORIES.map((story, i) => (
            <Reveal key={story.names} delay={(i % 2) * 0.15}>
              <a href="#portfolio" className="group block">
                <div className="overflow-hidden">
                  <RevealImage
                    src={story.image}
                    alt={story.names}
                    className="aspect-[1/1] w-full"
                    imgClassName="transition-transform duration-[1.6s] ease-out group-hover:scale-110"
                  />
                </div>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className={`${eyebrow} text-stone-400`}>{story.place}</p>
                    <h3 className="mt-2 font-serif text-3xl font-light uppercase tracking-[0.12em] text-stone-800 transition-colors group-hover:text-[#b8935a]">
                      {story.names}
                    </h3>
                  </div>
                  <span className="mb-2 h-px w-12 bg-stone-300 transition-all duration-500 group-hover:w-20 group-hover:bg-[#b8935a]" />
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= COUNTERS ================= */
function Counters() {
  return (
    <section className="bg-[#f5f1ec] py-14 sm:py-20">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-y-10 px-5 sm:px-10 lg:grid-cols-4">
        {COUNTERS.map((c, i) => (
          <Reveal key={c.label} delay={i * 0.12} className="relative flex h-32 items-center justify-center text-center">
            <span className="absolute inset-0 flex items-center justify-center font-serif text-[90px] font-light leading-none text-[#b8935a]/20 sm:text-[120px]">
              <Counter value={c.value} suffix={c.suffix} />
            </span>
            <span className="relative max-w-[10rem] text-[11px] font-medium uppercase tracking-[0.35em] text-stone-600">{c.label}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ================= PORTFOLIO ================= */
function Portfolio() {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i === null ? i : (i + 1) % PORTFOLIO.length));
      if (e.key === "ArrowLeft") setOpen((i) => (i === null ? i : (i - 1 + PORTFOLIO.length) % PORTFOLIO.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <section id="portfolio" className="relative overflow-hidden bg-[#141210] py-16 text-white sm:py-24">
      <ParallaxBackdrop src={PARALLAX_BACKDROP} className="opacity-25 grayscale" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#141210] via-transparent to-[#141210]" />
      <Grain />
      <Bokeh count={12} tone="white" />

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-10">
        <div className="text-center">
          <Reveal>
            <p className={`${eyebrow} text-[#d6b26e]`}>Portfolio</p>
          </Reveal>
          <LetterHeading text="Photography" className={`${display} mt-5 text-4xl sm:text-7xl`} />
          <Reveal delay={0.2}>
            <span className="mx-auto mt-6 block h-px w-24 bg-[#d6b26e]/70" />
          </Reveal>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
          {PORTFOLIO.map((src, i) => (
            <motion.button
              key={src}
              onClick={() => setOpen(i)}
              className={`group relative overflow-hidden ${i === 0 || i === 4 ? "row-span-2" : ""}`}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 1, delay: (i % 3) * 0.12, ease: EASE }}
            >
              <img
                src={src}
                alt={`Portfolio photo ${i + 1}`}
                loading="lazy"
                className={`h-full w-full object-cover transition-all duration-[1.2s] ease-out group-hover:scale-110 group-hover:brightness-75 ${
                  i === 0 || i === 4 ? "aspect-[3/4] md:aspect-auto" : "aspect-square"
                }`}
              />
              <span className="absolute inset-3 flex items-center justify-center border border-white/0 transition-all duration-700 group-hover:border-white/60">
                <span className="translate-y-3 text-[10px] uppercase tracking-[0.4em] opacity-0 transition-all duration-700 group-hover:translate-y-0 group-hover:opacity-100">
                  View
                </span>
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={open}
                src={PORTFOLIO[open].replace("w=900", "w=2000")}
                alt=""
                className="max-h-[88vh] max-w-full object-contain"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, ease: EASE }}
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>
            <button className="absolute right-5 top-5 p-2 text-white/70 hover:text-white" aria-label="Close">
              <X className="h-6 w-6" />
            </button>
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((open - 1 + PORTFOLIO.length) % PORTFOLIO.length);
              }}
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((open + 1) % PORTFOLIO.length);
              }}
              aria-label="Next photo"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
            <span className="absolute bottom-6 font-serif text-sm tracking-widest text-white/60">
              {open + 1} / {PORTFOLIO.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ================= SERVICES ================= */
function Services() {
  return (
    <section id="services" className="bg-[#f5f1ec] py-16 sm:py-24">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <Reveal>
              <p className={`${eyebrow} text-[#b8935a]`}>What we do</p>
            </Reveal>
            <LetterHeading text="Our Services" className={`${display} mt-5 text-3xl text-stone-800 sm:text-5xl`} />
          </div>
          <Reveal delay={0.2}>
            <p className="max-w-md font-serif text-xl italic text-stone-500">
              From intimate ceremonies to grand celebrations, every story gets the same care.
            </p>
          </Reveal>
        </div>

        <div className="mt-10 grid gap-px bg-stone-300/60 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <Reveal key={service.title} delay={(i % 3) * 0.1} className="bg-[#f5f1ec]">
              <div className="group relative h-full overflow-hidden p-8 sm:p-10">
                {/* Photo slides up behind the text on hover */}
                <img
                  src={service.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full translate-y-full object-cover transition-transform duration-700 ease-out group-hover:translate-y-0 [@media(hover:none)]:translate-y-0"
                />
                <div className="absolute inset-0 translate-y-full bg-black/55 transition-transform duration-700 ease-out group-hover:translate-y-0 [@media(hover:none)]:translate-y-0" />

                <div className="relative">
                  <span className="font-serif text-5xl font-light text-[#b8935a]/50 transition-colors duration-500 group-hover:text-[#d6b26e] [@media(hover:none)]:text-[#d6b26e]">
                    0{i + 1}
                  </span>
                  <h3 className="mt-10 font-serif text-2xl uppercase tracking-[0.12em] text-stone-800 transition-colors duration-500 group-hover:text-white [@media(hover:none)]:text-white">
                    {service.title}
                  </h3>
                  <p className="mt-4 leading-relaxed text-stone-500 transition-colors duration-500 group-hover:text-white/80 [@media(hover:none)]:text-white/80">{service.text}</p>
                  <a
                    href="#contact"
                    className="mt-8 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-stone-700 transition-colors duration-500 group-hover:text-white [@media(hover:none)]:text-white"
                  >
                    Enquire <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= ONLINE GALLERIES ================= */
function Galleries() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-10, 6]);
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);

  const features = [
    { icon: QrCode, title: "Scan at the venue", text: "Guests scan a QR code and your gallery opens on their phone." },
    { icon: ScanFace, title: "Find your own photos", text: "One selfie, and the gallery shows every photo you appear in." },
    { icon: Download, title: "Full-quality downloads", text: "Photos and films saved straight from a private gallery." },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#1b1815] py-16 text-white sm:py-24">
      <Bokeh count={20} />
      <div className="relative mx-auto grid max-w-[1300px] items-center gap-14 px-5 sm:px-10 lg:grid-cols-2">
        <div>
          <Reveal>
            <p className={`${eyebrow} text-[#d6b26e]`}>Online galleries</p>
          </Reveal>
          <LetterHeading text="Delivered Beautifully" className={`${display} mt-5 text-3xl sm:text-5xl`} />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-lg font-serif text-xl italic text-white/60">
              Every event gets its own private gallery. Share one link or QR code with family and guests — no app to install.
            </p>
          </Reveal>
          <div className="mt-8 space-y-6">
            {features.map(({ icon: Icon, title, text }, i) => (
              <Reveal key={title} delay={0.2 + i * 0.12} className="flex gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#d6b26e]/40 text-[#d6b26e]">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-serif text-xl uppercase tracking-[0.12em]">{title}</h3>
                  <p className="mt-1 text-sm text-white/55">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Phone mock-up that tilts as you scroll */}
        <motion.div style={{ rotate, y }} className="relative mx-auto w-full max-w-[320px]">
          <div className="absolute -inset-10 rounded-full bg-[#d6b26e]/20 blur-3xl" />
          <div className="relative rounded-[2.8rem] border border-white/15 bg-[#0d0c0b] p-3 shadow-2xl">
            <div className="overflow-hidden rounded-[2.2rem] bg-[#f5f1ec] text-stone-800">
              <div className="relative h-44">
                <img src={STORIES[2].image.replace("w=1000", "w=700")} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-[9px] uppercase tracking-[0.35em] opacity-80">{STUDIO.name} presents</p>
                  <p className="font-serif text-xl">{STORIES[2].names}</p>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white">
                  <ScanFace className="h-3.5 w-3.5" /> Find my photos
                </span>
                <span className="text-[10px] uppercase tracking-wider text-stone-500">248 photos</span>
              </div>
              <div className="grid grid-cols-3 gap-0.5 px-0.5 pb-0.5">
                {PORTFOLIO.slice(1, 7).map((src) => (
                  <img key={src} src={src.replace("w=900", "w=300")} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ================= PLANS ================= */
function Plans() {
  return (
    <section id="plans" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-10">
        <div className="text-center">
          <Reveal>
            <p className={`${eyebrow} text-[#b8935a]`}>Packages</p>
          </Reveal>
          <LetterHeading text="Pricing Plans" className={`${display} mt-5 text-3xl text-stone-800 sm:text-5xl`} />
          <Reveal delay={0.2}>
            <p className="mt-5 font-serif text-xl italic text-stone-500">Choose the package that fits your story</p>
          </Reveal>
        </div>

        <div className="mt-10 grid items-center gap-8 md:grid-cols-3">
          {PLANS.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.15}>
              <motion.div
                whileHover={{ y: -10 }}
                transition={{ duration: 0.5, ease: EASE }}
                className={`relative border px-8 py-12 text-center ${
                  plan.featured ? "border-[#b8935a] bg-[#141210] text-white md:py-16" : "border-stone-200 bg-white text-stone-800"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#b8935a] px-4 py-1 text-[9px] uppercase tracking-[0.35em] text-white">
                    Most loved
                  </span>
                )}
                <h3 className="font-serif text-2xl uppercase tracking-[0.25em]">{plan.name}</h3>
                <p className={`mt-2 text-xs uppercase tracking-[0.25em] ${plan.featured ? "text-white/50" : "text-stone-400"}`}>{plan.text}</p>
                <p className={`mt-8 font-serif text-5xl italic ${plan.featured ? "text-[#d6b26e]" : "text-stone-500"}`}>Discuss</p>
                <ul className={`mt-8 space-y-3 text-sm ${plan.featured ? "text-white/70" : "text-stone-500"}`}>
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`mt-10 inline-block border px-8 py-3 text-[10px] uppercase tracking-[0.35em] transition-colors ${
                    plan.featured
                      ? "border-[#d6b26e] text-[#d6b26e] hover:bg-[#d6b26e] hover:text-[#141210]"
                      : "border-stone-800 text-stone-800 hover:bg-stone-800 hover:text-white"
                  }`}
                >
                  Enquire now
                </a>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================= CONTACT ================= */
function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", date: "", event: "Wedding", message: "" });
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // No backend yet: the enquiry opens WhatsApp with everything filled in
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = [
      `Hi ${STUDIO.name}, I'd like to book a shoot.`,
      `Name: ${form.name}`,
      form.phone && `Phone: ${form.phone}`,
      `Event: ${form.event}`,
      form.date && `Date: ${form.date}`,
      form.message && `Details: ${form.message}`,
    ].filter(Boolean);
    window.open(`https://wa.me/${STUDIO.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
  };

  const field =
    "w-full border-0 border-b border-white/25 bg-transparent px-0 py-4 font-serif text-lg text-white placeholder:text-white/40 focus:border-[#d6b26e] focus:outline-none focus:ring-0 transition-colors";

  return (
    <section id="contact" className="relative overflow-hidden bg-[#141210] py-16 text-white sm:py-24">
      <ParallaxBackdrop src={CONTACT_BACKDROP} className="opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#141210] via-[#141210]/85 to-[#141210]/60" />
      <Grain />

      <div className="relative mx-auto grid max-w-[1300px] gap-14 px-5 sm:px-10 lg:grid-cols-2">
        <div>
          <Reveal>
            <p className={`${eyebrow} text-[#d6b26e]`}>Contact</p>
          </Reveal>
          <LetterHeading text="Let's Tell Your Story" className={`${display} mt-5 text-3xl leading-tight sm:text-6xl`} />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-md font-serif text-xl italic text-white/60">
              Tell us your date and venue. We&apos;ll check availability and share our packages.
            </p>
          </Reveal>

          <div className="mt-8 space-y-5">
            <Reveal delay={0.3}>
              <a href={`tel:${STUDIO.phone.replace(/\s/g, "")}`} className="group flex items-center gap-5">
                <Phone className="h-5 w-5 text-[#d6b26e]" />
                <span className="font-serif text-2xl transition-colors group-hover:text-[#d6b26e]">{STUDIO.phone}</span>
              </a>
            </Reveal>
            <Reveal delay={0.4}>
              <a href={`mailto:${STUDIO.email}`} className="group flex items-center gap-5">
                <Mail className="h-5 w-5 text-[#d6b26e]" />
                <span className="font-serif text-2xl italic transition-colors group-hover:text-[#d6b26e]">{STUDIO.email}</span>
              </a>
            </Reveal>
            <Reveal delay={0.5}>
              <div className="flex items-center gap-5">
                <MapPin className="h-5 w-5 text-[#d6b26e]" />
                <span className="font-serif text-2xl">{STUDIO.location}</span>
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.2}>
          <form onSubmit={send} className="space-y-2">
            <input required value={form.name} onChange={set("name")} placeholder="Your name" className={field} />
            <input value={form.phone} onChange={set("phone")} placeholder="Phone number" type="tel" className={field} />
            <div className="grid gap-2 sm:grid-cols-2">
              <select value={form.event} onChange={set("event")} className={`${field} [&>option]:text-stone-900`}>
                {SERVICES.map((s) => (
                  <option key={s.title}>{s.title}</option>
                ))}
              </select>
              <input value={form.date} onChange={set("date")} type="date" className={`${field} [color-scheme:dark]`} />
            </div>
            <textarea value={form.message} onChange={set("message")} placeholder="Venue, guest count, anything else" rows={3} className={`${field} resize-none`} />
            <button
              type="submit"
              className="group !mt-10 inline-flex items-center gap-4 bg-[#d6b26e] px-10 py-4 text-[11px] font-medium uppercase tracking-[0.4em] text-[#141210] transition-colors hover:bg-white"
            >
              Send enquiry <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= FOOTER ================= */
function Footer({ studioLink, signedIn }: { studioLink: string; signedIn: boolean }) {
  return (
    <footer className="bg-[#0d0c0b] py-16 text-white/60">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-8 px-5 text-center sm:px-10">
        <div>
          <p className="font-serif text-4xl tracking-[0.3em] text-[#d6b26e]">{STUDIO.name}</p>
          <p className="mt-2 text-[9px] uppercase tracking-[0.5em]">{STUDIO.tagline}</p>
        </div>
        <nav className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-[10px] uppercase tracking-[0.35em]">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </a>
          ))}
          <Link href={studioLink} className="text-[#d6b26e] hover:text-white">
            {signedIn ? "Studio" : "Login"}
          </Link>
        </nav>
        <div className="flex gap-4">
          <SocialIcon href={STUDIO.instagram} label="Instagram"><Instagram className="h-4 w-4" /></SocialIcon>
          <SocialIcon href={STUDIO.youtube} label="YouTube"><Youtube className="h-4 w-4" /></SocialIcon>
        </div>
        <p className="text-xs">
          © {new Date().getFullYear()} {STUDIO.name} {STUDIO.tagline}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-[#d6b26e] hover:text-[#d6b26e]"
    >
      {children}
    </a>
  );
}

function BackToTop({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href="#top"
          className="fixed bottom-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full sm:bottom-6 sm:right-6 sm:h-12 sm:w-12 bg-[#141210] text-[#d6b26e] shadow-xl hover:bg-[#b8935a] hover:text-white"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          aria-label="Back to top"
        >
          <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" />
        </motion.a>
      )}
    </AnimatePresence>
  );
}

// Floating WhatsApp chat button, bottom-left on every screen size
function WhatsAppButton() {
  const text = encodeURIComponent(`Hi ${STUDIO.name}, I'd like to know more about booking a shoot.`);
  return (
    <motion.a
      href={`https://wa.me/${STUDIO.whatsapp}?text=${text}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-4 left-4 z-30 flex items-center sm:bottom-6 sm:left-6"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 2.6, duration: 0.6, ease: EASE }}
    >
      <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] sm:h-14 sm:w-14 text-white shadow-xl shadow-black/30 transition-transform group-hover:scale-110">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-40" />
        <svg viewBox="0 0 32 32" className="relative h-5 w-5 fill-current sm:h-7 sm:w-7" aria-hidden>
          <path d="M16.04 3C8.86 3 3.03 8.82 3.03 16c0 2.3.6 4.54 1.74 6.52L3 29l6.65-1.74A12.95 12.95 0 0 0 16.04 29C23.2 29 29 23.18 29 16S23.2 3 16.04 3Zm0 23.62c-2 0-3.96-.54-5.67-1.55l-.4-.24-3.95 1.03 1.05-3.85-.26-.4a10.6 10.6 0 0 1-1.63-5.62c0-5.86 4.78-10.63 10.67-10.63 5.87 0 10.64 4.77 10.64 10.64 0 5.86-4.77 10.62-10.45 10.62Zm5.84-7.96c-.32-.16-1.88-.93-2.17-1.04-.29-.1-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.35-.26-.62-.52-.53-.71-.54h-.6c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65 0 1.56 1.14 3.07 1.3 3.28.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.2 2 .12.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37Z" />
        </svg>
      </span>
      <span className="pointer-events-none ml-3 -translate-x-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-xs font-medium text-stone-800 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        Chat with us
      </span>
    </motion.a>
  );
}
