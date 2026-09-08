import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ─── Inline SVG Icons ───────────────────────────────────────────────────── */
const ArrowRight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const PlayIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const icons = {
  zap:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  receipt: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  package: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  bar:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  users:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  wallet:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></svg>,
  trend:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  refresh: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  shield:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  globe:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  layers:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
};

/* ─── Animated counter ────────────────────────────────────────────────────── */
function Counter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        let v = 0;
        const step = end / (1400 / 16);
        const t = setInterval(() => { v += step; if (v >= end) { setCount(end); clearInterval(t); } else setCount(Math.floor(v)); }, 16);
      }
    }, { threshold: 0.6 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Feature card ────────────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#C1FBD4]/30 transition-all duration-300 backdrop-blur-sm">
      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 mb-4 group-hover:bg-[#C1FBD4]/10 group-hover:border-[#C1FBD4]/30 group-hover:text-[#C1FBD4] transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white mb-1.5 tracking-tight">{title}</h3>
      <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ─── Logo component (shared across page) ─────────────────────────────────── */
function Logo({ size = 28, light = false }: { size?: number; light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/logo.jpg"
        alt="DukanOS"
        width={size}
        height={size}
        className="rounded-lg"
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          filter: light ? 'invert(1)' : 'none',
        }}
      />
      <span
        className="font-bold tracking-tight"
        style={{
          fontSize: size * 0.55,
          color: light ? '#fff' : '#18181B',
        }}
      >
        DukanOS
      </span>
    </div>
  );
}

/* ─── Landing Page ────────────────────────────────────────────────────────── */
export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="min-h-screen bg-[#060608] text-white antialiased" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ══════════════════════════════════════════════════
          FLOATING NAVBAR — levitating pill
      ══════════════════════════════════════════════════ */}
      <header className="fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none" style={{ paddingTop: '16px' }}>
        <nav
          className="pointer-events-auto flex items-center gap-8 px-5 h-12 rounded-2xl transition-all duration-500"
          style={{
            background: scrolled
              ? 'rgba(10,10,12,0.85)'
              : 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: scrolled
              ? '1px solid rgba(255,255,255,0.08)'
              : '1px solid rgba(255,255,255,0.07)',
            boxShadow: scrolled
              ? '0 8px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset'
              : '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          {/* Logo */}
          <Logo size={22} light />

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            {[['#features','Features'],['#workflow','Workflow'],['#roles','Roles'],['#security','Security']].map(([href,label]) => (
              <a key={href} href={href} className="text-xs font-medium text-neutral-400 hover:text-white transition-colors">
                {label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <Link
            to="/login"
            className="flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold text-neutral-900 bg-white hover:bg-[#C1FBD4] transition-colors duration-200"
          >
            Sign In <ArrowRight />
          </Link>
        </nav>
      </header>

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 pt-20">

        {/* Background noise texture + subtle gradient */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(193,251,212,0.07) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(193,251,212,0.04) 0%, transparent 60%)',
        }} />

        {/* Faint grid */}
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
        }} />

        {/* Glowing orb behind hero image */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[30%] w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(193,251,212,0.06) 0%, transparent 70%)' }}
        />

        {/* Concentric rings */}
        {[480, 640, 800].map((s, i) => (
          <div key={s} className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white pointer-events-none"
            style={{ width: s, height: s, opacity: 0.025 - i * 0.005 }}
          />
        ))}

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-8 px-3.5 py-1.5 rounded-full border border-[#C1FBD4]/20 bg-[#C1FBD4]/[0.06]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C1FBD4] animate-pulse inline-block" />
            <span className="text-[11px] font-semibold text-[#C1FBD4] tracking-widest uppercase">Retail OS · POS Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-[72px] font-bold leading-[1.04] tracking-[-0.03em] mb-6"
            style={{ letterSpacing: '-0.03em' }}>
            Your store,<br />
            <span style={{
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(193,251,212,0.9) 50%, #ffffff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              running at full power.
            </span>
          </h1>

          <p className="text-lg text-neutral-400 max-w-xl leading-relaxed mb-10">
            Invoices, inventory, payroll, customer ledger — every part of your dukan managed from one beautiful dashboard.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/login"
              className="group inline-flex items-center gap-2 h-12 px-7 rounded-xl font-semibold text-sm text-neutral-900 transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #C1FBD4 0%, #a8f4bf 100%)', boxShadow: '0 0 24px rgba(193,251,212,0.25)' }}
            >
              Open Dashboard
              <span className="group-hover:translate-x-0.5 transition-transform duration-200"><ArrowRight /></span>
            </Link>
            <a href="#demo-video"
              className="inline-flex items-center gap-2.5 h-12 px-7 rounded-xl font-medium text-sm text-neutral-300 border border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-200"
            >
              <PlayIcon /> Watch Demo
            </a>
          </div>

          {/* Social proof micro line */}
          <p className="mt-6 text-xs text-neutral-600">Trusted by local stores — from the till to the books.</p>
        </div>

        {/* ── Hero dashboard image ── */}
        <div className="relative z-10 w-full max-w-5xl mx-auto mt-16">
          {/* Glow behind the image */}
          <div className="absolute -inset-px rounded-2xl pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(193,251,212,0.12) 0%, transparent 60%)', filter: 'blur(1px)' }}
          />
          <div className="relative rounded-2xl overflow-hidden border border-white/[0.08]"
            style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 80px rgba(193,251,212,0.04)' }}
          >
            <img src="/hero-v2.jpg" alt="DukanOS dashboard" className="w-full h-auto block" loading="eager" />
            {/* Fade out bottom */}
            <div className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
              style={{ background: 'linear-gradient(to top, #060608, transparent)' }}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          LOGO BAR / TRUST STRIP
      ══════════════════════════════════════════════════ */}
      <section className="py-12 border-y border-white/[0.05]">
        <div className="max-w-4xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-neutral-600 uppercase tracking-widest">Trusted module coverage</p>
          <div className="flex flex-wrap justify-center gap-6">
            {['POS · Invoicing','Inventory','Payroll','Customer Ledger','Daily Finance','Audit Trail'].map(t => (
              <span key={t} className="text-xs font-medium text-neutral-500 border border-white/[0.06] px-3 py-1 rounded-full">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { n: 14, s: '+', label: 'Modules built' },
            { n: 4,  s: '',  label: 'Staff role types' },
            { n: 8,  s: '+', label: 'Report types' },
            { n: 20, s: '+', label: 'Audited action types' },
          ].map(({ n, s, label }) => (
            <div key={label} className="text-center">
              <div className="text-4xl font-bold tracking-tight mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <Counter end={n} suffix={s} />
              </div>
              <p className="text-sm text-neutral-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════ */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 50%, rgba(193,251,212,0.03) 0%, transparent 70%)' }}
        />
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-14">
            <span className="inline-block mb-4 px-3 py-1 rounded-full border border-white/10 text-[11px] font-semibold text-neutral-400 tracking-widest uppercase">Everything your store needs</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
              One OS for your entire operation
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto text-sm leading-relaxed">
              From the sales counter to the accountant's desk — every daily workflow handled in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FeatureCard icon={icons.zap}     title="Lightning POS"        desc="Barcode scan, product search, instant checkout — optimised for counter speed." />
            <FeatureCard icon={icons.receipt} title="Invoices & Quotations" desc="Create invoices with discounts, partial payments and print thermal or A4." />
            <FeatureCard icon={icons.package} title="Product Catalogue"    desc="Dynamic spec engine — wattage, voltage, warranty — fully customisable." />
            <FeatureCard icon={icons.bar}     title="Sales Reports"        desc="Daily, monthly and custom-range summaries with outstanding receivables." />
            <FeatureCard icon={icons.users}   title="Customer Ledger"      desc="Full payment history, outstanding balances, ledger adjustments, printable." />
            <FeatureCard icon={icons.wallet}  title="Daily Finance"        desc="Track rent, utilities, salary — any income or expense category you define." />
            <FeatureCard icon={icons.trend}   title="Payroll"              desc="Employee records, monthly salary, mark paid, auto-reflects in reports." />
            <FeatureCard icon={icons.refresh} title="Returns & Refunds"    desc="Linked to original invoice, restores stock, applies cash or credit refund." />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          VIDEO PLACEHOLDER
      ══════════════════════════════════════════════════ */}
      <section id="demo-video" className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block mb-4 px-3 py-1 rounded-full border border-white/10 text-[11px] font-semibold text-neutral-400 tracking-widest uppercase">Product Demo</span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
            See DukanOS in action
          </h2>
          <p className="text-neutral-500 text-sm mb-12 max-w-md mx-auto">A walkthrough from opening the till to closing the day's books.</p>

          <div className="group relative w-full aspect-video rounded-2xl overflow-hidden cursor-pointer border border-white/[0.06]"
            style={{ background: 'linear-gradient(135deg, #0d0d10 0%, #111115 100%)', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.6)' }}
          >
            {/* Grid */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }} />
            {/* Glow ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-72 h-72 rounded-full border border-[#C1FBD4]/10 group-hover:border-[#C1FBD4]/20 transition-colors duration-500" />
            </div>
            {/* Play button */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full border border-[#C1FBD4]/30 bg-[#C1FBD4]/10 flex items-center justify-center text-[#C1FBD4] group-hover:bg-[#C1FBD4] group-hover:text-neutral-900 group-hover:scale-110 transition-all duration-300">
                <PlayIcon />
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-300">Video coming soon</p>
                <p className="text-xs text-neutral-600 mt-1">Recommended: 1920×1080 · 2–4 min</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          WORKFLOW
      ══════════════════════════════════════════════════ */}
      <section id="workflow" className="py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block mb-4 px-3 py-1 rounded-full border border-white/10 text-[11px] font-semibold text-neutral-400 tracking-widest uppercase">Daily Workflow</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-8" style={{ letterSpacing: '-0.02em' }}>
                Designed around<br />how you actually work
              </h2>
              <div className="space-y-7">
                {[
                  { n: '01', t: 'Open the till', d: 'Cashier logs in. POS screen is ready — search or scan products instantly.' },
                  { n: '02', t: 'Create an invoice', d: 'Add products, set quantities, apply discounts, choose payment, print receipt in seconds.' },
                  { n: '03', t: 'Close the day', d: 'Manager reviews daily sales and expenses. Accountant checks the financial summary.' },
                  { n: '04', t: 'Owner sees everything', d: 'Full audit trail, payroll runs, inventory alerts and complete financial control.' },
                ].map(({ n, t, d }) => (
                  <div key={n} className="flex gap-5">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full border border-[#C1FBD4]/30 bg-[#C1FBD4]/05 text-[#C1FBD4] text-[10px] font-bold flex items-center justify-center">{n}</div>
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-0.5">{t}</h4>
                      <p className="text-sm text-neutral-500 leading-relaxed">{d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* POS illustration */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(193,251,212,0.06) 0%, transparent 70%)' }}
              />
              <div className="relative rounded-2xl overflow-hidden border border-white/[0.06]"
                style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.6)' }}
              >
                <img src="/pos-illustration.jpg" alt="POS terminal" className="w-full h-auto block" loading="lazy" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          ROLES
      ══════════════════════════════════════════════════ */}
      <section id="roles" className="py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block mb-4 px-3 py-1 rounded-full border border-white/10 text-[11px] font-semibold text-neutral-400 tracking-widest uppercase">Role-Based Access</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style={{ letterSpacing: '-0.02em' }}>
              The right access for every person
            </h2>
            <p className="text-neutral-500 text-sm max-w-md mx-auto">Four distinct roles — each with exactly the permissions they need, nothing more.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                title: 'Store Owner',
                tag: 'Full control',
                highlight: true,
                perms: ['All store modules', 'Team management', 'All financial reports', 'Store settings & config'],
              },
              {
                title: 'Manager',
                tag: 'Operations',
                highlight: false,
                perms: ['Products & inventory', 'Create invoices', 'Customer management', 'Operational reports'],
              },
              {
                title: 'Cashier',
                tag: 'POS only',
                highlight: false,
                perms: ['Scan & search products', 'Create invoices', 'Receive payments', 'Print receipts'],
              },
              {
                title: 'Accountant',
                tag: 'Finance',
                highlight: false,
                perms: ['Financial dashboard', 'Manage payments', 'Customer ledger', 'Expense reports'],
              },
            ].map(r => (
              <div key={r.title}
                className="p-5 rounded-2xl border transition-all duration-200"
                style={{
                  background: r.highlight ? 'rgba(193,251,212,0.05)' : 'rgba(255,255,255,0.02)',
                  borderColor: r.highlight ? 'rgba(193,251,212,0.25)' : 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-4"
                  style={{
                    background: r.highlight ? 'rgba(193,251,212,0.15)' : 'rgba(255,255,255,0.06)',
                    color: r.highlight ? '#C1FBD4' : '#71717A',
                  }}
                >
                  {r.tag}
                </div>
                <h3 className="text-sm font-bold text-white mb-4">{r.title}</h3>
                <ul className="space-y-2.5">
                  {r.perms.map(p => (
                    <li key={p} className="flex items-start gap-2 text-xs text-neutral-400">
                      <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: r.highlight ? 'rgba(193,251,212,0.15)' : 'rgba(255,255,255,0.05)', color: r.highlight ? '#C1FBD4' : '#71717A' }}>
                        <CheckIcon />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECURITY
      ══════════════════════════════════════════════════ */}
      <section id="security" className="py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block mb-4 px-3 py-1 rounded-full border border-white/10 text-[11px] font-semibold text-neutral-400 tracking-widest uppercase">Security & Auditability</span>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5" style={{ letterSpacing: '-0.02em' }}>
                Every action.<br />Every change.<br />Recorded.
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-8">
                Full immutable audit logs — user, action, module, old value, new value, timestamp and IP address. Nothing is ever silently changed.
              </p>
              <ul className="space-y-3.5">
                {[
                  'Tenant data completely isolated — no cross-store access',
                  'Role & permission middleware on every API endpoint',
                  'Immutable audit trail for all financial changes',
                  'Token authentication with secure session control',
                  'Price overrides, discounts and returns — all tracked',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-neutral-400">
                    <span className="flex-shrink-0 w-4 h-4 mt-0.5 rounded-full bg-[#C1FBD4]/15 text-[#C1FBD4] flex items-center justify-center">
                      <CheckIcon />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Audit log mock */}
            <div className="space-y-2.5">
              {[
                { action: 'Invoice #1042 created', user: 'Cashier · Usman', time: '2 min ago', dot: '#C1FBD4' },
                { action: 'Product price updated', user: 'Manager · Tariq', time: '14 min ago', dot: '#FCD34D' },
                { action: 'Salary March marked paid', user: 'Owner · Akram', time: '1 hr ago', dot: '#93C5FD' },
                { action: 'Return processed #987', user: 'Manager · Tariq', time: '2 hr ago', dot: '#F9A8D4' },
                { action: 'Customer ledger adjusted', user: 'Accountant · Sara', time: '3 hr ago', dot: '#A5B4FC' },
                { action: 'User login successful', user: 'Cashier · Bilal', time: '4 hr ago', dot: '#71717A' },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3.5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-colors duration-150">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full" style={{ background: log.dot, boxShadow: `0 0 6px ${log.dot}60` }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{log.action}</p>
                    <p className="text-[10px] text-neutral-600 mt-0.5">{log.user}</p>
                  </div>
                  <span className="text-[10px] text-neutral-700 flex-shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          ROADMAP
      ══════════════════════════════════════════════════ */}
      <section className="py-24 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block mb-4 px-3 py-1 rounded-full border border-white/10 text-[11px] font-semibold text-neutral-400 tracking-widest uppercase">Roadmap</span>
            <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ letterSpacing: '-0.02em' }}>Built to scale with your business</h2>
            <p className="text-neutral-500 text-sm max-w-md mx-auto">Start with one store. Expand to a chain. The architecture grows with you.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: icons.globe,   label: 'Multiple Branches' },
              { icon: icons.layers,  label: 'SaaS Subscriptions' },
              { icon: icons.package, label: 'Supplier & Purchasing' },
              { icon: icons.shield,  label: 'WhatsApp Notifications' },
            ].map(item => (
              <div key={item.label} className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex flex-col items-center gap-3 text-center">
                <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-neutral-500">{item.icon}</div>
                <p className="text-xs font-medium text-neutral-400">{item.label}</p>
                <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] text-neutral-600">Coming soon</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════ */}
      <section className="py-32 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-6 text-center relative">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(193,251,212,0.06) 0%, transparent 70%)' }}
          />
          <div className="relative z-10">
            <div className="flex justify-center mb-8">
              <img src="/logo.jpg" alt="DukanOS" className="w-16 h-16 rounded-2xl" style={{ filter: 'invert(0)' }} />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6" style={{ letterSpacing: '-0.03em' }}>
              Ready to run your<br />dukan smarter?
            </h2>
            <p className="text-neutral-400 text-sm mb-10 leading-relaxed max-w-md mx-auto">
              Log in to your store dashboard and start managing products, invoices, and finances — all in one place.
            </p>
            <Link to="/login"
              className="inline-flex items-center gap-2.5 h-14 px-10 rounded-2xl font-bold text-neutral-900 transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #C1FBD4 0%, #a8f4bf 100%)', boxShadow: '0 0 40px rgba(193,251,212,0.2)' }}
            >
              Open DukanOS <ArrowRight />
            </Link>
            <p className="mt-4 text-xs text-neutral-700">No setup fees. Start immediately.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════ */}
      <footer className="py-8 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size={24} light />
          <p className="text-[11px] text-neutral-700">© {new Date().getFullYear()} DukanOS · Retail management platform</p>
          <Link to="/login" className="text-xs text-neutral-600 hover:text-white transition-colors">Sign In →</Link>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
