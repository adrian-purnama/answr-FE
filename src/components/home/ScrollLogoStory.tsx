import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import LayeredLogo from '#/components/home/LayeredLogo'

/**
 * Tweak scroll length via WRAPPER_VH.
 * Tweak step copy via STEPS below.
 * Progress bands map scroll position → explode / focus / reassemble.
 */
const WRAPPER_VH = 400

/** Midpoints (0–1) for jump-to-step    one per meaning step. */
const STEP_JUMP_PROGRESS = [0.42, 0.57, 0.72, 0.85] as const

type StoryStep = {
  title: string
  body: string
  focusIndex: number | null
}


const STEPS: readonly StoryStep[] = [
  {
    title: 'Laku',
    body: 'Every journey begins with action, experience, and the pursuit of understanding.',
    focusIndex: 0,
  },
  {
    title: 'Rasa',
    body: 'To understand beyond words    perceiving context, meaning, and human needs.',
    focusIndex: 1,
  },
  {
    title: 'Pencerahan',
    body: 'Where knowledge finds meaning, and complexity becomes clarity.',
    focusIndex: 2,
  },
  {
    title: 'Jawaban',
    body: 'The culmination of understanding    meaningful answers that light the way forward.',
    focusIndex: 3,
  },
]

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function mapProgress(raw: number): {
  explode: number
  focusIndex: number | null
  rotateZ: number
  activeStep: number
  copyTitle: string
  copyBody: string
  label: string
} {
  const p = clamp01(raw)
  // Mild positive yaw    faces viewer, not leaning hard left
  const rotateZ = lerp(12, 18, clamp01((p - 0.15) / 0.75))

  if (p < 0.15) {
    return {
      explode: 0,
      focusIndex: null,
      rotateZ: 12,
      activeStep: -1,
      copyTitle: 'A philosophy in every detail',
      copyBody:
        'More than a symbol, the Answr logo embodies a journey inspired by Nusantara philosophy    from experience to understanding, from insight to meaningful answers.',
      label: 'The philosophy',
    }
  }

  if (p < 0.35) {
    const t = (p - 0.15) / 0.2
  
    return {
      explode: t,
      focusIndex: null,
      rotateZ: lerp(12, 15, t),
      activeStep: -1,
      copyTitle: 'Four elements, one journey',
      copyBody:
        'Each layer represents a part of the journey: Laku, Rasa, Pencerahan, and Jawaban. Scroll to unfold their meanings and discover how they come together.',
      label: 'Discover the meaning',
    }
  }

  if (p < 0.5) {
    return {
      explode: 1,
      focusIndex: 0,
      rotateZ,
      activeStep: 0,
      copyTitle: STEPS[0].title,
      copyBody: STEPS[0].body,
      label: 'Layer 1',
    }
  }
  if (p < 0.65) {
    return {
      explode: 1,
      focusIndex: 1,
      rotateZ,
      activeStep: 1,
      copyTitle: STEPS[1].title,
      copyBody: STEPS[1].body,
      label: 'Layer 2',
    }
  }
  if (p < 0.8) {
    return {
      explode: 1,
      focusIndex: 2,
      rotateZ,
      activeStep: 2,
      copyTitle: STEPS[2].title,
      copyBody: STEPS[2].body,
      label: 'Layer 3',
    }
  }
  if (p < 0.9) {
    return {
      explode: 1,
      focusIndex: 3,
      rotateZ,
      activeStep: 3,
      copyTitle: STEPS[3].title,
      copyBody: STEPS[3].body,
      label: '',
    }
  }

  const t = (p - 0.9) / 0.1
  return {
    explode: 1 - t,
    focusIndex: null,
    rotateZ: lerp(rotateZ, 12, t),
    activeStep: 4,
    copyTitle: 'Dari Rasa, Menjadi Jawaban',
    copyBody: 'Layers return as one mark    the journey toward clarity, complete.',
    label: 'Assembled',
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export default function ScrollLogoStory() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [rawProgress, setRawProgress] = useState(0)
  const [scrubbing, setScrubbing] = useState(false)
  const [staticStep, setStaticStep] = useState(-1)
  const reducedMotion = usePrefersReducedMotion()
  const rafRef = useRef(0)

  const updateFromScroll = useCallback(() => {
    const el = wrapperRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const total = el.offsetHeight - window.innerHeight
    if (total <= 0) {
      setRawProgress(0)
      return
    }
    const scrolled = -rect.top
    setRawProgress(clamp01(scrolled / total))
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      rafRef.current = requestAnimationFrame(() => {
        updateFromScroll()
        ticking = false
      })
    }

    const el = wrapperRef.current
    const io = new IntersectionObserver(
      ([entry]) => {
        setScrubbing(entry.isIntersecting)
        if (entry.isIntersecting) updateFromScroll()
      },
      { threshold: 0 },
    )
    if (el) io.observe(el)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    updateFromScroll()

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [reducedMotion, updateFromScroll])

  const mapped = useMemo(() => {
    if (reducedMotion) {
      if (staticStep < 0) return mapProgress(0)
      if (staticStep >= STEPS.length) return mapProgress(1)
      return mapProgress(STEP_JUMP_PROGRESS[staticStep] ?? 0.5)
    }
    return mapProgress(rawProgress)
  }, [rawProgress, reducedMotion, staticStep])

  const activeStep =
    mapped.activeStep >= 0 && mapped.activeStep < STEPS.length
      ? mapped.activeStep
      : mapped.activeStep === 4
        ? STEPS.length - 1
        : -1

  const jumpToStep = (stepIndex: number) => {
    if (reducedMotion) {
      setStaticStep(stepIndex)
      return
    }
    const el = wrapperRef.current
    if (!el) return
    const total = el.offsetHeight - window.innerHeight
    const target = STEP_JUMP_PROGRESS[stepIndex] ?? 0.5
    const top = el.getBoundingClientRect().top + window.scrollY + target * total
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const lineProgress =
    activeStep >= 0 ? (activeStep + 1) / STEPS.length : mapped.explode * 0.2

  return (
    <section
      id="logo-story"
      ref={wrapperRef}
      className="relative"
      style={{ height: `${WRAPPER_VH}vh` }}
      aria-label="Meaning in the logo"
    >
      <div className="home-logo-stage sticky top-0 flex h-screen flex-col justify-center text-[var(--ink)]">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-6 py-10 md:grid-cols-[1.2fr_1fr] md:gap-12 lg:gap-16">
          <LayeredLogo
            progress={mapped.explode}
            focusIndex={mapped.focusIndex}
            rotateZ={mapped.rotateZ}
            sliceCount={12}
            scrubbing={scrubbing && !reducedMotion}
          />

          <div className="flex min-h-48 flex-col justify-center">
            <p className="nojegaye mb-3 text-sm tracking-wide text-[var(--accent)]">
              {mapped.label}
            </p>
            <h2
              className={`nojegaye mb-4 text-3xl leading-tight tracking-tight sm:text-4xl ${
                mapped.focusIndex === 3
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--primary)]'
              }`}
            >
              {mapped.copyTitle}
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-[var(--muted)]">
              {mapped.copyBody}
            </p>

            <div className="mt-8" role="tablist" aria-label="Logo meaning steps">
              <div
                className="mb-4 h-px w-full bg-[var(--line)]"
                aria-hidden
              >
                <div
                  className="h-px bg-[var(--logo-gold)] transition-[width] duration-200"
                  style={{ width: `${Math.round(lineProgress * 100)}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {STEPS.map((step, i) => {
                  const selected = activeStep === i
                  return (
                    <button
                      key={step.title}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => jumpToStep(i)}
                      className={`font-mono text-[11px] uppercase tracking-[0.14em] transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--logo-gold)] ${
                        selected
                          ? 'text-[var(--logo-gold)]'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {step.title}
                    </button>
                  )
                })}
              </div>
            </div>

            {reducedMotion ? (
              <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
                Reduced motion    use the step names to move through the logo.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
