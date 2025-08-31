"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw,
  Clock,
  Shield
} from "lucide-react"

const currencyPairs = [
  {
    pair: "INR → RUB",
    currentRate: 1.12,
    previousRate: 1.10,
    change: "+0.02",
    changePercent: "+1.82%",
    changeType: "positive" as const,
    lastUpdated: "2 min ago",
    high24h: 1.15,
    low24h: 1.08,
    volume24h: "₹2.5M"
  },
  {
    pair: "RUB → INR",
    currentRate: 0.89,
    previousRate: 0.91,
    change: "-0.02",
    changePercent: "-2.20%",
    changeType: "negative" as const,
    lastUpdated: "2 min ago",
    high24h: 0.93,
    low24h: 0.87,
    volume24h: "₽3.2M"
  },
  {
    pair: "USD → INR",
    currentRate: 83.45,
    previousRate: 83.30,
    change: "+0.15",
    changePercent: "+0.18%",
    changeType: "positive" as const,
    lastUpdated: "1 min ago",
    high24h: 83.67,
    low24h: 83.12,
    volume24h: "$1.8M"
  },
  {
    pair: "USD → RUB",
    currentRate: 93.67,
    previousRate: 93.67,
    change: "0.00",
    changePercent: "0.00%",
    changeType: "neutral" as const,
    lastUpdated: "1 min ago",
    high24h: 94.23,
    low24h: 93.01,
    volume24h: "$2.1M"
  }
]

function getChangeIcon(changeType: "positive" | "negative" | "neutral") {
  switch (changeType) {
    case "positive":
      return <TrendingUp className="h-4 w-4 text-green-600" />
    case "negative":
      return <TrendingDown className="h-4 w-4 text-red-600" />
    default:
      return <Minus className="h-4 w-4 text-gray-400" />
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

export function LiveRates() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false)
      setLastRefresh(new Date())
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Live Exchange Rates</span>
            </CardTitle>
            <CardDescription>
              Real-time rates updated every minute
            </CardDescription>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {currencyPairs.map((pair) => (
            <div
              key={pair.pair}
              className="p-4 border rounded-lg space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-lg">{pair.pair}</div>
                <Badge variant="secondary" className="text-xs">
                  Live
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{pair.currentRate}</span>
                  <div className="flex items-center space-x-2">
                    {getChangeIcon(pair.changeType)}
                    <span className={`text-sm font-medium ${getChangeColor(pair.changeType)}`}>
                      {pair.changePercent}
                    </span>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  Previous: {pair.previousRate} • Change: {pair.change}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground">24h High</div>
                  <div className="font-medium">{pair.high24h}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">24h Low</div>
                  <div className="font-medium">{pair.low24h}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Volume</div>
                  <div className="font-medium">{pair.volume24h}</div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Updated {pair.lastUpdated}
              </div>
            </div>
          ))}
        </div>
        
        {/* Rate Information */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium">Rate Information</div>
              <div className="text-muted-foreground mt-1">
                Rates are sourced from multiple exchanges and updated every minute. 
                Our rates include a small margin to cover operational costs. 
                The actual rate you receive may vary slightly based on market conditions.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
