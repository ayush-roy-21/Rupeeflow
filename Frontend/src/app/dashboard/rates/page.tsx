import { LiveRates } from "@/components/dashboard/live-rates"
import { RateHistory } from "@/components/dashboard/rate-history"
import { RateAlerts } from "@/components/dashboard/rate-alerts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ExchangeRatesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Exchange Rates</h1>
        <p className="text-muted-foreground">
          Live exchange rates and historical data for supported currency pairs
        </p>
      </div>

      <div className="grid gap-6">
        <LiveRates />
        
        <div className="grid gap-6 lg:grid-cols-2">
          <RateHistory />
          <RateAlerts />
        </div>
      </div>
    </div>
  )
}
