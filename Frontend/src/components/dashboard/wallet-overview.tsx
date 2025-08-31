"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Wallet, 
  TrendingUp, 
  Shield, 
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react"

const walletData = {
  totalBalance: 125000,
  availableBalance: 98000,
  lockedBalance: 27000,
  monthlyLimit: 500000,
  monthlyUsed: 375000,
  currency: "INR"
}

const recentActivity = [
  {
    type: "credit" as const,
    amount: 50000,
    description: "Transfer from Bank Account",
    time: "2 hours ago"
  },
  {
    type: "debit" as const,
    amount: 25000,
    description: "Transfer to Russia",
    time: "4 hours ago"
  },
  {
    type: "credit" as const,
    amount: 100000,
    description: "Salary Deposit",
    time: "1 day ago"
  }
]

export function WalletOverview() {
  const monthlyUsagePercentage = (walletData.monthlyUsed / walletData.monthlyLimit) * 100

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{walletData.totalBalance.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Available: ₹{walletData.availableBalance.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Available Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ₹{walletData.availableBalance.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Ready for transfers
          </p>
        </CardContent>
      </Card>

      {/* Locked Balance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Locked Balance</CardTitle>
          <Shield className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            ₹{walletData.lockedBalance.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            In pending transfers
          </p>
        </CardContent>
      </Card>

      {/* Monthly Limit */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monthly Limit</CardTitle>
          <div className="text-xs text-muted-foreground">
            {walletData.monthlyUsed.toLocaleString()} / {walletData.monthlyLimit.toLocaleString()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ₹{(walletData.monthlyLimit - walletData.monthlyUsed).toLocaleString()}
          </div>
          <div className="space-y-2">
            <Progress value={monthlyUsagePercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {monthlyUsagePercentage.toFixed(1)}% used
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
