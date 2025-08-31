"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

const exchangeRates = [
  {
    pair: "INR → RUB",
    rate: "1.12",
    change: "+0.02",
    changeType: "positive" as const,
    lastUpdated: "2 min ago"
  },
  {
    pair: "RUB → INR",
    rate: "0.89",
    change: "-0.01",
    changeType: "negative" as const,
    lastUpdated: "2 min ago"
  },
  {
    pair: "USD → INR",
    rate: "83.45",
    change: "+0.15",
    changeType: "positive" as const,
    lastUpdated: "1 min ago"
  },
  {
    pair: "USD → RUB",
    rate: "93.67",
    change: "0.00",
    changeType: "neutral" as const,
    lastUpdated: "1 min ago"
  }
]

function getChangeIcon(changeType: "positive" | "negative" | "neutral") {
  switch (changeType) {
    case "positive":
      return <TrendingUp className="h-3 w-3 text-green-600" />
    case "negative":
      return <TrendingDown className="h-3 w-3 text-red-600" />
    default:
      return <Minus className="h-3 w-3 text-gray-400" />
  }
}

function getChangeColor(changeType: "positive" | "negative" | "neutral") {
  switch (changeType) {
    case "positive":
      return "text-green-600"
    case "negative":
      return "text-red-600"
    default:
      return "text-gray-500"
  }
}

export function ExchangeRatesWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exchange Rates</CardTitle>
        <CardDescription>
          Live rates for supported currencies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {exchangeRates.map((rate) => (
          <div key={rate.pair} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="font-medium">{rate.pair}</div>
              <Badge variant="secondary" className="text-xs">
                Live
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="font-semibold">{rate.rate}</div>
                <div className="text-xs text-muted-foreground">
                  {rate.lastUpdated}
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {getChangeIcon(rate.changeType)}
                <span className={`text-xs font-medium ${getChangeColor(rate.changeType)}`}>
                  {rate.change}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground text-center">
            Rates update every minute • Powered by Chainlink
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
