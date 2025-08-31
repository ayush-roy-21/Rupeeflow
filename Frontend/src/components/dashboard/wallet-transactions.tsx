"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react"

const transactions = [
  {
    id: "tx_001",
    type: "credit" as const,
    amount: 50000,
    description: "Transfer from Bank Account",
    time: "2 hours ago",
    status: "completed" as const,
    reference: "BANK-123456"
  },
  {
    id: "tx_002",
    type: "debit" as const,
    amount: 25000,
    description: "Transfer to Russia",
    time: "4 hours ago",
    status: "completed" as const,
    reference: "TF-002"
  },
  {
    id: "tx_003",
    type: "credit" as const,
    amount: 100000,
    description: "Salary Deposit",
    time: "1 day ago",
    status: "completed" as const,
    reference: "SAL-789012"
  },
  {
    id: "tx_004",
    type: "debit" as const,
    amount: 15000,
    description: "Transfer to India",
    time: "2 days ago",
    status: "processing" as const,
    reference: "TF-003"
  },
  {
    id: "tx_005",
    type: "credit" as const,
    amount: 75000,
    description: "Refund from Failed Transfer",
    time: "3 days ago",
    status: "completed" as const,
    reference: "REF-456789"
  }
]

function getTransactionIcon(type: "credit" | "debit") {
  return type === "credit" ? (
    <ArrowDownLeft className="h-4 w-4 text-green-600" />
  ) : (
    <ArrowUpRight className="h-4 w-4 text-red-600" />
  )
}

function getStatusIcon(status: "completed" | "processing" | "failed") {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-3 w-3 text-green-600" />
    case "processing":
      return <Clock className="h-3 w-3 text-blue-600" />
    case "failed":
      return <XCircle className="h-3 w-3 text-red-600" />
  }
}

function getStatusBadge(status: "completed" | "processing" | "failed") {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-100 text-green-800 text-xs">Completed</Badge>
    case "processing":
      return <Badge variant="secondary" className="text-xs">Processing</Badge>
    case "failed":
      return <Badge variant="destructive" className="text-xs">Failed</Badge>
  }
}

export function WalletTransactions() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              Your latest wallet activity
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                {getTransactionIcon(transaction.type)}
              </div>
              <div>
                <div className="font-medium">{transaction.description}</div>
                <div className="text-sm text-muted-foreground">
                  {transaction.time} • {transaction.reference}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon(transaction.status)}
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`font-semibold ${
                transaction.type === "credit" ? "text-green-600" : "text-red-600"
              }`}>
                {transaction.type === "credit" ? "+" : "-"}₹{transaction.amount.toLocaleString()}
              </div>
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Transactions</h3>
            <p className="text-muted-foreground">
              Your transaction history will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
