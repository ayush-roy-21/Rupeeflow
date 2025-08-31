import { DashboardOverview } from "@/components/dashboard/overview"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentTransfers } from "@/components/dashboard/recent-transfers"
import { ExchangeRatesWidget } from "@/components/dashboard/exchange-rates-widget"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your account.
          </p>
        </div>
      </div>

      <DashboardOverview />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <QuickActions />
        <ExchangeRatesWidget />
        <RecentTransfers />
      </div>
    </div>
  )
}
