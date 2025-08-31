import { Card, CardContent } from "@/components/ui/card"
import { Star, Quote } from "lucide-react"

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Priya Sharma",
      location: "Mumbai, India",
      rating: 5,
      text: "RupeeFlow made sending money to my daughter in Moscow so easy. The rates are excellent and transfers are lightning fast!",
      amount: "₹50,000 sent",
    },
    {
      name: "Rajesh Kumar",
      location: "Delhi, India",
      rating: 5,
      text: "As a business owner, I need reliable international transfers. RupeeFlow has never let me down - always on time, always secure.",
      amount: "₹2,00,000+ sent",
    },
    {
      name: "Anita Patel",
      location: "Bangalore, India",
      rating: 5,
      text: "The Web3 integration is brilliant! I love having full control over my transfers with complete transparency.",
      amount: "₹75,000 sent",
    },
    {
      name: "Vikram Singh",
      location: "Pune, India",
      rating: 5,
      text: "Customer support is outstanding. They helped me through my first transfer and now I use RupeeFlow exclusively.",
      amount: "₹1,25,000 sent",
    },
  ]

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-serif font-black text-foreground mb-4">What Our Users Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Don't just take our word for it. Here's what real users say about their RupeeFlow experience.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  {/* Quote Icon */}
                  <div className="flex items-start justify-between mb-4">
                    <Quote className="h-8 w-8 text-primary/20" />
                    <div className="flex items-center space-x-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-foreground mb-6 leading-relaxed">"{testimonial.text}"</p>

                  {/* User Info */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <div className="font-medium text-foreground">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-primary">{testimonial.amount}</div>
                      <div className="text-xs text-muted-foreground">Total transferred</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="bg-muted/50 rounded-2xl p-8 text-center">
            <h3 className="text-xl font-serif font-bold text-foreground mb-6">Trusted & Regulated</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
              <div className="text-center">
                <div className="h-12 w-12 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-primary font-bold">RBI</span>
                </div>
                <div className="text-xs text-muted-foreground">RBI Approved</div>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-secondary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-secondary font-bold">ISO</span>
                </div>
                <div className="text-xs text-muted-foreground">ISO 27001</div>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-accent/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-accent font-bold">AML</span>
                </div>
                <div className="text-xs text-muted-foreground">AML Compliant</div>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-chart-3/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  <span className="text-chart-3 font-bold">SSL</span>
                </div>
                <div className="text-xs text-muted-foreground">256-bit SSL</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
