"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

const recentTransfers = [
  {
    id: "TF-001",
    amount: "₹50,000",
    recipient: "Anastasia Petrova",
    status: "completed" as const,
    date: "2 hours ago",
    fee: "₹900"
  },
  {
    id: "TF-002",
    amount: "₹25,000",
    recipient: "Dmitry Ivanov",
    status: "processing" as const,
    date: "4 hours ago",
    fee: "₹450"
  },
  {
    id: "TF-003",
    amount: "₹75,000",
    recipient: "Maria Sokolova",
    status: "completed" as const,
    date: "1 day ago",
    fee: "₹1,350"
  },
  {
    id: "TF-004",
    amount: "₹30,000",
    recipient: "Vladimir Kuznetsov",
    status: "failed" as const,
    date: "2 days ago",
    fee: "₹540"
  }
]

function getStatusIcon(status: "completed" | "processing" | "failed" | "pending") {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "processing":
      return <Clock className="h-4 w-4 text-blue-600" />
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
  }
}

function getStatusBadge(status: "completed" | "processing" | "failed" | "pending") {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
    case "processing":
      return <Badge variant="secondary">Processing</Badge>
    case "failed":
      return <Badge variant="destructive">Failed</Badge>
    default:
      return <Badge variant="outline">Pending</Badge>
  }
}

export function RecentTransfers() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transfers</CardTitle>
        <CardDescription>
          Your latest money transfers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentTransfers.map((transfer) => (
          <div key={transfer.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(transfer.status)}
              <div>
                <div className="font-medium">{transfer.amount}</div>
                <div className="text-sm text-muted-foreground">
                  to {transfer.recipient}
                </div>
                <div className="text-xs text-muted-foreground">
                  {transfer.date} • Fee: {transfer.fee}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(transfer.status)}
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/transfers/${transfer.id}`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/dashboard/history">
              View All Transfers
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
