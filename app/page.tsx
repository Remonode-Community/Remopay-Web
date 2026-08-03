'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Gift,
  Globe,
  Headphones,
  Linkedin,
  Mail,
  ShieldCheck,
  Smartphone,
  Tv,
  Users,
  Wallet,
  Wifi,
  Zap,
} from 'lucide-react';
import { LandingTopbar } from '@/components/LandingTopbar';
import { DataPricingShowcase } from '@/components/vtu-public/DataPricingShowcase';
import { BlogSection } from '@/components/landing/BlogSection';

const heroSlides = [
  {
    title: 'Pay Everything.',
    highlight: 'Earn More.',
    suffix: 'Live Better.',
    desc: 'Your all-in-one payment platform for airtime, data, bills, TV subscriptions, wallet funding and more.',
    image:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1800&q=90',
  },
  {
    title: 'Fast Bills.',
    highlight: 'Instant VTU.',
    suffix: 'Zero Stress.',
    desc: 'Buy airtime, data, electricity tokens and subscriptions from one reliable  wallet.',
    image:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1800&q=90',
  },
  {
    title: 'Invite Friends.',
    highlight: 'Get Rewarded.',
    suffix: 'Repeat.',
    desc: 'Earn up to ₦200 when you refer verified customers who use Remopay.',
    image:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1800&q=90',
  },
];

const services = [
  {
    title: 'Airtime Recharge',
    desc: 'Recharge all major networks instantly.',
    icon: Smartphone,
    image:
      'https://api.remopay.remonode.com/remopay_airtime_recharge.jpg',
    href: '/',
  },
  {
    title: 'Data Bundles',
    desc: 'Buy affordable data bundles in seconds.',
    icon: Wifi,
    image:
      'https://api.remopay.remonode.com/remopay_data_bundles.jpg',
    href: '/',
  },
  {
    title: 'Electricity Bills',
    desc: 'Pay electricity bills and get tokens instantly.',
    icon: Zap,
    image:
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=900&q=85',
    href: '/',
  },
  {
    title: 'TV Subscription',
    desc: 'Renew DSTV, GOtv, Startimes and more.',
    icon: Tv,
    image:
      'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=900&q=85',
    href: '/',
  },
  {
    title: 'FX Conversion',
    desc: 'Convert From One Currency To Another Instantly.',
    icon: Wallet,
    image:
      'https://api.remopay.remonode.com/remopay_fx.jpg',
    href: '/',
  },
  {
    title: 'Virtual Dollar Card',
    desc: 'Create and manage virtual card instantly.',
    icon: CreditCard,
    image:
      'https://api.remopay.remonode.com/remopay_4_50.png',
    href: '/dashboard/virtual-card',
  },
  {
    title: 'Multi-Currency Accounts',
    desc: 'Hold and manage accounts in multiple currencies.',
    icon: Globe,
    image:
      'https://api.remopay.remonode.com/remo_pay_for_things.jpg',
    href: '/dashboard/multi-currency',
  },
];

const whyChoose = [
  {
    title: 'Lightning Fast',
    desc: 'Get your airtime, data and bills processed instantly.',
    icon: Zap,
  },
  {
    title: 'Secure & Safe',
    desc: 'Your transactions are protected and properly tracked.',
    icon: ShieldCheck,
  },
  {
    title: 'Rewards That Pay',
    desc: 'Earn cashback, bonuses and referral rewards.',
    icon: Gift,
  },
  {
    title: '24/7 Support',
    desc: 'Our support team is always here for you.',
    icon: Headphones,
  },
];



export default function RemopayLandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [servicesScroll, setServicesScroll] = useState(0);
  const servicesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slider = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);

    return () => clearInterval(slider);
  }, []);

  const scrollServices = (direction: 'left' | 'right') => {
    if (servicesRef.current) {
      const scrollAmount = 400;
      const newScroll =
        direction === 'left'
          ? servicesScroll - scrollAmount
          : servicesScroll + scrollAmount;
      servicesRef.current.scrollTo({ left: newScroll, behavior: 'smooth' });
      setServicesScroll(newScroll);
    }
  };

  const currentHero = heroSlides[activeSlide];

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <LandingTopbar />

      {/* ===== Hero Section ===== */}
      <section className="relative min-h-[560px] sm:min-h-[640px] md:min-h-[700px] lg:min-h-[760px] overflow-hidden pt-16 sm:pt-20">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === activeSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === activeSlide}
              fetchPriority={index === activeSlide ? 'high' : 'low'}
              sizes="100vw"
              className="object-cover object-[center_right] brightness-95 contrast-110 saturate-110"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute left-0 top-0 h-full w-[58%] bg-gradient-to-r from-black/80 to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(255,60,60,0.16),transparent_58%)]" />
          </div>
        ))}

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 sm:gap-10 px-5 py-14 sm:py-18 lg:py-24 lg:grid-cols-2 lg:px-8">
          <div>
            <h1 className="max-w-3xl display-xl text-white">
              {currentHero.title}
              <br />
              <span className="text-[#ff2635]">{currentHero.highlight}</span>
              <br />
              {currentHero.suffix}
            </h1>

            <p className="mt-4 sm:mt-6 max-w-xl body-lg text-white/85">
              {currentHero.desc}
            </p>

            <div className="mt-6 sm:mt-8 flex flex-wrap gap-3 sm:gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 sm:gap-3 rounded-xl bg-[#d71927] px-5 py-3 sm:px-6 sm:py-3.5 md:px-7 md:py-4 button-md text-white shadow-xl shadow-[#d71927]/30 transition hover:bg-[#b91420]"
              >
                Create Free Account <ArrowRight size={18} />
              </Link>

              <a
                href="#services"
                className="inline-flex items-center gap-2 sm:gap-3 rounded-xl border border-[#ff4b55]/50 bg-black/20 px-5 py-3 sm:px-6 sm:py-3.5 md:px-7 md:py-4 button-md text-white backdrop-blur transition hover:bg-white/10"
              >
                Explore Services <ArrowRight size={18} />
              </a>
            </div>

            <div className="mt-8 sm:mt-10 grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
              {[
                ['Instant Payments', '24/7', Zap],
                ['Secure Platform', 'Bank-level Security', ShieldCheck],
                ['Rewards & Bonuses', 'Earn as you pay', Gift],
                ['Trusted by Users', 'Across Nigeria', Users],
              ].map(([title, desc, Icon]: any) => (
                <div key={title} className="border-r border-white/15 pr-3 sm:pr-4 last:border-0">
                  <Icon className="mb-2 sm:mb-3 h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-white" />
                  <p className="label text-white">{title}</p>
                  <p className="mt-1 caption-xs text-white/65">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block" />

          <button
            onClick={() =>
              setActiveSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
            }
            className="absolute left-5 top-1/2 z-20 hidden h-10 w-10 lg:h-12 lg:w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/20 backdrop-blur transition hover:bg-white/10 lg:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            onClick={() => setActiveSlide((prev) => (prev + 1) % heroSlides.length)}
            className="absolute right-5 top-1/2 z-20 hidden h-10 w-10 lg:h-12 lg:w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/20 backdrop-blur transition hover:bg-white/10 lg:flex"
            aria-label="Next slide"
          >
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-6 sm:bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2.5 sm:gap-3">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveSlide(index)}
                className={`h-2.5 sm:h-3 rounded-full transition-all ${
                  index === activeSlide ? 'w-7 sm:w-8 bg-[#ff2635]' : 'w-2.5 sm:w-3 bg-white/50'
                }`}
                aria-label={`Go to hero slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== Services Section ===== */}
      <section id="services" className="border-t border-gray-100 bg-gray-50/50 px-5 py-14 sm:py-16 md:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header section */}
          <div className="mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Our <span className="text-[#d71927]">Services</span>
            </h2>
            <p className="mt-3 sm:mt-4 md:mt-5 max-w-2xl text-gray-600">
              Everything you need for everyday payments in one simple app.
            </p>

            <Link
              href="/auth/register"
              className="mt-6 sm:mt-7 md:mt-8 inline-flex items-center gap-2 sm:gap-3 rounded-xl bg-[#d71927] px-5 py-3 sm:px-6 sm:py-3.5 md:py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#b91420]"
            >
              View All Services <ArrowRight size={18} />
            </Link>
          </div>

          {/* Horizontally scrollable services */}
          <div className="relative">
            <div
              ref={servicesRef}
              className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 scrollbar-hide"
              style={{ scrollBehavior: 'smooth' }}
            >
              {services.map((service) => {
                const Icon = service.icon;

                return (
                  <div
                    key={service.title}
                    className="group flex-shrink-0 w-72 sm:w-80 md:w-96 overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-2 hover:border-red-200 hover:shadow-xl"
                  >
                    <div className="relative h-40 sm:h-48 md:h-56 overflow-hidden">
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        sizes="(max-width: 640px) 288px, (max-width: 768px) 320px, 384px"
                        className="object-cover brightness-95 contrast-110 saturate-110 transition duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 flex h-10 w-10 sm:h-11 sm:w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-[#d71927] shadow-lg">
                        <Icon className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                      </div>
                    </div>

                    <div className="p-4 sm:p-5 md:p-6">
                      <h3 className="text-lg font-bold text-gray-900">
                        {service.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        {service.desc}
                      </p>

                      <button
                        aria-label={`View ${service.title}`}
                        className="mt-4 sm:mt-5 flex h-8 w-8 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-[#d71927] text-white transition group-hover:translate-x-1"
                      >
                        <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <button
              onClick={() => scrollServices('left')}
              className="absolute left-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 -translate-x-6 items-center justify-center rounded-full border border-gray-300 bg-white shadow-md transition hover:bg-gray-50 lg:flex"
              aria-label="Scroll services left"
            >
              <ChevronLeft size={22} className="text-gray-600" />
            </button>

            <button
              onClick={() => scrollServices('right')}
              className="absolute right-0 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 translate-x-6 items-center justify-center rounded-full border border-gray-300 bg-white shadow-md transition hover:bg-gray-50 lg:flex"
              aria-label="Scroll services right"
            >
              <ChevronRight size={22} className="text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      {/* ===== Why Choose Remopay ===== */}
      <section id="security" className="bg-white px-5 py-10 sm:py-12 md:py-14 lg:px-8">
        <div className="mx-auto max-w-7xl border-t border-gray-200 pt-10 sm:pt-12 md:pt-14">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Why Choose <span className="text-[#d71927]">Remopay?</span>
            </h2>
            <p className="mt-3 text-gray-600">
              We make payments simple, fast and rewarding.
            </p>
          </div>

          <div className="mt-8 sm:mt-9 md:mt-10 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-2 md:overflow-visible md:pb-0 xl:grid-cols-4 scrollbar-hide">
            {whyChoose.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="shrink-0 w-[280px] snap-start rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 md:w-auto md:shrink md:snap-none transition hover:border-red-200 hover:shadow-sm"
                >
                  <Icon className="mb-4 sm:mb-5 md:mb-6 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-[#d71927]" />
                  <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-3 text-sm text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Data Pricing Showcase ===== */}
      <DataPricingShowcase />

      {/* ===== Rewards Section ===== */}
      <section id="rewards" className="bg-white px-5 pb-10 sm:pb-12 md:pb-14 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-r from-[#d71927] via-[#b91420] to-[#7f0f17] p-5 sm:p-6 md:p-8 shadow-xl lg:p-12">
          <div className="grid grid-cols-1 items-center gap-6 sm:gap-8 lg:grid-cols-[1fr_1fr_0.8fr]">
            <div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">
                Invite. Earn. Repeat.
              </h2>
              <p className="mt-3 sm:mt-4 max-w-md text-gray-100">
                Refer your friends and earn up to ₦200 per verified referral.
              </p>

              <Link
                href="/auth/register"
                className="mt-5 sm:mt-7 inline-flex items-center gap-2 sm:gap-3 rounded-xl bg-white px-5 py-3 sm:px-6 sm:py-3.5 md:py-4 text-sm font-bold text-[#d71927] shadow-sm transition hover:bg-gray-100"
              >
                Start Referring <ArrowRight size={18} />
              </Link>
            </div>

            <div className="relative flex justify-center">
              <div className="relative h-44 sm:h-52 md:h-60 w-full rounded-3xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=85"
                  alt="Referral rewards"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover brightness-95 contrast-110 saturate-110 shadow-2xl"
                />
              </div>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/45 via-black/10 to-transparent pointer-events-none" />
              <Gift className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 md:bottom-6 md:right-6 h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-white drop-shadow-lg" />
            </div>

            <div className="rounded-2xl border border-white/20 bg-black/20 p-5 sm:p-6 md:p-7 backdrop-blur">
              <p className="text-xs font-semibold text-white/70">Your Reward Wallet</p>
              <p className="mt-4 text-3xl font-bold text-white sm:text-4xl">₦200</p>
              <p className="mt-2 text-sm text-white/60">Available Balance</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Blog Section ===== */}
      <BlogSection />

      {/* ===== Download App Section ===== */}
      <section
        id="download-app"
        className="relative bg-white px-5 pb-16 sm:pb-20 md:pb-24 pt-6 sm:pt-8 md:pt-10 lg:px-8"
      >
        <div className="relative mx-auto max-w-7xl rounded-[1.5rem] sm:rounded-[1.75rem] md:rounded-[2rem] border border-gray-200 bg-gray-50 p-4 sm:p-6 md:p-8 shadow-sm lg:p-12">
          <div className="grid grid-cols-1 items-center gap-8 sm:gap-10 md:gap-12 lg:grid-cols-[1fr_0.9fr]">

            <div>
              <h2 className="max-w-xl text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
                Everything you need,
                <br />
                <span className="text-[#d71927]">right in your pocket.</span>
              </h2>

              <p className="mt-4 sm:mt-5 max-w-xl text-gray-600">
                Download the Remopay mobile app to buy airtime, data, pay bills, fund
                your wallet, track transactions, and earn rewards anytime.
              </p>

              <div className="mt-6 sm:mt-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-3 sm:mb-4">
                  <a
                    href="#"
                    className="inline-flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-5 py-3 sm:px-6 sm:py-3.5 text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    <Image
                      src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                      alt="Get it on Google Play"
                      width={180}
                      height={54}
                      className="h-8 sm:h-9 md:h-10 w-auto"
                      style={{ width: 'auto', height: '100%' }}
                    />
                  </a>

                  <a
                    href="#"
                    className="inline-flex items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-5 py-3 sm:px-6 sm:py-3.5 text-gray-700 shadow-sm transition hover:bg-gray-50"
                  >
                    <Image
                      src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                      alt="Download on the App Store"
                      width={180}
                      height={54}
                      className="h-8 sm:h-9 md:h-10 w-auto"
                      style={{ width: 'auto', height: '100%' }}
                    />
                  </a>
                </div>
                <a
                  href="https://api.remopay.remonode.com/Remopay.apk"
                  download
                  className="flex items-center justify-center gap-2 sm:gap-3 rounded-xl bg-[#d71927] px-5 py-3 sm:px-5 sm:py-3.5 md:px-6 md:py-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#b91420] w-full"
                >
                  Direct Download
                  <ArrowRight size={18} />
                </a>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              {/* Phone mockup frame */}
              <div className="relative">
                {/* Outer phone body */}
                <div className="relative h-[440px] w-[220px] sm:h-[520px] sm:w-[260px] md:h-[600px] md:w-[300px] lg:h-[680px] lg:w-[340px] rounded-[2rem] sm:rounded-[2.25rem] md:rounded-[2.75rem] lg:rounded-[3rem] bg-gradient-to-br from-gray-900 via-black to-gray-950 p-2 sm:p-2.5 md:p-3 shadow-2xl shadow-black/30">
                  {/* Phone bezel/frame */}
                  <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] md:rounded-[2.25rem] lg:rounded-[2.5rem] bg-black">
                    {/* Notch */}
                    <div className="absolute left-1/2 top-0 z-30 h-5 w-24 sm:h-6 sm:w-28 md:h-6 md:w-32 lg:h-7 lg:w-40 -translate-x-1/2 rounded-b-3xl bg-black shadow-lg" />
                    
                    {/* Screen */}
                    <div className="relative h-full w-full overflow-hidden bg-black">
                      <img
                        src="/remopay5.png"
                        alt="Remopay mobile app preview"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Screen reflection effect */}
                    <div className="absolute inset-0 rounded-[1.75rem] sm:rounded-[2rem] md:rounded-[2.25rem] lg:rounded-[2.5rem] bg-gradient-to-br from-white/10 via-transparent to-transparent" />

                    {/* Home indicator area */}
                    <div className="absolute bottom-2 left-1/2 z-30 h-1 w-20 sm:w-24 md:w-28 lg:w-32 -translate-x-1/2 rounded-full bg-white/20" />
                  </div>

                  {/* Phone side details */}
                  <div className="absolute left-0 top-32 z-20 h-12 w-1 rounded-r-lg bg-gray-700/60" />
                  <div className="absolute right-0 top-48 z-20 h-16 w-1 rounded-l-lg bg-gray-700/60" />
                  <div className="absolute right-0 top-80 z-20 h-16 w-1 rounded-l-lg bg-gray-700/60" />
                </div>

                {/* Floating stat cards */}
                <div className="absolute -left-10 top-32 hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-lg md:p-4 md:block">
                  <p className="text-xs font-semibold text-gray-500">Wallet Balance</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">₦25,680.50</p>
                </div>

                <div className="absolute -right-10 bottom-32 hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-lg md:p-4 md:block">
                  <p className="text-xs font-semibold text-gray-500">Reward Wallet</p>
                  <p className="mt-1 text-lg font-bold text-[#d71927]">₦200</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer id="about" className="border-t border-gray-200 bg-white px-5 py-8 sm:py-10 md:py-12 lg:px-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 sm:gap-8 md:gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Image src="/icon.png" alt="Remopay Logo" width={44} height={44} className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11" />
              <span className="text-lg font-bold text-gray-900">Remopay</span>
            </div>
            <p className="mt-4 sm:mt-5 max-w-sm text-sm text-gray-700">
              Pay smarter, live better with fast, secure and reliable payments.
            </p>
          </div>

          {[
            ['Company', [['About Us', '/about'], ['Careers', '/careers'], ['Blog', '/blog'], ['Contact Us', '/support']]],
            ['Help', [['FAQs', '/faq'], ['Support Center', '/support'], ['Terms of Service', '/terms'], ['Privacy Policy', '/privacy']]],
            ['Services', [['Airtime', '/vtu/airtime'], ['Data', '/vtu/data'], ['Electricity', '/vtu/bills'], ['TV Subscription', '/vtu/tv'], ['Multi-Currency', '/multi-currency'], ['More Services', '/vtu']]],
          ].map(([title, links]: any) => (
            <div key={title}>
              <h3 className="mb-3 sm:mb-4 text-sm font-bold text-gray-900">{title}</h3>
              <ul className="space-y-2 sm:space-y-3">
                {links.map((item: any) => (
                  <li key={item[0]}>
                    <Link href={item[1]} className="text-sm text-gray-700 hover:text-[#d71927] transition">{item[0]}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="mb-3 sm:mb-4 text-sm font-bold text-gray-900">Follow Us</h3>
            <div className="flex gap-2.5 sm:gap-3">
              <a
                href="https://www.linkedin.com/products/remonode-remopay/"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:border-red-200 hover:text-[#d71927] hover:bg-red-50 transition-colors"
                aria-label="Visit Remopay on LinkedIn"
                title="Visit Remopay on LinkedIn"
              >
                <Linkedin size={18} aria-hidden="true" />
              </a>
              <a
                href="mailto:support@remopay.com"
                className="flex h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 hover:border-red-200 hover:text-[#d71927] hover:bg-red-50 transition-colors"
                aria-label="Email support@remopay.com"
                title="Email support@remopay.com"
              >
                <Mail size={18} aria-hidden="true" />
              </a>
            </div>

            <p className="mt-5 sm:mt-6 text-xs text-gray-500">
              &copy; 2026 Remopay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
