import { Link } from '@tanstack/react-router'

export default function FinalCta() {
  return (
    <section className="home-accent-wash border-t border-[var(--line)] text-[var(--ink)]">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <p className="nojegaye mb-4 text-sm tracking-wide text-[var(--accent)]">
          Start building
        </p>
        <h2 className="nojegaye mb-6 max-w-3xl text-3xl leading-tight tracking-tight text-[var(--primary)] sm:text-4xl lg:text-5xl">
          Every question deserves a clear answer.
        </h2>
        <p className="mb-10 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          Embed Answr on your site, connect your knowledge, and help visitors
          find their way    from rasa to jawaban.
        </p>
        <Link
          to="/register"
          className="inline-block bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-[var(--paper)] no-underline transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--logo-gold)]"
        >
          Get started
        </Link>
      </div>
    </section>
  )
}
