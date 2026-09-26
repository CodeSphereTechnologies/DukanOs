import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShoppingCart,
  Users,
  CreditCard,
  TrendingUp,
  Package,
  Shield,
  Receipt,
  RotateCcw,
  Building2,
  Sliders,
  History,
  UserCheck,
  Play
} from 'lucide-react';

/* ─── Animated counter ─── */
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
        const t = setInterval(() => {
          v += step;
          if (v >= end) { setCount(end); clearInterval(t); }
          else setCount(Math.floor(v));
        }, 16);
      }
    }, { threshold: 0.6 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [end]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Feature card ─── */
function FeatureCard({ icon, title, titleUrdu, desc, descUrdu }: { icon: React.ReactNode; title: string; titleUrdu: string; desc: string; descUrdu: string; }) {
  return (
    <div className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-[#C1FBD4]/30 transition-all duration-300 backdrop-blur-sm flex flex-col h-full">
      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 mb-5 group-hover:bg-[#C1FBD4]/10 group-hover:border-[#C1FBD4]/30 group-hover:text-[#C1FBD4] transition-all duration-300">
        {icon}
      </div>
      <div className="flex justify-between items-start gap-4 mb-2">
        <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
        <h3 className="text-lg font-bold text-[#C1FBD4] font-urdu leading-none" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }} dir="rtl">{titleUrdu}</h3>
      </div>
      <p className="text-sm text-neutral-400 leading-relaxed mb-3 flex-1">{desc}</p>
      <p className="text-[13px] text-neutral-500 leading-relaxed font-urdu" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }} dir="rtl">{descUrdu}</p>
    </div>
  );
}

/* ─── Landing Page ─── */
export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 32);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <div className="min-h-screen bg-[#060608] text-white antialiased overflow-x-hidden font-sans">
      
      {/* ─── NAVBAR ─── */}
      <header className="fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none" style={{ paddingTop: '16px' }}>
        <nav
          className="pointer-events-auto flex items-center justify-between px-5 h-14 rounded-2xl transition-all duration-500 w-[90%] max-w-6xl"
          style={{
            background: scrolled ? 'rgba(10,10,12,0.85)' : 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            border: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.07)',
            boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.5)' : '0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          <div className="flex items-center gap-2">
            <img src="/logo-light-rect-nobg.png" alt="DukanOS" className="h-6 object-contain" />
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Features</a>
            <a href="#demo" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Live Demo</a>
            <a href="#trust" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">Trust</a>
          </div>

          <Link to="/login" className="flex items-center gap-1.5 h-8 px-4 rounded-lg text-sm font-semibold text-neutral-900 bg-white hover:bg-[#C1FBD4] transition-colors duration-200">
            Sign In <ArrowRight className="w-4 h-4" />
          </Link>
        </nav>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(193,251,212,0.07) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '72px 72px' }} />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto">
          
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-[#C1FBD4]/20 bg-[#C1FBD4]/[0.06]">
            <span className="w-2 h-2 rounded-full bg-[#C1FBD4] animate-pulse" />
            <span className="text-xs font-semibold text-[#C1FBD4] tracking-widest uppercase">The Next-Gen Retail Operating System</span>
          </div>

          <h1 className="text-5xl md:text-[72px] font-bold leading-[1.1] tracking-tight mb-6">
            Empower Your Business.<br />
            <span style={{ background: 'linear-gradient(135deg, #ffffff 0%, rgba(193,251,212,0.9) 50%, #ffffff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Perfect Your Ledgers.
            </span>
          </h1>

          <h2 className="text-3xl md:text-4xl text-[#C1FBD4] font-urdu mb-8 leading-relaxed" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }} dir="rtl">
            اپنے کاروبار کو جدید اور محفوظ طریقے سے چلائیں۔ کھاتے، انوینٹری اور بلنگ اب ایک ہی جگہ پر۔
          </h2>

          <p className="text-lg text-neutral-400 max-w-2xl leading-relaxed mb-10">
            DukanOS is the ultimate Multi-Tenant POS and Retail Management Platform. From lightning-fast checkouts to intricate customer ledgers, daily cashflow tracking, and complete payroll management—take absolute control of your store's operations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link to="/login" className="group flex items-center justify-center gap-2 h-14 px-8 rounded-xl font-bold text-base text-neutral-900 transition-all duration-200 w-full sm:w-auto" style={{ background: 'linear-gradient(135deg, #C1FBD4 0%, #a8f4bf 100%)', boxShadow: '0 0 32px rgba(193,251,212,0.2)' }}>
              Launch Workspace
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#demo" className="flex items-center justify-center gap-3 h-14 px-8 rounded-xl font-semibold text-base text-white border border-white/10 hover:bg-white/5 transition-all duration-200 w-full sm:w-auto backdrop-blur-md">
              <Play className="w-5 h-5 text-[#C1FBD4]" /> Watch Loom Demo
            </a>
          </div>
        </div>
      </section>

      {/* ─── DEMO VIDEO SECTION ─── */}
      <section id="demo" className="py-24 relative border-t border-white/5 bg-black/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">See DukanOS in Action</h2>
            <p className="text-neutral-400 text-lg">A quick walkthrough of our lightning-fast POS and Ledger management.</p>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 shadow-2xl mx-auto max-w-4xl aspect-video flex items-center justify-center group cursor-pointer hover:border-[#C1FBD4]/30 transition-all">
            <div className="absolute inset-0 bg-[url('/hero-v2.jpg')] bg-cover bg-center opacity-40 group-hover:opacity-30 transition-opacity"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            
            <a href="#" className="relative z-10 flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 bg-[#C1FBD4] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(193,251,212,0.4)] group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 text-neutral-900 ml-1" />
              </div>
              <div>
                <span className="block text-xl font-bold text-white mb-2">Watch the Full Demo</span>
                <span className="block text-sm text-[#C1FBD4] font-urdu" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }} dir="rtl">
                  سسٹم کے مکمل فیچرز کا عملی مظاہرہ دیکھیں
                </span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ─── ALL FEATURES GRID ─── */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Complete Store Management</h2>
            <h3 className="text-2xl text-[#C1FBD4] font-urdu max-w-2xl mx-auto leading-relaxed" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }} dir="rtl">
              آپ کی دکان کی تمام ضروریات کے لیے ایک مکمل اور محفوظ ڈیجیٹل حل۔
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<ShoppingCart className="w-5 h-5" />}
              title="Advanced POS Terminal"
              titleUrdu="جدید پوسٹ ٹرمینل"
              desc="Lightning-fast checkout with barcode scanning, keyboard shortcuts, ledger payments, and instant receipt printing."
              descUrdu="تیز ترین بلنگ، بارکوڈ سکیننگ اور لیجر کھاتے کے ذریعے براہ راست ادائیگی کی سہولت۔"
            />
            <FeatureCard 
              icon={<Users className="w-5 h-5" />}
              title="Customer Ledgers"
              titleUrdu="کسٹمر کھاتہ"
              desc="Maintain accurate running balances. Record partial payments, track historical debt, and manage store credit natively."
              descUrdu="گاہکوں کے ادھار اور وصولیوں کا مکمل اور درست ریکارڈ۔ پرانے کھاتوں کا آسان حساب۔"
            />
            <FeatureCard 
              icon={<Package className="w-5 h-5" />}
              title="Products & Inventory"
              titleUrdu="اسٹاک اور انوینٹری"
              desc="Comprehensive stock tracking, variants, brands, low-stock alerts, and category management."
              descUrdu="اسٹاک کی مکمل تفصیلات، کیٹیگریز اور کم اسٹاک کی الرٹ کی سہولت۔"
            />
            <FeatureCard 
              icon={<Receipt className="w-5 h-5" />}
              title="Invoices & Quotations"
              titleUrdu="انوائس اور کوٹیشن"
              desc="Generate professional A4 PDF invoices and thermal receipts. Create pre-sale quotations instantly."
              descUrdu="پروفیشنل پی ڈی ایف انوائس اور تھرمل رسیدیں بنائیں۔"
            />
            <FeatureCard 
              icon={<RotateCcw className="w-5 h-5" />}
              title="Returns Module"
              titleUrdu="سامان کی واپسی"
              desc="Strict line-item validation for returns. Automatically restore stock and credit ledgers with full accountability."
              descUrdu="سامان کی واپسی کا محفوظ نظام، جس سے اسٹاک اور کھاتے خودکار طریقے سے اپڈیٹ ہوتے ہیں۔"
            />
            <FeatureCard 
              icon={<CreditCard className="w-5 h-5" />}
              title="Daily Cashflow & Finance"
              titleUrdu="روزمرہ کیش فلو"
              desc="Track daily till registers, expenses, and overall financial health in real-time."
              descUrdu="دکان کے روزمرہ اخراجات اور آمدنی کا مکمل حساب کتاب۔"
            />
            <FeatureCard 
              icon={<UserCheck className="w-5 h-5" />}
              title="Payroll & Salaries"
              titleUrdu="اسٹاف کی تنخواہیں"
              desc="Manage employee attendance, salary distributions, deductions, and bonuses smoothly."
              descUrdu="اپنے اسٹاف کی تنخواہوں، حاضری اور بونس کا مکمل اور آسان ریکارڈ رکھیں۔"
            />
            <FeatureCard 
              icon={<TrendingUp className="w-5 h-5" />}
              title="Reports & Analytics"
              titleUrdu="رپورٹس اور تجزیہ"
              desc="Deep insights into sales trends, top-selling items, and profit margins to drive growth."
              descUrdu="کاروبار کی ترقی جانچنے کے لیے سیلز اور منافع کی مکمل رپورٹس۔"
            />
            <FeatureCard 
              icon={<History className="w-5 h-5" />}
              title="Audit Trail"
              titleUrdu="آڈٹ ٹریل"
              desc="Absolute security. Every single action is logged so owners know exactly who did what, and when."
              descUrdu="سیکیورٹی کی ضمانت۔ ہر انٹری اور تبدیلی کا مکمل ریکارڈ تاکہ کوئی غلطی نہ ہو۔"
            />
            <FeatureCard 
              icon={<Shield className="w-5 h-5" />}
              title="Role-Based Access"
              titleUrdu="رول پر مبنی رسائی"
              desc="Assign precise roles: Owner, Manager, Cashier, or Accountant, restricting access to sensitive financial data."
              descUrdu="ملازمین کے لیے ان کی ذمہ داری کے مطابق مخصوص رسائی (جیسے کیشیئر، منیجر)۔"
            />
            <FeatureCard 
              icon={<Building2 className="w-5 h-5" />}
              title="Multi-Tenant Ready"
              titleUrdu="ملٹی ٹیننٹ سسٹم"
              desc="Built for scale. Manage multiple store branches or entire franchise ecosystems from a single Super Admin hub."
              descUrdu="ایک سے زائد دکانوں یا برانچز کو ایک ہی مرکزی ڈیش بورڈ سے کنٹرول کریں۔"
            />
            <FeatureCard 
              icon={<Sliders className="w-5 h-5" />}
              title="Custom Specifications"
              titleUrdu="مخصوص سیٹنگز"
              desc="Highly customizable product attributes and dynamic fields to match your specific industry needs."
              descUrdu="اپنے کاروبار کی نوعیت کے مطابق پراڈکٹس کی مخصوص سیٹنگز بنائیں۔"
            />
          </div>
        </div>
      </section>

      {/* ─── TRUST & STATS ─── */}
      <section id="trust" className="py-24 border-t border-white/5 relative overflow-hidden">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#C1FBD4]/5 blur-[120px] pointer-events-none" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-[#C1FBD4]/5 blur-[120px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Trusted by the best</h2>
          <p className="text-neutral-400 mb-16 font-urdu text-lg" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }} dir="rtl">پنجاب الیکٹرک اسٹور اور دیگر درجنوں کاروباری اداروں کا بھروسہ۔</p>
          
          <div className="flex flex-wrap justify-center gap-x-20 gap-y-12">
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-5xl font-bold text-white mb-2"><Counter end={99.9} suffix="%" /></span>
              <span className="text-sm font-medium text-neutral-500 uppercase tracking-widest">Uptime</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-5xl font-bold text-white mb-2"><Counter end={100} suffix="K+" /></span>
              <span className="text-sm font-medium text-neutral-500 uppercase tracking-widest">Invoices Processed</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-4xl md:text-5xl font-bold text-white mb-2"><Counter end={0} suffix="" /></span>
              <span className="text-sm font-medium text-neutral-500 uppercase tracking-widest">Data Breaches</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-12 bg-black">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo_nobg.png" alt="D" className="w-8 h-8 object-contain" />
            <div className="flex flex-col">
              <span className="font-bold text-white text-sm">DukanOS</span>
              <span className="text-xs text-neutral-500">Retail Management Platform</span>
            </div>
          </div>
          <p className="text-sm text-neutral-500">© {new Date().getFullYear()} DukanOS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
