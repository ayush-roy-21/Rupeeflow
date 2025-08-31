import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Zap, DollarSign, Clock, Globe, Smartphone, Lock, TrendingDown } from "lucide-react"

export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Military-grade encryption and blockchain technology ensure your money is always safe.",
      color: "text-primary",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Complete transfers in minutes, not days. Real-time processing with instant notifications.",
      color: "text-secondary",
    },
    {
      icon: TrendingDown,
      title: "Lowest Fees",
      description: "Save up to 80% compared to traditional banks with our transparent pricing.",
      color: "text-accent",
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Send money anytime, anywhere. Our platform never sleeps, so you don't have to wait.",
      color: "text-chart-3",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Seamless transfers between India and Russia with local banking partnerships.",
      color: "text-chart-4",
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Full-featured mobile experience with biometric authentication and offline capabilities.",
      color: "text-chart-5",
    },
    {
      icon: Lock,
      title: "KYC Compliant",
      description: "Fully regulated and compliant with international anti-money laundering standards.",
      color: "text-primary",
    },
    {
      icon: DollarSign,
      title: "Best Exchange Rates",
      description: "Live market rates updated every second to ensure you get the best value for your money.",
      color: "text-secondary",
    },
  ]

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-serif font-black text-foreground mb-4">Why Choose RupeeFlow?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the next generation of international money transfers with features designed for the modern
              world.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="pb-4">
                  <div className={`h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center mb-4`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-lg font-serif font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-16 border-t">
            <div className="text-center mb-8">
              <h3 className="text-xl font-serif font-bold text-foreground mb-2">Trusted by Thousands</h3>
              <p className="text-muted-foreground">
                Join over 50,000 users who trust RupeeFlow for their international transfers
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-2xl font-serif font-black text-primary mb-1">₹2.5B+</div>
                <div className="text-sm text-muted-foreground">Transferred</div>
              </div>
              <div>
                <div className="text-2xl font-serif font-black text-secondary mb-1">50K+</div>
                <div className="text-sm text-muted-foreground">Happy Users</div>
              </div>
              <div>
                <div className="text-2xl font-serif font-black text-accent mb-1">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-serif font-black text-chart-3 mb-1">4.9★</div>
                <div className="text-sm text-muted-foreground">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
