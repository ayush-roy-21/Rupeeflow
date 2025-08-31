import { WalletOverview } from "@/components/dashboard/wallet-overview"
import { PaymentMethods } from "@/components/dashboard/payment-methods"
import { WalletTransactions } from "@/components/dashboard/wallet-transactions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function WalletPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wallet</h1>
        <p className="text-muted-foreground">
          Manage your payment methods and view transaction history
        </p>
      </div>

      <div className="grid gap-6">
        <WalletOverview />
        
        <div className="grid gap-6 lg:grid-cols-2">
          <PaymentMethods />
          <WalletTransactions />
        </div>
      </div>
    </div>
  )
}
