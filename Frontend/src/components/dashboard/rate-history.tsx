"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Download
} from "lucide-react"

const timeRanges = [
  { value: "1d", label: "1 Day" },
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "3 Months" },
  { value: "1y", label: "1 Year" }
]

const currencyPairs = [
  { value: "INR-RUB", label: "INR → RUB" },
  { value: "RUB-INR", label: "RUB → INR" },
  { value: "USD-INR", label: "USD → INR" },
  { value: "USD-RUB", label: "USD → RUB" }
]

// Mock historical data
const historicalData = {
  "INR-RUB": {
    "1d": [
      { time: "00:00", rate: 1.10 },
      { time: "06:00", rate: 1.11 },
      { time: "12:00", rate: 1.12 },
      { time: "18:00", rate: 1.11 },
      { time: "23:59", rate: 1.12 }
    ],
    "7d": [
      { date: "Jan 9", rate: 1.08 },
      { date: "Jan 10", rate: 1.09 },
      { date: "Jan 11", rate: 1.10 },
      { date: "Jan 12", rate: 1.11 },
      { date: "Jan 13", rate: 1.10 },
      { date: "Jan 14", rate: 1.11 },
      { date: "Jan 15", rate: 1.12 }
    ]
  }
}

export function RateHistory() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Rate History</span>
            </CardTitle>
            <CardDescription>
              Historical exchange rate data and trends
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Currency Pair</label>
            <Select defaultValue="INR-RUB">
              <SelectTrigger>
                <SelectValue placeholder="Select currency pair" />
              </SelectTrigger>
              <SelectContent>
                {currencyPairs.map((pair) => (
                  <SelectItem key={pair.value} value={pair.value}>
                    {pair.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Range</label>
            <Select defaultValue="7d">
              <SelectTrigger>
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Chart Placeholder */}
        <div className="h-64 bg-muted/50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Chart visualization would go here</p>
            <p className="text-xs text-muted-foreground">
              Integration with Chart.js or Recharts for interactive charts
            </p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="p-3 border rounded-lg text-center">
            <div className="text-sm text-muted-foreground">Highest</div>
            <div className="text-lg font-semibold text-green-600">1.15</div>
            <div className="text-xs text-muted-foreground">Jan 13, 2024</div>
          </div>
          <div className="p-3 border rounded-lg text-center">
            <div className="text-sm text-muted-foreground">Lowest</div>
            <div className="text-lg font-semibold text-red-600">1.08</div>
            <div className="text-xs text-muted-foreground">Jan 9, 2024</div>
          </div>
          <div className="p-3 border rounded-lg text-center">
            <div className="text-sm text-muted-foreground">Average</div>
            <div className="text-lg font-semibold">1.11</div>
            <div className="text-xs text-muted-foreground">7-day period</div>
          </div>
        </div>

        {/* Recent Data Points */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Recent Data Points</h3>
          <div className="space-y-2">
            {historicalData["INR-RUB"]["7d"].slice(-5).reverse().map((point, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{point.date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold">{point.rate}</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Information */}
        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p>
            Historical data is sourced from multiple exchanges and updated daily. 
            Rates shown are closing rates for each period. 
            Past performance does not guarantee future results.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
