import { SendMoneyForm } from "@/components/dashboard/send-money-form"
import { TransferSummary } from "@/components/dashboard/transfer-summary"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SendMoneyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Send Money</h1>
        <p className="text-muted-foreground">
          Transfer money to India or Russia with competitive rates and fast settlement.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>
              Enter the transfer amount and recipient information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SendMoneyForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transfer Summary</CardTitle>
            <CardDescription>
              Review your transfer before confirming
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransferSummary />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
