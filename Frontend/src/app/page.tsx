import { Header } from "@/components/common/header"
import { HeroSection } from "@/components/home/hero-section"
import { FeaturesSection } from "@/components/home/features-section"
import { HowItWorksSection } from "@/components/home/how-it-works-section"
import { ExchangeRatesSection } from "@/components/home/exchange-rates-section"
import { TestimonialsSection } from "@/components/home/testimonials-section"
import { Footer } from "@/components/common/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ExchangeRatesSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  )
}
