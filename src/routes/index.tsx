import { createFileRoute } from '@tanstack/react-router'
import EmbedShowcase from '#/components/home/EmbedShowcase'
import FinalCta from '#/components/home/FinalCta'
import HeroSection from '#/components/home/HeroSection'
import ScrollLogoStory from '#/components/home/ScrollLogoStory'
import TrustBar from '#/components/home/TrustBar'
import { pageHead } from '#/lib/seo'

export const Route = createFileRoute('/')({
  component: HomePage,
  head: () => pageHead({ path: '/' }),
})

function HomePage() {
  return (
    <main className="bg-white text-[var(--ink)]">
      <HeroSection />
      <TrustBar />
      <ScrollLogoStory />
      <EmbedShowcase />
      <FinalCta />
    </main>
  )
}
