import { Link } from '@tanstack/react-router'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white text-[var(--ink)]">
      {/* <video
        src="/hero%20animation.mp4"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-0 z-0 h-[100%] w-auto max-w-[50%] -translate-y-1/2 object-contain opacity-45 sm:h-[65%] sm:opacity-55 lg:h-[75%] lg:max-w-[45%] lg:opacity-70"
      /> */}

      <img
        src="/hero.png"
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center opacity-45 sm:opacity-55 lg:object-right lg:opacity-70"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-r from-white via-white/90 to-white/35 sm:via-white/80 sm:to-transparent"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 sm:py-28 lg:py-32">
       
       <div className='flex items-end gap-4 mb-5'>
        <img
            src="/answr%20logo%20dark.svg"
            alt="Answr"
            className="h-16 w-auto object-contain sm:h-20 lg:h-24"
          />
          {/* <p className="nojegaye mb-5 text-sm tracking-wide text-[var(--accent)]">
            Indonesian concept
          </p> */}
          <h1 className="nojegaye max-w-xl text-4xl leading-[1.05] tracking-tight text-[var(--primary)] sm:text-5xl lg:text-6xl">
            Dari rasa, menjadi jawaban
          </h1>
       </div>
        <p className="mb-4 max-w-md text-base leading-relaxed text-[var(--ink)]/80 sm:text-lg">
        From Empathy to Answers.
        </p>
        <p className="mb-10 max-w-md text-sm leading-relaxed text-[var(--muted)]">
          Every question begins a journey. Through understanding, connection,
          and knowledge, that journey finds its way to clarity.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/register"
            className="inline-block bg-[var(--ink)] px-6 py-3 text-sm text-white no-underline transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            Get started
          </Link>
          <a
            href="#logo-story"
            className="inline-block border border-[var(--line)] bg-white/70 px-6 py-3 text-sm text-[var(--ink)] no-underline backdrop-blur-sm transition hover:border-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            See how it works
          </a>
        </div>
      </div>
    </section>
  )
}
