"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowUpDown, TrendingUp, Calculator } from "lucide-react"

export function ExchangeRatesSection() {
  const [amount, setAmount] = useState("1000")
  const [exchangeRate] = useState(0.89) // Mock rate: 1 INR = 0.89 RUB
  const [fee] = useState(2.5) // 2.5% fee

  const calculateTransfer = () => {
    const amountNum = Number.parseFloat(amount) || 0
    const convertedAmount = amountNum * exchangeRate
    const feeAmount = convertedAmount * (fee / 100)
    const totalReceived = convertedAmount - feeAmount

    return {
      converted: convertedAmount,
      fee: feeAmount,
      received: totalReceived,
    }
  }

  const calculation = calculateTransfer()

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-serif font-black text-foreground mb-4">Live Exchange Rates</h2>
            <p className="text-lg text-muted-foreground">Get the best rates with transparent pricing</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rate Calculator */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Transfer Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">You Send</label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-12 text-lg"
                      placeholder="1000"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</div>
                  </div>
                  <p className="text-xs text-muted-foreground">Indian Rupees</p>
                </div>

                {/* Exchange Icon */}
                <div className="flex justify-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ArrowUpDown className="h-5 w-5 text-primary" />
                  </div>
                </div>

                {/* Converted Amount */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">They Receive</label>
                  <div className="relative">
                    <div className="h-12 px-3 py-2 border rounded-md bg-muted/50 flex items-center text-lg font-medium">
                      <span className="text-muted-foreground mr-2">₽</span>
                      {calculation.received.toFixed(2)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Russian Rubles</p>
                </div>

                {/* Rate Details */}
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Exchange Rate</span>
                    <span className="font-medium">1 INR = {exchangeRate} RUB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Our Fee ({fee}%)</span>
                    <span className="font-medium">₽{calculation.fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-2 border-t">
                    <span>Total to Convert</span>
                    <span>₽{calculation.converted.toFixed(2)}</span>
                  </div>
                </div>

                <Button className="w-full" size="lg">
                  Start Transfer
                </Button>
              </CardContent>
            </Card>

            {/* Current Rates */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  Current Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Main Rate */}
                <div className="text-center py-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
                  <div className="text-3xl font-serif font-black text-foreground mb-2">{exchangeRate} RUB</div>
                  <div className="text-muted-foreground">per 1 INR</div>
                  <div className="text-sm text-secondary font-medium mt-2">↑ 0.5% from yesterday</div>
                </div>

                {/* Rate History */}
                <div className="space-y-3">
                  <h4 className="font-medium">Recent Rates</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Today</span>
                      <span className="font-medium">{exchangeRate} RUB</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Yesterday</span>
                      <span className="font-medium">0.885 RUB</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Last Week</span>
                      <span className="font-medium">0.892 RUB</span>
                    </div>
                  </div>
                </div>

                {/* Rate Alert */}
                <div className="p-4 bg-accent/10 rounded-lg">
                  <h4 className="font-medium text-accent mb-2">Rate Alert</h4>
                  <p className="text-sm text-muted-foreground mb-3">Get notified when rates reach your target</p>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Set Alert
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
