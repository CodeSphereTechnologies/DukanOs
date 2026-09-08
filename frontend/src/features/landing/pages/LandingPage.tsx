import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ─── Minimal Icon set (inline SVG) ─────────────────────────────────────── */
const Icon = {
  Zap: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Shield: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Receipt: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
    </svg>
  ),
  Package: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Wallet: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
    </svg>
  ),
  Lock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Play: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  TrendUp: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Layers: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
    </svg>
  ),
  Globe: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
};

/* ─── Animated number counter ─────────────────────────────────────────────── */
function AnimatedCounter({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 0;
          const duration = 1500;
          const step = end / (duration / 16);
          const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ─── Feature card ────────────────────────────────────────────────────────── */
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group relative p-6 rounded-2xl border border-neutral-100 bg-white hover:border-[#C1FBD4] hover:shadow-lg transition-all duration-300">
      <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-700 mb-4 group-hover:bg-[#C1FBD4] group-hover:border-[#C1FBD4] group-hover:text-neutral-900 transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-neutral-900 mb-1.5 tracking-tight">{title}</h3>
      <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
    </div>
  );
}


/* ─── Landing Page ────────────────────────────────────────────────────────── */
export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-sans antialiased">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-neutral-100 shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[#000000] rounded-lg flex items-center justify-center">
              <div className="w-3 h-3 bg-[#C1FBD4] rounded-sm" />
            </div>
            <span className="font-bold text-neutral-900 tracking-tight">DukanOS</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">How it Works</a>
            <a href="#roles" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Roles</a>
            <a href="#security" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Security</a>
          </nav>
          <Link
            to="/login"
            className="h-9 px-4 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors flex items-center gap-2"
          >
            Sign In <Icon.ArrowRight />
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col bg-[#0A0A0A] overflow-hidden">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        {/* Mint glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C1FBD4] rounded-full opacity-[0.04] blur-3xl pointer-events-none" />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-28 pb-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C1FBD4]/30 bg-[#C1FBD4]/10 mb-8">
            <div className="w-1.5 h-1.5 bg-[#C1FBD4] rounded-full animate-pulse" />
            <span className="text-xs font-medium text-[#C1FBD4] tracking-wide">Multi-Tenant SaaS POS Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] mb-6 max-w-4xl">
            Run your store.<br />
            <span className="text-[#C1FBD4]">Own your numbers.</span>
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl leading-relaxed mb-10">
            DukanOS is a complete point-of-sale and retail management system built for electrical stores. Invoices, inventory, payroll, ledger — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              className="h-12 px-8 bg-white text-neutral-900 font-semibold rounded-xl hover:bg-[#C1FBD4] transition-all duration-200 flex items-center gap-2 justify-center text-sm"
            >
              Open Dashboard <Icon.ArrowRight />
            </Link>
            <a
              href="#demo-video"
              className="h-12 px-8 border border-white/15 text-white font-medium rounded-xl hover:border-white/30 hover:bg-white/5 transition-all duration-200 flex items-center gap-2.5 justify-center text-sm"
            >
              <Icon.Play /> Watch Demo
            </a>
          </div>

          {/* Illustration */}
          <div className="mt-20 w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img
              src="/hero-illustration.jpg"
              alt="DukanOS dashboard preview"
              className="w-full h-auto"
              loading="eager"
            />
          </div>
        </div>
      </section>

      {/* ── Demo Video ─────────────────────────────────────────────────── */}
      <section id="demo-video" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-block mb-4 px-3 py-1 rounded-full bg-[#C1FBD4] text-xs font-semibold text-[#064E3B] tracking-wide uppercase">Overview</div>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-4">See DukanOS in action</h2>
          <p className="text-neutral-500 mb-12 max-w-xl mx-auto">Watch how a real dukan runs on DukanOS — from opening the till to closing the day's books.</p>

          {/* Video placeholder */}
          <div
            className="relative w-full aspect-video bg-neutral-900 rounded-2xl flex flex-col items-center justify-center border border-neutral-200 overflow-hidden cursor-pointer group"
            onClick={() => {}}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-950" />
            {/* Subtle grid */}
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-[#C1FBD4] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <svg className="w-6 h-6 text-neutral-900 ml-1" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <p className="text-neutral-400 text-sm font-medium">Video coming soon — record your overview here</p>
              <p className="text-neutral-600 text-xs">Recommended: 1920×1080, 2–4 minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-[#0A0A0A]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { label: 'Modules Built', end: 14, suffix: '+' },
              { label: 'User Roles', end: 5, suffix: '' },
              { label: 'Report Types', end: 8, suffix: '+' },
              { label: 'Audit Actions Tracked', end: 20, suffix: '+' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="text-4xl font-bold text-white mb-1 tabular-nums">
                  <AnimatedCounter end={s.end} suffix={s.suffix} />
                </div>
                <p className="text-sm text-neutral-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-3 py-1 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600 tracking-wide uppercase">Everything your store needs</div>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
              Built for real retail operations
            </h2>
            <p className="text-neutral-500 max-w-2xl mx-auto">
              From the sales counter to the accountant's desk — every workflow your store runs daily, handled in one system.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FeatureCard
              icon={<Icon.Zap />}
              title="Lightning-Fast POS"
              desc="Barcode scanning, product search, instant invoice creation — optimised for speed at the counter."
            />
            <FeatureCard
              icon={<Icon.Receipt />}
              title="Invoices & Quotations"
              desc="Create itemised invoices with discounts, partial payments, and print to thermal or A4 instantly."
            />
            <FeatureCard
              icon={<Icon.Package />}
              title="Product Catalogue"
              desc="Dynamic electrical specifications engine. Wattage, voltage, warranty — customise spec fields per product."
            />
            <FeatureCard
              icon={<Icon.BarChart />}
              title="Sales Reports"
              desc="Daily, monthly and custom-range sales summaries with revenue and outstanding receivables at a glance."
            />
            <FeatureCard
              icon={<Icon.Users />}
              title="Customer Ledger"
              desc="Full customer payment history, outstanding balances, ledger adjustments and printable ledger reports."
            />
            <FeatureCard
              icon={<Icon.Wallet />}
              title="Daily Expense Ledger"
              desc="Track rent, utilities, maintenance — any custom income or expense category, print day-end summaries."
            />
            <FeatureCard
              icon={<Icon.TrendUp />}
              title="Payroll Management"
              desc="Employee records, monthly salary generation, mark paid, and auto-reflect in financial reports."
            />
            <FeatureCard
              icon={<Icon.Globe />}
              title="Returns & Refunds"
              desc="Linked to original invoice, restores stock, and applies cash refund or customer credit automatically."
            />
          </div>
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Illustration */}
            <div className="order-last md:order-first">
              <div className="rounded-2xl overflow-hidden border border-neutral-100 shadow-lg">
                <img
                  src="/pos-illustration.jpg"
                  alt="DukanOS POS terminal"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            </div>
            {/* Text */}
            <div>
              <div className="inline-block mb-4 px-3 py-1 rounded-full bg-[#C1FBD4] text-xs font-semibold text-[#064E3B] tracking-wide uppercase">Workflow</div>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-6">
                Designed around<br />how you actually work
              </h2>
              <div className="space-y-6">
                {[
                  { step: '01', title: 'Open the till', desc: 'Cashier logs in and the POS screen is ready — search or scan products instantly.' },
                  { step: '02', title: 'Create an invoice', desc: 'Add products, set quantities, apply discounts, select payment type, and print receipt in seconds.' },
                  { step: '03', title: 'Close the day', desc: "Manager reviews daily sales, expenses, and pending ledger. Accountant checks financial report." },
                  { step: '04', title: 'Owner sees everything', desc: 'Full audit trail, payroll run, inventory alerts, and multi-tenant platform controls.' },
                ].map(item => (
                  <div key={item.step} className="flex gap-5">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900 text-sm mb-0.5">{item.title}</h4>
                      <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Roles ─────────────────────────────────────────────────────── */}
      <section id="roles" className="py-24 bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-3 py-1 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600 tracking-wide uppercase">Role-based access</div>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight mb-4">
              The right access for every person
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
              Five distinct roles — each with the exact permissions they need, nothing more.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {
                title: 'Super Admin',
                tag: 'Platform',
                color: 'bg-neutral-900 text-white',
                tagColor: 'bg-white/15 text-white',
                perms: ['Manage all tenants', 'Global specifications', 'Platform-level audit', 'SaaS controls'],
              },
              {
                title: 'Store Owner',
                tag: 'Full control',
                color: 'bg-[#C1FBD4] text-neutral-900',
                tagColor: 'bg-black/10 text-neutral-800',
                perms: ['All store modules', 'Team management', 'All reports', 'Store settings'],
              },
              {
                title: 'Manager',
                tag: 'Operations',
                color: 'bg-white text-neutral-900 border border-neutral-200',
                tagColor: 'bg-neutral-100 text-neutral-600',
                perms: ['Products & inventory', 'Create invoices', 'Customer management', 'Sales reports'],
              },
              {
                title: 'Cashier',
                tag: 'POS only',
                color: 'bg-white text-neutral-900 border border-neutral-200',
                tagColor: 'bg-neutral-100 text-neutral-600',
                perms: ['Scan & search products', 'Create invoices', 'Receive payments', 'Print receipts'],
              },
              {
                title: 'Accountant',
                tag: 'Finance',
                color: 'bg-white text-neutral-900 border border-neutral-200',
                tagColor: 'bg-neutral-100 text-neutral-600',
                perms: ['Financial dashboard', 'Manage payments', 'Customer ledger', 'Expense reports'],
              },
            ].map(r => (
              <div key={r.title} className={`p-5 rounded-2xl ${r.color}`}>
                <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-4 ${r.tagColor}`}>
                  {r.tag}
                </div>
                <h3 className="font-bold text-sm mb-4">{r.title}</h3>
                <ul className="space-y-2">
                  {r.perms.map(p => (
                    <li key={p} className="flex items-start gap-2 text-xs opacity-80">
                      <Icon.Check />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ───────────────────────────────────────────────────── */}
      <section id="security" className="py-24 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block mb-4 px-3 py-1 rounded-full border border-[#C1FBD4]/30 bg-[#C1FBD4]/10 text-xs font-semibold text-[#C1FBD4] tracking-wide uppercase">Security & Auditability</div>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-6">
                Every action.<br />Every change.<br />Recorded.
              </h2>
              <p className="text-neutral-400 mb-8 leading-relaxed">
                Full immutable audit logs — user, action, module, old value, new value, timestamp, IP and device. Nothing is ever silently changed.
              </p>
              <ul className="space-y-3">
                {[
                  'Tenant data completely isolated — no cross-store access',
                  'Role & permission middleware on every API endpoint',
                  'Immutable audit trail for all financial changes',
                  'Sanctum token authentication with session control',
                  'Price overrides, discounts, returns — all tracked',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-neutral-300">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#C1FBD4] flex items-center justify-center text-neutral-900 mt-0.5">
                      <Icon.Check />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              {/* Mock audit log */}
              {[
                { action: 'Invoice #1042 created', user: 'Cashier • Usman', time: '2 min ago', color: 'text-[#C1FBD4]' },
                { action: 'Product price updated', user: 'Manager • Tariq', time: '14 min ago', color: 'text-yellow-400' },
                { action: 'Salary paid — March', user: 'Owner • Akram', time: '1 hr ago', color: 'text-blue-400' },
                { action: 'Return processed #987', user: 'Manager • Tariq', time: '2 hr ago', color: 'text-orange-400' },
                { action: 'User login successful', user: 'Accountant • Sara', time: '3 hr ago', color: 'text-neutral-400' },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.03]">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full ${log.color.replace('text-', 'bg-')}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{log.action}</p>
                    <p className="text-xs text-neutral-500">{log.user}</p>
                  </div>
                  <span className="text-xs text-neutral-600 flex-shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Roadmap / Future ───────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block mb-4 px-3 py-1 rounded-full bg-neutral-100 text-xs font-semibold text-neutral-600 tracking-wide uppercase">Roadmap</div>
            <h2 className="text-3xl font-bold text-neutral-900 tracking-tight mb-4">
              Built to scale with your business
            </h2>
            <p className="text-neutral-500 max-w-xl mx-auto">
              Start with one store. Expand to a chain. DukanOS is a SaaS platform — the same architecture grows with you.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Icon.Globe />, label: 'Multiple Branches' },
              { icon: <Icon.Layers />, label: 'SaaS Subscriptions' },
              { icon: <Icon.Package />, label: 'Supplier & Purchase' },
              { icon: <Icon.Shield />, label: 'WhatsApp Notifications' },
            ].map(item => (
              <div key={item.label} className="p-5 rounded-2xl border border-neutral-100 bg-neutral-50 flex flex-col items-center gap-3 text-center">
                <div className="w-10 h-10 rounded-xl border border-neutral-200 bg-white flex items-center justify-center text-neutral-600">
                  {item.icon}
                </div>
                <p className="text-sm font-medium text-neutral-600">{item.label}</p>
                <div className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-500 text-xs">Coming soon</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-[#0A0A0A]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="w-14 h-14 mx-auto bg-[#C1FBD4] rounded-2xl flex items-center justify-center mb-8">
            <div className="w-6 h-6 bg-neutral-900 rounded-lg" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-6">
            Ready to open your<br />digital dukan?
          </h2>
          <p className="text-neutral-400 mb-10 text-lg leading-relaxed">
            Log in to your store dashboard and start managing products, invoices, and finances — all in one place.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 h-14 px-10 bg-[#C1FBD4] text-neutral-900 font-bold rounded-2xl hover:bg-white transition-all duration-200 text-base"
          >
            Open DukanOS <Icon.ArrowRight />
          </Link>
          <p className="mt-4 text-sm text-neutral-600">No credit card required</p>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="py-10 bg-[#000000] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-[#C1FBD4] rounded-sm" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">DukanOS</span>
          </div>
          <p className="text-xs text-neutral-600">
            © {new Date().getFullYear()} DukanOS. Multi-tenant retail management platform.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-xs text-neutral-600 hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
