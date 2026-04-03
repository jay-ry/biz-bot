'use client'

import Link from 'next/link'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ── Types ──────────────────────────────────────────────────────────────────
type ChatMessage = {
  role: 'bot' | 'user'
  text: string
}

// ── Chat conversation data ─────────────────────────────────────────────────
const CONVERSATION: ChatMessage[] = [
  { role: 'bot', text: 'Hi! How can I help you today?' },
  { role: 'user', text: 'Do you have tables available Friday?' },
  { role: 'bot', text: 'Yes! We have openings at 7pm and 8:30pm. Want me to book one?' },
  { role: 'user', text: '7pm for 2 please' },
  { role: 'bot', text: 'Done! Reservation confirmed for Friday 7pm.' },
]

const MESSAGE_DELAYS = [0, 900, 1800, 2800, 3700]
const LOOP_PAUSE = 2200
const INITIAL_OFFSET = 1500

// ── Typewriter config ──────────────────────────────────────────────────────
const PHRASES = ['answer every question.', 'book every table.', 'never miss a lead.', 'work while you sleep.']
const TYPE_SPEED = 75
const DELETE_SPEED = 40
const PAUSE_FULL = 1600
const PAUSE_EMPTY = 320

// ── Floating grid dots ─────────────────────────────────────────────────────
const GRID_DOTS = [
  { top: '15%', left: '6%',  dur: 9.0, xEnd: 20, delay: 0 },
  { top: '72%', left: '10%', dur: 11.0, xEnd: -20, delay: 1.4 },
  { top: '42%', left: '18%', dur: 8.5, xEnd: 20, delay: 0.7 },
  { top: '85%', left: '35%', dur: 10.5, xEnd: -20, delay: 2.1 },
  { top: '10%', left: '60%', dur: 9.8, xEnd: 20, delay: 0.4 },
  { top: '55%', left: '78%', dur: 8.2, xEnd: -20, delay: 1.8 },
]

// ── Features data ──────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: '24/7 Availability',
    description: 'Your AI never sleeps. Customers get instant answers any time — nights, weekends, holidays.',
    accent: 'cyan',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="9.5" stroke="#00ffff" strokeWidth="1.5" />
        <path d="M11 6V11L14.5 13.5" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: 'Custom Knowledge',
    description: 'Train BizBot on your menu, FAQs, hours, and policies — it learns exactly what your customers need to know.',
    accent: 'purple',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="16" height="14" rx="2" stroke="#bf00ff" strokeWidth="1.5" />
        <path d="M7 9H15M7 13H11" stroke="#bf00ff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: '1-Line Embed',
    description: 'One script tag. Works on any site — WordPress, Squarespace, Wix, Shopify, or hand-built HTML.',
    accent: 'cyan',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M8 6L3 11L8 16" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 6L19 11L14 16" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 4L10 18" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Booking Engine',
    description: 'Let customers book appointments directly through chat — no phone tag, no back-and-forth emails.',
    accent: 'purple',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="3" y="4" width="16" height="15" rx="2" stroke="#bf00ff" strokeWidth="1.5" />
        <path d="M7 2V5M15 2V5" stroke="#bf00ff" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 9H19" stroke="#bf00ff" strokeWidth="1.5" />
        <path d="M8 13H14M11 13V16" stroke="#bf00ff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Conversation Analytics',
    description: 'See what your customers are asking, track conversation volume, and improve your bot over time.',
    accent: 'cyan',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path d="M3 17L7 11L11 14L15 8L19 5" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 3V19H19" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Multi-Language Support',
    description: 'Serve customers in their preferred language. BizBot detects and replies in 50+ languages automatically.',
    accent: 'purple',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="9" stroke="#bf00ff" strokeWidth="1.5" />
        <path d="M11 2C11 2 7 6.5 7 11C7 15.5 11 20 11 20" stroke="#bf00ff" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M11 2C11 2 15 6.5 15 11C15 15.5 11 20 11 20" stroke="#bf00ff" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 11H20" stroke="#bf00ff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
]

// ── Steps data ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    number: '01',
    title: 'Connect your knowledge',
    description: 'Upload your menus, FAQs, hours, and policies. BizBot learns everything about your business.',
  },
  {
    number: '02',
    title: 'Train & customize',
    description: 'Teach your bot your brand voice, set its name, and preview live conversations before going live.',
  },
  {
    number: '03',
    title: 'Embed & go live',
    description: 'One <script> tag on any site. BizBot is live and answering 24/7 within minutes.',
  },
]

// ── Testimonials data ──────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "BizBot handles 80% of our customer questions. I literally don't need to check the phone on weekends anymore.",
    name: 'Maria S.',
    role: 'Restaurant Owner',
  },
  {
    quote: 'Setup took 12 minutes. I uploaded our service menu, and it was live on my Wix site the same day.',
    name: 'James T.',
    role: 'Salon Owner',
  },
  {
    quote: 'Our bookings jumped 40% in the first month. Customers love that they can book at 2am.',
    name: 'Priya K.',
    role: 'Spa Manager',
  },
]

// ── Component ──────────────────────────────────────────────────────────────
export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // ── Typewriter ─────────────────────────────────────────────────────────
  const [typedText, setTypedText] = useState('')
  const phraseIdxRef = useRef(0)
  const charIdxRef = useRef(0)
  const isDeletingRef = useRef(false)

  const tick = useCallback(() => {
    const phrase = PHRASES[phraseIdxRef.current]
    const deleting = isDeletingRef.current

    if (!deleting) {
      charIdxRef.current += 1
      setTypedText(phrase.slice(0, charIdxRef.current))
      if (charIdxRef.current === phrase.length) {
        isDeletingRef.current = true
        return PAUSE_FULL
      }
      return TYPE_SPEED
    } else {
      charIdxRef.current -= 1
      setTypedText(phrase.slice(0, charIdxRef.current))
      if (charIdxRef.current === 0) {
        isDeletingRef.current = false
        phraseIdxRef.current = (phraseIdxRef.current + 1) % PHRASES.length
        return PAUSE_EMPTY
      }
      return DELETE_SPEED
    }
  }, [])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    function schedule(delay: number) {
      timer = setTimeout(() => {
        const next = tick()
        schedule(next)
      }, delay)
    }
    schedule(TYPE_SPEED)
    return () => clearTimeout(timer)
  }, [tick])

  // ── Animated chat ──────────────────────────────────────────────────────
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([])
  const [showTyping, setShowTyping] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    function runCycle() {
      if (cancelled) return
      setVisibleMessages([])
      setShowTyping(false)

      CONVERSATION.forEach((msg, idx) => {
        const baseDelay = (idx === 0 ? INITIAL_OFFSET : 0) + MESSAGE_DELAYS[idx]

        if (msg.role === 'bot') {
          timers.push(
            setTimeout(() => {
              if (cancelled) return
              setShowTyping(true)
            }, baseDelay),
          )
          timers.push(
            setTimeout(() => {
              if (cancelled) return
              setShowTyping(false)
              setVisibleMessages((prev) => [...prev, msg])
            }, baseDelay + 950),
          )
        } else {
          timers.push(
            setTimeout(() => {
              if (cancelled) return
              setVisibleMessages((prev) => [...prev, msg])
            }, baseDelay),
          )
        }
      })

      const lastDelay = MESSAGE_DELAYS[MESSAGE_DELAYS.length - 1] + 950 + LOOP_PAUSE
      timers.push(
        setTimeout(() => {
          if (!cancelled) runCycle()
        }, INITIAL_OFFSET + lastDelay),
      )
    }

    runCycle()
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    const el = chatScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [visibleMessages, showTyping])

  // ── GSAP ───────────────────────────────────────────────────────────────
  useGSAP(
    () => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

      const ctx = gsap.context(() => {
        // Hero entrance
        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        heroTl
          .from('.hm2-badge', { opacity: 0, y: 16, duration: 0.55 })
          .from('.hm2-heading', { opacity: 0, y: 28, duration: 0.65 }, '-=0.3')
          .from('.hm2-body', { opacity: 0, y: 20, duration: 0.55 }, '-=0.35')
          .from('.hm2-ctas', { opacity: 0, y: 16, duration: 0.5 }, '-=0.3')
          .from('.hm2-chat', { opacity: 0, x: 40, duration: 0.75, ease: 'power2.out' }, '-=0.45')

        // Floating grid dots — horizontal drift
        gsap.utils.toArray<HTMLElement>('.hm2-dot').forEach((dot, i) => {
          const cfg = GRID_DOTS[i]
          gsap.to(dot, {
            x: cfg.xEnd,
            duration: cfg.dur,
            delay: cfg.delay,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          })
        })

        // Stats count-up on scroll
        const statEls = gsap.utils.toArray<HTMLElement>('.hm2-stat-num')
        const targets = [500, 2400000, 99.9]
        const suffixes = ['+', '', '%']
        const formatters = [
          (v: number) => `${Math.round(v)}+`,
          (v: number) => `${(v / 1000000).toFixed(1)}M`,
          (v: number) => `${v.toFixed(1)}%`,
        ]
        statEls.forEach((el, i) => {
          const obj = { val: 0 }
          gsap.to(obj, {
            val: targets[i],
            duration: 2,
            ease: 'power2.out',
            snap: { val: i === 2 ? 0.1 : 1 },
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
            onUpdate() {
              el.textContent = formatters[i](obj.val)
            },
          })
          // Set initial display
          el.textContent = i === 2 ? '0.0%' : i === 1 ? '0M' : '0+'
        })

        // Features heading
        gsap.from('.hm2-features-heading', {
          scrollTrigger: { trigger: '.hm2-features-heading', start: 'top 85%' },
          opacity: 0,
          y: 28,
          duration: 0.65,
          ease: 'power3.out',
        })

        // Feature cards stagger
        gsap.from('.hm2-feature-card', {
          scrollTrigger: { trigger: '.hm2-features-grid', start: 'top 80%' },
          opacity: 0,
          y: 36,
          duration: 0.55,
          stagger: 0.1,
          ease: 'power3.out',
        })

        // How it works steps
        gsap.from('.hm2-step', {
          scrollTrigger: { trigger: '.hm2-steps', start: 'top 80%' },
          opacity: 0,
          y: 32,
          duration: 0.55,
          stagger: 0.15,
          ease: 'power3.out',
        })

        // Testimonial cards
        gsap.from('.hm2-testimonial-card', {
          scrollTrigger: { trigger: '.hm2-testimonials-grid', start: 'top 80%' },
          opacity: 0,
          y: 32,
          duration: 0.55,
          stagger: 0.12,
          ease: 'power3.out',
        })

        // CTA banner
        gsap.from('.hm2-cta-content', {
          scrollTrigger: { trigger: '.hm2-cta-content', start: 'top 85%' },
          opacity: 0,
          y: 28,
          duration: 0.7,
          ease: 'power3.out',
        })
      }, containerRef)

      return () => ctx.revert()
    },
    { scope: containerRef },
  )

  return (
    <div
      ref={containerRef}
      style={{
        fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
        backgroundColor: '#050008',
        color: '#e8e8f0',
      }}
      className="min-h-screen overflow-x-hidden"
    >
      {/* ── Styles ────────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&display=swap');

        html { scroll-behavior: smooth; }

        @keyframes hm2-typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
        .hm2-typing-dot {
          animation: hm2-typing-bounce 1.2s ease-in-out infinite;
          background-color: #00ffff;
        }
        .hm2-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .hm2-typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes hm2-cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .hm2-typewriter-cursor {
          animation: hm2-cursor-blink 0.7s step-start infinite;
        }

        .hm2-scrollbar-none::-webkit-scrollbar { display: none; }
        .hm2-scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes hm2-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hm2-msg-appear {
          animation: hm2-msg-in 0.32s ease forwards;
        }

        @keyframes hm2-pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #00ffff; }
          50%       { opacity: 0.4; box-shadow: 0 0 2px #00ffff; }
        }
        .hm2-pulse-dot {
          animation: hm2-pulse-dot 1.8s ease-in-out infinite;
        }

        .hm2-feature-card {
          transition: border-color 200ms ease, box-shadow 200ms ease;
        }
        .hm2-feature-card.cyan-accent:hover {
          border-color: #00ffff;
          box-shadow: 0 0 20px rgba(0,255,255,0.18);
        }
        .hm2-feature-card.purple-accent:hover {
          border-color: #bf00ff;
          box-shadow: 0 0 20px rgba(191,0,255,0.18);
        }

        .hm2-primary-btn {
          background: linear-gradient(135deg, #00ffff 0%, #bf00ff 100%);
          box-shadow: 0 0 0px rgba(0,255,255,0);
          transition: box-shadow 200ms ease, transform 120ms ease;
        }
        .hm2-primary-btn:hover {
          box-shadow: 0 0 24px rgba(0,255,255,0.45);
          transform: translateY(-1px);
        }

        .hm2-corner {
          position: absolute;
          width: 10px;
          height: 10px;
        }
        .hm2-corner-tl {
          top: -1px; left: -1px;
          border-top: 2px solid #00ffff;
          border-left: 2px solid #00ffff;
        }
        .hm2-corner-tr {
          top: -1px; right: -1px;
          border-top: 2px solid #00ffff;
          border-right: 2px solid #00ffff;
        }
        .hm2-corner-bl {
          bottom: -1px; left: -1px;
          border-bottom: 2px solid #00ffff;
          border-left: 2px solid #00ffff;
        }
        .hm2-corner-br {
          bottom: -1px; right: -1px;
          border-bottom: 2px solid #00ffff;
          border-right: 2px solid #00ffff;
        }

        .hm2-stat-divider {
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(0,255,255,0.3), transparent);
        }

        @media (max-width: 640px) {
          .hm2-stat-divider { display: none; }
        }
      `}</style>

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 py-4"
        style={{
          backgroundColor: 'rgba(5,0,8,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(0,255,255,0.12)',
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: '1.35rem',
            background: 'linear-gradient(90deg, #00ffff 0%, #bf00ff 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            userSelect: 'none',
          }}
          aria-label="BizBot"
        >
          BizBot
        </span>

        {/* Nav actions */}
        <nav className="flex items-center gap-4" aria-label="Primary navigation">
          <Link
            href="/login"
            className="hidden sm:block text-sm font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ color: '#00ffff' }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="hm2-primary-btn text-sm font-semibold px-5 py-2.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffff]"
            style={{ color: '#000000' }}
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-10 pb-16 px-4 md:px-8 overflow-hidden">
        {/* Scanlines overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,255,255,0.015) 2px, rgba(0,255,255,0.015) 4px)',
            zIndex: 0,
          }}
        />

        {/* Radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 65% 55% at 25% 50%, rgba(0,255,255,0.07) 0%, transparent 70%)',
            zIndex: 0,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 45% 50% at 75% 50%, rgba(191,0,255,0.06) 0%, transparent 70%)',
            zIndex: 0,
          }}
        />

        {/* Floating grid dots */}
        {GRID_DOTS.map((dot, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="hm2-dot pointer-events-none absolute w-[3px] h-[3px] rounded-full"
            style={{
              top: dot.top,
              left: dot.left,
              backgroundColor: i % 2 === 0 ? 'rgba(0,255,255,0.5)' : 'rgba(191,0,255,0.5)',
              zIndex: 0,
            }}
          />
        ))}

        <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — copy */}
          <div className="flex flex-col gap-7">
            <span
              className="hm2-badge inline-flex w-fit items-center gap-2 text-xs font-semibold tracking-widest uppercase rounded-full px-4 py-1.5"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                color: '#00ffff',
                backgroundColor: 'rgba(0,255,255,0.1)',
                border: '1px solid rgba(0,255,255,0.3)',
                letterSpacing: '0.12em',
              }}
            >
              Neural Business Assistant
            </span>

            <h1
              className="hm2-heading text-4xl md:text-5xl lg:text-[3.75rem] font-bold leading-tight tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              The AI that{' '}
              <br className="hidden sm:block" />
              <span
                style={{
                  color: '#00ffff',
                  textShadow: '0 0 20px rgba(0,255,255,0.6)',
                }}
              >
                keeps your doors open
              </span>
            </h1>

            <p className="hm2-body text-lg max-w-xl leading-relaxed" style={{ color: 'rgba(232,232,240,0.7)' }}>
              BizBot learns your business inside out —{' '}
              <span style={{ color: '#00ffff', fontWeight: 500 }}>
                {typedText}
                <span
                  className="hm2-typewriter-cursor inline-block ml-0.5 w-[2px] h-[0.85em] align-middle rounded-sm"
                  aria-hidden="true"
                  style={{ backgroundColor: '#00ffff' }}
                />
              </span>
            </p>

            <p className="hm2-body -mt-3 text-base max-w-lg leading-relaxed" style={{ color: 'rgba(232,232,240,0.6)' }}>
              Answering customers, booking tables, and handling FAQs while you focus on what you love.
            </p>

            <div className="hm2-ctas flex flex-wrap gap-3 pt-1">
              <Link
                href="/signup"
                className="hm2-primary-btn inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffff]"
                style={{ color: '#000000' }}
              >
                Deploy your bot
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 7H11M11 7L7.5 3.5M11 7L7.5 10.5" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 text-sm font-semibold px-7 py-3.5 rounded-full transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffff]"
                style={{
                  color: '#00ffff',
                  border: '1px solid rgba(0,255,255,0.4)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,255,255,0.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                See it in action
              </a>
            </div>
          </div>

          {/* Right — animated chat widget */}
          <div className="hm2-chat hidden lg:flex justify-end">
            <div
              className="relative w-full max-w-sm rounded-2xl overflow-hidden"
              role="img"
              aria-label="Live demo: BizBot answering customer questions in real time"
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,255,255,0.2)',
                boxShadow: '0 0 40px rgba(0,255,255,0.08)',
              }}
            >
              {/* HUD corner brackets */}
              <span aria-hidden="true" className="hm2-corner hm2-corner-tl" />
              <span aria-hidden="true" className="hm2-corner hm2-corner-tr" />
              <span aria-hidden="true" className="hm2-corner hm2-corner-bl" />
              <span aria-hidden="true" className="hm2-corner hm2-corner-br" />

              {/* Chat header */}
              <div
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  backgroundColor: 'rgba(0,255,255,0.05)',
                  borderBottom: '1px solid rgba(0,255,255,0.15)',
                }}
              >
                <span
                  className="hm2-pulse-dot w-2.5 h-2.5 rounded-full shrink-0"
                  aria-hidden="true"
                  style={{ backgroundColor: '#00ffff' }}
                />
                <span
                  className="text-sm font-semibold tracking-wider"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#00ffff' }}
                >
                  ● BIZBOTAI
                </span>
                <span className="ml-auto text-xs" style={{ color: 'rgba(0,255,255,0.5)' }}>
                  ONLINE
                </span>
              </div>

              {/* Messages */}
              <div
                ref={chatScrollRef}
                className="flex flex-col gap-3 p-4 h-[268px] overflow-y-auto hm2-scrollbar-none"
              >
                {visibleMessages.map((msg, idx) =>
                  msg.role === 'bot' ? (
                    <div key={idx} className="flex items-end gap-2 hm2-msg-appear">
                      <div
                        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          backgroundColor: 'rgba(0,255,255,0.12)',
                          border: '1px solid rgba(0,255,255,0.3)',
                          color: '#00ffff',
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                      >
                        B
                      </div>
                      <div
                        className="text-sm px-3.5 py-2.5 rounded-2xl rounded-bl-sm max-w-[80%] leading-relaxed"
                        style={{
                          backgroundColor: 'rgba(0,255,255,0.08)',
                          border: '1px solid rgba(0,255,255,0.2)',
                          color: '#e8e8f0',
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="flex justify-end hm2-msg-appear">
                      <div
                        className="text-sm px-3.5 py-2.5 rounded-2xl rounded-br-sm max-w-[80%] leading-relaxed"
                        style={{
                          backgroundColor: 'rgba(191,0,255,0.12)',
                          border: '1px solid rgba(191,0,255,0.25)',
                          color: '#e8e8f0',
                        }}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ),
                )}

                {/* Typing indicator */}
                {showTyping && (
                  <div className="flex items-end gap-2 hm2-msg-appear">
                    <div
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                      style={{
                        backgroundColor: 'rgba(0,255,255,0.12)',
                        border: '1px solid rgba(0,255,255,0.3)',
                        color: '#00ffff',
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      B
                    </div>
                    <div
                      className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1.5"
                      style={{
                        backgroundColor: 'rgba(0,255,255,0.08)',
                        border: '1px solid rgba(0,255,255,0.2)',
                      }}
                    >
                      <span className="hm2-typing-dot w-1.5 h-1.5 rounded-full inline-block" />
                      <span className="hm2-typing-dot w-1.5 h-1.5 rounded-full inline-block" />
                      <span className="hm2-typing-dot w-1.5 h-1.5 rounded-full inline-block" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{ borderTop: '1px solid rgba(0,255,255,0.12)' }}
              >
                <div
                  className="flex-1 rounded-full px-4 py-2 text-sm select-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    color: 'rgba(232,232,240,0.3)',
                    border: '1px solid rgba(0,255,255,0.1)',
                  }}
                >
                  Type a message…
                </div>
                <button
                  type="button"
                  aria-label="Send message"
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-opacity duration-150 hover:opacity-80 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffff]"
                  style={{ background: 'linear-gradient(135deg, #00ffff 0%, #bf00ff 100%)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M1 13L13 7L1 1V5.5L9 7L1 8.5V13Z" fill="#000000" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <section
        className="py-14 px-4 md:px-8"
        style={{ backgroundColor: '#0d0008' }}
        aria-label="Key statistics"
      >
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-10 sm:gap-0">
          {/* Stat 1 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <span
              className="hm2-stat-num font-bold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '3rem',
                lineHeight: 1,
                color: '#00ffff',
                textShadow: '0 0 16px rgba(0,255,255,0.4)',
              }}
              aria-label="500+ active businesses"
            >
              500+
            </span>
            <span className="text-sm font-medium tracking-wide" style={{ color: 'rgba(232,232,240,0.5)' }}>
              Active businesses
            </span>
          </div>

          <div className="hm2-stat-divider self-stretch hidden sm:block" aria-hidden="true" />

          {/* Stat 2 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <span
              className="hm2-stat-num font-bold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '3rem',
                lineHeight: 1,
                color: '#00ffff',
                textShadow: '0 0 16px rgba(0,255,255,0.4)',
              }}
              aria-label="2.4 million messages handled"
            >
              2.4M
            </span>
            <span className="text-sm font-medium tracking-wide" style={{ color: 'rgba(232,232,240,0.5)' }}>
              Messages handled
            </span>
          </div>

          <div className="hm2-stat-divider self-stretch hidden sm:block" aria-hidden="true" />

          {/* Stat 3 */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <span
              className="hm2-stat-num font-bold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '3rem',
                lineHeight: 1,
                color: '#00ffff',
                textShadow: '0 0 16px rgba(0,255,255,0.4)',
              }}
              aria-label="99.9% guaranteed uptime"
            >
              99.9%
            </span>
            <span className="text-sm font-medium tracking-wide" style={{ color: 'rgba(232,232,240,0.5)' }}>
              Guaranteed uptime
            </span>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28 px-4 md:px-8" style={{ backgroundColor: '#050008' }}>
        <div className="max-w-7xl mx-auto">
          <div className="hm2-features-heading text-center mb-14">
            <h2
              className="text-3xl lg:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Everything your business needs,{' '}
              <span style={{ color: 'rgba(232,232,240,0.45)' }}>nothing it doesn&apos;t</span>
            </h2>
            <p className="mt-3 text-lg max-w-xl mx-auto" style={{ color: 'rgba(232,232,240,0.5)' }}>
              Set it up once. Let BizBot handle the rest — around the clock, without complaint.
            </p>
          </div>

          <div className="hm2-features-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className={`hm2-feature-card ${feature.accent}-accent rounded-2xl overflow-hidden cursor-default`}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: feature.accent === 'cyan'
                    ? '1px solid rgba(0,255,255,0.15)'
                    : '1px solid rgba(191,0,255,0.15)',
                }}
              >
                {/* Top accent line */}
                <div
                  aria-hidden="true"
                  className="h-[2px]"
                  style={{
                    backgroundColor: feature.accent === 'cyan' ? '#00ffff' : '#bf00ff',
                    opacity: 0.7,
                  }}
                />
                <div className="p-6 flex flex-col gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: feature.accent === 'cyan'
                        ? 'rgba(0,255,255,0.1)'
                        : 'rgba(191,0,255,0.1)',
                    }}
                  >
                    {feature.icon}
                  </div>
                  <div>
                    <h3
                      className="text-base font-semibold mb-1.5"
                      style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#e8e8f0' }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(232,232,240,0.55)' }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-20 md:py-28 px-4 md:px-8"
        style={{ backgroundColor: '#0d0008' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              From zero to deployed in{' '}
              <span style={{ color: '#00ffff', textShadow: '0 0 16px rgba(0,255,255,0.4)' }}>
                15 minutes
              </span>
            </h2>
            <p className="mt-3 text-lg max-w-xl mx-auto" style={{ color: 'rgba(232,232,240,0.5)' }}>
              No engineers required. No complex integrations. Just results.
            </p>
          </div>

          <div className="hm2-steps grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12 relative">
            {STEPS.map((step, idx) => (
              <div key={step.number} className="hm2-step flex flex-col items-center text-center gap-5 relative">
                {/* Connector dashed line (desktop only) */}
                {idx < STEPS.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden md:block absolute top-7 h-[1px]"
                    style={{
                      left: '60%',
                      width: 'calc(100% - 40px)',
                      borderTop: '1px dashed rgba(0,255,255,0.2)',
                      zIndex: 0,
                    }}
                  />
                )}

                {/* Step number circle */}
                <div
                  className="relative z-10 w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'rgba(0,255,255,0.06)',
                    border: '1px solid rgba(0,255,255,0.25)',
                  }}
                >
                  <span
                    className="font-bold text-xl"
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #00ffff 0%, #bf00ff 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      color: 'transparent',
                    }}
                  >
                    {step.number}
                  </span>
                </div>

                <div>
                  <h3
                    className="text-lg font-semibold mb-2"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#e8e8f0' }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: 'rgba(232,232,240,0.55)' }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-4 md:px-8" style={{ backgroundColor: '#050008' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-3xl lg:text-4xl font-bold tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              What business owners say
            </h2>
            <p className="mt-3 text-lg max-w-xl mx-auto" style={{ color: 'rgba(232,232,240,0.5)' }}>
              Real results from real local businesses.
            </p>
          </div>

          <div className="hm2-testimonials-grid grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <article
                key={t.name}
                className="hm2-testimonial-card rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(191,0,255,0.15)',
                }}
              >
                {/* Purple top accent */}
                <div
                  aria-hidden="true"
                  className="h-[2px]"
                  style={{ backgroundColor: '#bf00ff', opacity: 0.7 }}
                />
                <div className="p-6 flex flex-col gap-4">
                  {/* 5-star rating */}
                  <div className="flex gap-1" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M8 1.5L9.854 5.756L14.5 6.382L11.25 9.494L12.118 14.118L8 11.95L3.882 14.118L4.75 9.494L1.5 6.382L6.146 5.756L8 1.5Z"
                          fill="#00ffff"
                          fillOpacity="0.85"
                        />
                      </svg>
                    ))}
                  </div>

                  <blockquote
                    className="text-sm leading-relaxed flex-1"
                    style={{ color: 'rgba(232,232,240,0.75)' }}
                  >
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>

                  <div className="flex flex-col gap-0.5 pt-2" style={{ borderTop: '1px solid rgba(191,0,255,0.12)' }}>
                    <span
                      className="text-sm font-semibold"
                      style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#e8e8f0' }}
                    >
                      {t.name}
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(191,0,255,0.8)' }}>
                      {t.role}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section
        className="relative py-24 md:py-32 px-4 md:px-8 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #550000 0%, #0a0008 60%)',
          borderTop: '1px solid rgba(0,255,255,0.4)',
        }}
      >
        {/* Subtle glow overlay */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,255,255,0.05) 0%, transparent 70%)',
          }}
        />

        <div className="hm2-cta-content relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center gap-8">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Your competitors are sleeping.
            <br />
            <span style={{ color: '#00ffff', textShadow: '0 0 20px rgba(0,255,255,0.5)' }}>
              Your BizBot isn&apos;t.
            </span>
          </h2>

          <p className="text-lg max-w-lg mx-auto" style={{ color: 'rgba(232,232,240,0.6)' }}>
            Join 500+ local businesses running on autopilot.
          </p>

          <Link
            href="/signup"
            className="hm2-primary-btn inline-flex items-center gap-3 text-base font-semibold px-10 py-4 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffff]"
            style={{ color: '#000000' }}
          >
            Start for free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer
        className="py-8 px-4 md:px-8"
        style={{
          backgroundColor: '#050008',
          borderTop: '1px solid rgba(0,255,255,0.1)',
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: '1.1rem',
                background: 'linear-gradient(90deg, #00ffff 0%, #bf00ff 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              BizBot
            </span>
            <span className="text-sm" style={{ color: 'rgba(232,232,240,0.35)' }}>
              &copy; 2026 All rights reserved.
            </span>
          </div>

          <nav className="flex items-center gap-4" aria-label="Footer navigation">
            <Link
              href="/privacy"
              className="text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffff]"
              style={{ color: 'rgba(232,232,240,0.45)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#00ffff' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(232,232,240,0.45)' }}
            >
              Privacy Policy
            </Link>
            <span aria-hidden="true" style={{ color: 'rgba(232,232,240,0.2)' }}>|</span>
            <Link
              href="/terms"
              className="text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffff]"
              style={{ color: 'rgba(232,232,240,0.45)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#00ffff' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(232,232,240,0.45)' }}
            >
              Terms
            </Link>
            <span aria-hidden="true" style={{ color: 'rgba(232,232,240,0.2)' }}>|</span>
            <Link
              href="/contact"
              className="text-sm transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ffff]"
              style={{ color: 'rgba(232,232,240,0.45)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#00ffff' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(232,232,240,0.45)' }}
            >
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
