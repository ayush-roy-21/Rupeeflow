import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, UserPlus, Wallet, Send, CheckCircle } from "lucide-react"
import Link from "next/link"

export function HowItWorksSection() {
  const steps = [
    {
      icon: UserPlus,
      title: "Sign Up & Verify",
      description: "Create your account and complete KYC verification in minutes",
      details: ["Email registration", "Document upload", "Identity verification", "Account activation"],
    },
    {
      icon: Wallet,
      title: "Connect Wallet",
      description: "Link your MetaMask or preferred Web3 wallet securely",
      details: ["MetaMask integration", "Wallet connection", "Balance verification", "Security setup"],
    },
    {
      icon: Send,
      title: "Send Money",
      description: "Enter recipient details and transfer amount with live rates",
      details: ["Recipient information", "Amount selection", "Rate confirmation", "Transfer initiation"],
    },
    {
      icon: CheckCircle,
      title: "Track & Receive",
      description: "Monitor your transfer in real-time until completion",
      details: ["Real-time tracking", "Status notifications", "Completion alerts", "Receipt generation"],
    },
  ]

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-serif font-black text-foreground mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Send money internationally in just 4 simple steps. Fast, secure, and transparent.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-border z-0">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
                  </div>
                )}

                <Card className="border-2 hover:shadow-lg transition-all duration-300 relative z-10">
                  <CardContent className="p-6 text-center">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>

                    {/* Icon */}
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 mt-4">
                      <step.icon className="h-8 w-8 text-primary" />
                    </div>

                    {/* Content */}
                    <h3 className="font-serif font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{step.description}</p>

                    {/* Details */}
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center justify-center">
                          <div className="w-1 h-1 bg-primary rounded-full mr-2" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-serif font-black text-foreground mb-4">Ready to Send Money?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Join thousands of users who trust RupeeFlow for fast, secure international transfers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/register">
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/demo">Watch Demo</Link>
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">No hidden fees • Bank-level security • 24/7 support</p>
          </div>
        </div>
      </div>
    </section>
  )
}
