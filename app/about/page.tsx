'use client';

import {
  Users,
  Target,
  Zap,
  Globe,
  Award,
  TrendingUp,
  Heart,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <section className="border-b border-gray-100 px-5 py-16 lg:px-8 bg-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="prose-h1 text-gray-900 mb-4">
            About <span className="text-[#d71927]">Remopay</span>
          </h1>
          <p className="prose-p text-gray-600">
            Revolutionizing payments and financial services across Africa with technology,
            innovation, and customer-first approach.
          </p>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="px-5 py-20 lg:px-8 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: 'Our Mission',
                desc: 'To provide fast, secure, and affordable payment solutions that empower individuals and businesses across Africa to transact with confidence.',
              },
              {
                icon: Globe,
                title: 'Our Vision',
                desc: 'To become the leading digital payment platform in Africa, enabling seamless financial transactions and fostering economic growth.',
              },
              {
                icon: Heart,
                title: 'Our Values',
                desc: 'Customer-first approach, innovation, integrity, security, and social responsibility guide everything we do.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-gray-200 bg-white p-8 hover:shadow-sm transition"
                >
                  <Icon className="h-10 w-10 text-[#d71927] mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="bg-gray-50/50 px-5 py-20 lg:px-8 border-t border-gray-100">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our <span className="text-[#d71927]">Story</span>
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed text-sm">
                <p>
                  Founded in 2023, Remopay was born from a simple observation: millions of
                  Africans struggled with outdated, expensive, and unreliable payment systems.
                </p>
                <p>
                  Our founders, driven by a passion for financial inclusion, set out to build
                  a platform that would make payments as simple as sending a message. What
                  started as a small team in Lagos has grown into a mission-driven fintech company
                  serving customers across Nigeria.
                </p>
                <p>
                  Today, Remopay is processing thousands of transactions daily, helping individuals
                  and businesses access essential financial services with ease. We're just getting
                  started.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="text-sm font-semibold text-gray-500">Platform stats coming soon</p>
              <p className="text-xs text-gray-400 mt-2">Real-time usage data will be displayed here once available.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Remopay */}
      <section className="px-5 py-20 lg:px-8 bg-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose <span className="text-[#d71927]">Remopay?</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: 'Lightning Fast',
                desc: 'Transactions completed in seconds, not hours.',
              },
              {
                icon: Shield,
                title: 'Bank-Level Security',
                desc: 'Military-grade encryption protects your data.',
              },
              {
                icon: TrendingUp,
                title: 'Transparent Pricing',
                desc: 'No hidden fees. You see costs upfront.',
              },
              {
                icon: Award,
                title: 'Award-Winning Support',
                desc: '24/7 customer support in your language.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-gray-200 bg-white p-6 hover:shadow-sm transition"
                >
                  <Icon className="h-8 w-8 text-[#d71927] mb-3" />
                  <h3 className="font-semibold mb-2 text-gray-900 text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Leadership */}
      {/* <section className="bg-gray-50/50 px-5 py-20 lg:px-8 border-t border-gray-100">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our <span className="text-[#d71927]">Leadership</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Chisom Obi',
                title: 'CEO & Co-Founder',
                bio: 'Former fintech executive with 10+ years of experience in digital payments.',
              },
              {
                name: 'Adebayo Adeyemi',
                title: 'CTO & Co-Founder',
                bio: 'Software engineer passionate about building scalable financial systems.',
              },
              {
                name: 'Nkechi Ijeoma',
                title: 'COO',
                bio: 'Operations expert focused on customer experience and team growth.',
              },
              {
                name: 'Tunde Akintola',
                title: 'Head of Compliance',
                bio: 'Regulatory specialist ensuring Remopay meets all compliance standards.',
              },
            ].map((member, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-gray-200 bg-white p-6 text-center hover:shadow-sm transition"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-[#d71927] to-[#a0101a] rounded-full mx-auto mb-4" />
                <h3 className="font-semibold text-sm mb-1 text-gray-900">{member.name}</h3>
                <p className="text-xs text-[#d71927] font-semibold mb-3">{member.title}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Timeline */}
      {/* <section className="px-5 py-20 lg:px-8 bg-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our <span className="text-[#d71927]">Journey</span>
          </h2>

          <div className="space-y-8">
            {[
              {
                year: '2023 Q1',
                title: 'Remopay Founded',
                desc: 'Three passionate founders come together with a vision to revolutionize African fintech.',
              },
              {
                year: '2023 Q3',
                title: 'MVP Launch',
                desc: 'Remopay officially launches with airtime purchase and data bundles.',
              },
              {
                year: '2024 Q1',
                title: 'Expansion',
                desc: 'Added bill payments, TV subscriptions, and wallet funding services.',
              },
              {
                year: '2024 Q3',
                title: '50K Users Milestone',
                desc: 'Reached 50,000 active users and processed ₦1 billion in transactions.',
              },
              {
                year: '2025 Q1',
                title: 'Virtual Cards Launch',
                desc: 'Introduced virtual dollar cards for secure online shopping.',
              },
              {
                year: '2025 Q3',
                title: 'Multi-Currency Support',
                desc: 'Launched multi-currency accounts enabling global transactions.',
              },
            ].map((event, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 bg-[#d71927] rounded-full" />
                  {idx !== 5 && <div className="w-1 h-20 bg-gray-300 mt-2" />}
                </div>
                <div className="pb-8">
                  <p className="text-xs font-semibold text-[#d71927] mb-2">{event.year}</p>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Social Responsibility */}
      <section className="bg-gray-50/50 px-5 py-20 lg:px-8 border-t border-gray-100">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Social <span className="text-[#d71927]">Responsibility</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Financial Inclusion',
                desc: 'We\'re committed to bringing banking services to the unbanked and underbanked populations across Africa.',
              },
              {
                icon: Globe,
                title: 'Sustainable Growth',
                desc: 'We invest in technology and infrastructure that promotes long-term economic development.',
              },
              {
                icon: Heart,
                title: 'Community Support',
                desc: 'Remopay supports local communities through educational programs and charitable initiatives.',
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-lg border border-gray-200 bg-white p-8 hover:shadow-sm transition"
                >
                  <Icon className="h-10 w-10 text-[#d71927] mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Careers */}
      {/* <section className="px-5 py-20 lg:px-8 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-lg border border-[#d71927]/20 bg-gradient-to-r from-[#d71927] to-[#a0101a] p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4 text-white">Join Our Team</h2>
                <p className="text-white/90 mb-6 text-sm">
                  We're looking for passionate, talented individuals who share our vision of
                  revolutionizing fintech in Africa. If you're ready to make an impact, we'd
                  love to hear from you.
                </p>
                <Link
                  href="mailto:careers@remopay.com"
                  className="inline-flex items-center gap-3 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#9b111e] transition hover:bg-white/90"
                >
                  Explore Opportunities
                </Link>
              </div>

              <div className="space-y-4">
                <p className="font-semibold text-white text-sm">Open Positions:</p>
                <ul className="space-y-3 text-white/90 text-sm">
                  <li className="flex gap-2">
                    <span className="text-[#ff737b]">•</span>
                    <span>Software Engineers (Backend, Frontend, Mobile)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#ff737b]">•</span>
                    <span>Product Managers</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#ff737b]">•</span>
                    <span>Customer Success Specialists</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#ff737b]">•</span>
                    <span>Marketing & Growth Specialists</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Contact */}
      <section className="border-t border-gray-100 px-5 py-20 lg:px-8 bg-white">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-black mb-6 text-gray-900">Get In Touch</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Have questions about Remopay? We'd love to hear from you. Reach out to our team
            anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Email', value: 'remopay.operations@gmail.com' },
              { label: 'Phone', value: '+1 833 803 2507' },
              { label: 'Location', value: 'Lagos, Nigeria' },
            ].map((contact, idx) => (
              <div key={idx} className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6">
                <p className="text-sm text-gray-600 mb-2">{contact.label}</p>
                <p className="font-black text-lg text-gray-900">{contact.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
