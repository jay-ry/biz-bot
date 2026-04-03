'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ── Chat conversation data ─────────────────────────────────────────────────
type ChatMessage = {
  role: 'bot' | 'user'
  text: string
}

const CONVERSATION: ChatMessage[] = [
  { role: 'bot', text: 'Hi! How can I help you today?' },
  { role: 'user', text: 'Do you have tables available Friday?' },
  { role: 'bot', text: 'Yes! We have openings at 7pm and 8:30pm. Want me to book one?' },
  { role: 'user', text: '7pm for 2 please' },
  { role: 'bot', text: 'Done! Reservation confirmed for Friday 7pm.' },
]

// Delays (ms) between each message appearing after the previous one
const MESSAGE_DELAYS = [0, 900, 1800, 2800, 3700]
// How long after the last message before restarting the loop
const LOOP_PAUSE = 2200
// Offset after hero entrance before first message appears (~1.5s entrance)
const INITIAL_OFFSET = 1500

// ── Typewriter phrases ─────────────────────────────────────────────────────
const PHRASES = ['always on.', 'never offline.', 'booking 24/7.', 'always ready.']
const TYPE_SPEED = 75   // ms per character typed
const DELETE_SPEED = 40 // ms per character deleted
const PAUSE_FULL = 1600 // ms to hold the completed phrase
const PAUSE_EMPTY = 320 // ms to pause before typing next phrase

// ── Floating orb config ────────────────────────────────────────────────────
const ORBS = [
  { top: '18%', left: '8%',  dur: 6.2, yEnd: -32, delay: 0 },
  { top: '62%', left: '14%', dur: 7.8, yEnd: -24, delay: 1.1 },
  { top: '38%', left: '22%', dur: 5.4, yEnd: -38, delay: 0.6 },
  { top: '75%', left: '40%', dur: 8.1, yEnd: -20, delay: 1.8 },
  { top: '12%', left: '55%', dur: 6.7, yEnd: -30, delay: 0.3 },
  { top: '50%', left: '68%', dur: 5.9, yEnd: -42, delay: 2.2 },
  { top: '28%', left: '80%', dur: 7.3, yEnd: -26, delay: 0.9 },
  { top: '82%', left: '88%', dur: 6.5, yEnd: -36, delay: 1.5 },
]

// ── Feature card glow colours ──────────────────────────────────────────────
const CARD_GLOWS = [
  'rgba(101,254,8,0.22)',
  'rgba(0,255,255,0.22)',
  'rgba(191,0,255,0.22)',
]

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // ── Typewriter state ─────────────────────────────────────────────────────
  const [typedText, setTypedText] = useState('')
  const phraseIdxRef = useRef(0)
  const charIdxRef = useRef(0)
  const isDeletingRef = useRef(false)

  const tick = useCallback(() => {
    const phrase = PHRASES[phraseIdxRef.current]
    const deleting = isDeletingRef.current

    if (!deleting) {
      // Typing forward
      charIdxRef.current += 1
      setTypedText(phrase.slice(0, charIdxRef.current))
      if (charIdxRef.current === phrase.length) {
        // Finished typing — pause then start deleting
        isDeletingRef.current = true
        return PAUSE_FULL
      }
      return TYPE_SPEED
    } else {
      // Deleting
      charIdxRef.current -= 1
      setTypedText(phrase.slice(0, charIdxRef.current))
      if (charIdxRef.current === 0) {
        // Finished deleting — move to next phrase
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

  // ── Animated chat state ──────────────────────────────────────────────────
  const [visibleMessages, setVisibleMessages] = useState<ChatMessage[]>([])
  const [showTyping, setShowTyping] = useState(false)
  // Track the index of the next bot message that needs a typing indicator
  const chatCycleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clears all pending timers
  const clearChatCycle = () => {
    if (chatCycleRef.current) {
      clearTimeout(chatCycleRef.current)
      chatCycleRef.current = null
    }
  }

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
          // Show typing indicator first
          timers.push(
            setTimeout(() => {
              if (cancelled) return
              setShowTyping(true)
            }, baseDelay),
          )
          // Replace typing indicator with actual message after ~1s
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

      // Schedule next loop
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

  // Auto-scroll chat to bottom when messages or typing indicator change
  useEffect(() => {
    const el = chatScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [visibleMessages, showTyping])

  // ── GSAP animations ──────────────────────────────────────────────────────
  useGSAP(
    () => {
      const ctx = gsap.context(() => {
        // ── Hero entrance ──────────────────────────────────────────
        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })

        heroTl
          .from('.hero-badge', { opacity: 0, y: 16, duration: 0.6 })
          .from('.hero-heading', { opacity: 0, y: 28, duration: 0.7 }, '-=0.3')
          .from('.hero-body', { opacity: 0, y: 20, duration: 0.6 }, '-=0.4')
          .from('.hero-ctas', { opacity: 0, y: 16, duration: 0.5 }, '-=0.3')
          .from(
            '.hero-chat',
            { opacity: 0, x: 40, duration: 0.8, ease: 'power2.out' },
            '-=0.5',
          )

        // ── Floating orbs ──────────────────────────────────────────
        gsap.utils.toArray<HTMLElement>('.ambient-orb').forEach((orb, i) => {
          const cfg = ORBS[i]
          gsap.to(orb, {
            y: cfg.yEnd,
            duration: cfg.dur,
            delay: cfg.delay,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          })
        })

        // ── Features section scroll reveal ─────────────────────────
        gsap.from('.features-heading', {
          scrollTrigger: {
            trigger: '.features-heading',
            start: 'top 85%',
          },
          opacity: 0,
          y: 32,
          duration: 0.7,
          ease: 'power3.out',
        })

        gsap.from('.feature-card', {
          scrollTrigger: {
            trigger: '.features-grid',
            start: 'top 80%',
          },
          opacity: 0,
          y: 40,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power3.out',
        })

        // ── Feature card hover glow ────────────────────────────────
        gsap.utils.toArray<HTMLElement>('.feature-card').forEach((card, i) => {
          const glow = CARD_GLOWS[i] ?? CARD_GLOWS[0]

          card.addEventListener('mouseenter', () => {
            gsap.to(card, {
              boxShadow: `0 0 28px 5px ${glow}`,
              duration: 0.3,
              ease: 'power2.out',
            })
          })
          card.addEventListener('mouseleave', () => {
            gsap.to(card, {
              boxShadow: '0 0 0px 0px transparent',
              duration: 0.4,
              ease: 'power2.inOut',
            })
          })
        })

        // ── CTA banner scroll reveal ───────────────────────────────
        gsap.from('.cta-content', {
          scrollTrigger: {
            trigger: '.cta-content',
            start: 'top 85%',
          },
          opacity: 0,
          y: 32,
          duration: 0.8,
          ease: 'power3.out',
        })
      }, containerRef)

      return () => ctx.revert()
    },
    { scope: containerRef },
  )

  return (
    <div ref={containerRef} className="bg-black text-white min-h-screen">
      {/* ── Keyframe definitions ─────────────────────────────────────────── */}
      <style>{`
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
        .typing-dot {
          animation: typing-bounce 1.2s ease-in-out infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .typewriter-cursor {
          animation: cursor-blink 0.7s step-start infinite;
        }

        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

        @keyframes msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-appear {
          animation: msg-in 0.35s ease forwards;
        }
      `}</style>

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-4 md:px-6 py-4 bg-black/80 backdrop-blur-sm border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <Image src="/bizbot.png" alt="BizBot" width={150} height={48} priority />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:block text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-[#65fe08] text-black px-4 py-2 rounded-full hover:bg-[#4fcc00] transition-colors"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Lime green radial glow behind headline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 30% 50%, rgba(101,254,8,0.12) 0%, transparent 70%)',
          }}
        />

        {/* ── Ambient floating orbs ─────────────────────────────── */}
        {ORBS.map((orb, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="ambient-orb pointer-events-none absolute w-1.5 h-1.5 rounded-full bg-[#65fe08]/40"
            style={{ top: orb.top, left: orb.left }}
          />
        ))}

        <div className="relative w-full max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left — copy */}
          <div className="flex flex-col gap-6">
            <span className="hero-badge inline-flex w-fit items-center gap-2 text-xs font-semibold tracking-widest uppercase text-[#65fe08] bg-[#65fe08]/10 border border-[#65fe08]/20 rounded-full px-4 py-1.5">
              AI assistant for local businesses
            </span>

            <h1 className="hero-heading text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Your business,{' '}
              <br className="hidden sm:block" />
              <span className="text-[#65fe08]">
                {typedText}
                <span
                  className="typewriter-cursor inline-block ml-0.5 w-[3px] h-[0.85em] align-middle bg-[#65fe08] rounded-sm"
                  aria-hidden="true"
                />
              </span>
            </h1>

            <p className="hero-body text-lg text-zinc-400 max-w-xl leading-relaxed">
              BizBot gives your local business a 24/7 AI assistant that answers
              questions, books appointments, and never takes a day off.
            </p>

            <div className="hero-ctas flex flex-wrap gap-3 pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-sm font-semibold bg-[#65fe08] text-black px-6 py-3 rounded-full hover:bg-[#4fcc00] transition-colors"
              >
                Get started free
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 text-sm font-semibold border border-white/30 text-white px-6 py-3 rounded-full hover:bg-white/5 transition-all"
              >
                See how it works
              </Link>
            </div>
          </div>

          {/* Right — animated chat preview */}
          <div className="hero-chat hidden lg:flex justify-end">
            <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl shadow-black">
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border-b border-zinc-800">
                <div className="w-2.5 h-2.5 rounded-full bg-[#65fe08] shadow-[0_0_6px_#65fe08]" />
                <span className="text-sm font-semibold text-white">BizBot</span>
                <span className="ml-auto text-xs text-zinc-500">Online</span>
              </div>

              {/* Messages — fixed height, auto-scrolls to bottom */}
              <div ref={chatScrollRef} className="flex flex-col gap-3 p-4 h-[260px] overflow-y-auto scrollbar-none">
                {visibleMessages.map((msg, idx) =>
                  msg.role === 'bot' ? (
                    <div key={idx} className="flex items-start gap-2 msg-appear">
                      <div className="shrink-0 w-7 h-7 rounded-full bg-[#65fe08]/20 border border-[#65fe08]/30 flex items-center justify-center text-[10px] font-bold text-[#65fe08]">
                        B
                      </div>
                      <div className="bg-zinc-800 text-sm text-zinc-100 px-3 py-2 rounded-2xl rounded-tl-sm max-w-[80%]">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="flex justify-end msg-appear">
                      <div className="bg-[#65fe08]/10 border border-[#65fe08]/20 text-sm text-zinc-100 px-3 py-2 rounded-2xl rounded-tr-sm max-w-[80%]">
                        {msg.text}
                      </div>
                    </div>
                  ),
                )}

                {/* Typing indicator */}
                {showTyping && (
                  <div className="flex items-start gap-2 msg-appear">
                    <div className="shrink-0 w-7 h-7 rounded-full bg-[#65fe08]/20 border border-[#65fe08]/30 flex items-center justify-center text-[10px] font-bold text-[#65fe08]">
                      B
                    </div>
                    <div className="bg-zinc-800 px-3 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-zinc-400 inline-block" />
                      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-zinc-400 inline-block" />
                      <span className="typing-dot w-1.5 h-1.5 rounded-full bg-zinc-400 inline-block" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div className="px-4 py-3 border-t border-zinc-800 flex items-center gap-2">
                <div className="flex-1 bg-zinc-900 rounded-full px-4 py-2 text-sm text-zinc-600 select-none">
                  Type a message…
                </div>
                <div className="w-8 h-8 rounded-full bg-[#65fe08] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M1 13L13 7L1 1V5.5L9 7L1 8.5V13Z" fill="black" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section id="features" className="py-16 md:py-24 px-4 md:px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="features-heading text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight">
              Everything your business needs
            </h2>
            <p className="mt-3 text-zinc-500 text-lg max-w-xl mx-auto">
              Set it up once. Let BizBot handle the rest.
            </p>
          </div>

          <div className="features-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1 — lime accent */}
            <div className="feature-card bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="h-1 bg-[#65fe08]" />
              <div className="p-6 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#65fe08]/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <circle cx="10" cy="10" r="9" stroke="#65fe08" strokeWidth="1.5" />
                    <path d="M10 5V10L13 12" stroke="#65fe08" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">24/7 Availability</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Your AI never sleeps. Customers get instant answers any time — nights, weekends, holidays.
                </p>
              </div>
            </div>

            {/* Card 2 — cyan accent */}
            <div className="feature-card bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="h-1 bg-[#00ffff]" />
              <div className="p-6 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00ffff]/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <rect x="2" y="4" width="16" height="12" rx="2" stroke="#00ffff" strokeWidth="1.5" />
                    <path d="M6 9H14M6 12H10" stroke="#00ffff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Custom Knowledge</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Train BizBot on your menu, FAQs, hours, and policies — it learns exactly what your customers need to know.
                </p>
              </div>
            </div>

            {/* Card 3 — purple accent */}
            <div className="feature-card bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="h-1 bg-[#bf00ff]" />
              <div className="p-6 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#bf00ff]/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M3 10H7L9 5L11 15L13 10H17" stroke="#bf00ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Easy Embed</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  One line of code. Works on any website — WordPress, Squarespace, Wix, or hand-built HTML.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────── */}
      <section className="relative py-20 md:py-28 px-4 md:px-6 overflow-hidden">
        {/* Lime glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(101,254,8,0.10) 0%, transparent 70%)',
          }}
        />
        <div className="cta-content relative max-w-2xl mx-auto text-center flex flex-col items-center gap-8">
          <h2 className="text-2xl md:text-3xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Ready to put your business{' '}
            <span className="text-[#65fe08]">on autopilot?</span>
          </h2>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-base font-semibold bg-[#65fe08] text-black px-8 py-4 rounded-full hover:bg-[#4fcc00] transition-colors"
          >
            Start for free &rarr;
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="py-8 px-4 md:px-6 border-t border-zinc-900 text-center">
        <p className="text-sm text-zinc-500">
          &copy; 2026 BizBot. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
