import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Shield, Zap, Globe } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      <div className="absolute inset-0 bg-[url('/abstract-financial-pattern.png')] opacity-5" />

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border bg-card px-4 py-2 text-sm font-medium mb-8">
            <Shield className="mr-2 h-4 w-4 text-primary" />
            Secure • Fast • Transparent
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl lg:text-6xl font-serif font-black text-foreground mb-6 leading-tight">
            Send Money from <span className="text-primary">India</span> to{" "}
            <span className="text-secondary">Russia</span> Instantly
          </h1>

          {/* Subheading */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Experience the future of international money transfers with blockchain technology. Lower fees, faster
            processing, and complete transparency.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-6" asChild>
              <Link href="/send">
                Send Money Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent" asChild>
              <Link href="/track">Track Transfer</Link>
            </Button>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-serif font-bold text-lg mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground text-sm">Transfers completed in minutes, not days</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-serif font-bold text-lg mb-2">Bank-Level Security</h3>
              <p className="text-muted-foreground text-sm">Military-grade encryption and blockchain security</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-serif font-bold text-lg mb-2">Global Reach</h3>
              <p className="text-muted-foreground text-sm">Available 24/7 across India and Russia</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
