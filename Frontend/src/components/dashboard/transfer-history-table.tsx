"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  MoreHorizontal, 
  Download, 
  Eye, 
  Copy,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Ban
} from "lucide-react"
import Link from "next/link"

const mockTransfers = [
  {
    id: "TF-001",
    date: "2024-01-15",
    amount: 50000,
    sourceCurrency: "INR",
    destinationAmount: 56000,
    destinationCurrency: "RUB",
    recipient: "Anastasia Petrova",
    status: "completed" as const,
    fee: 900,
    exchangeRate: 1.12,
    txHash: "0x1234...5678"
  },
  {
    id: "TF-002",
    date: "2024-01-14",
    amount: 25000,
    sourceCurrency: "INR",
    destinationAmount: 28000,
    destinationCurrency: "RUB",
    recipient: "Dmitry Ivanov",
    status: "processing" as const,
    fee: 450,
    exchangeRate: 1.12,
    txHash: "0x8765...4321"
  },
  {
    id: "TF-003",
    date: "2024-01-13",
    amount: 75000,
    sourceCurrency: "INR",
    destinationAmount: 84000,
    destinationCurrency: "RUB",
    recipient: "Maria Sokolova",
    status: "completed" as const,
    fee: 1350,
    exchangeRate: 1.12,
    txHash: "0x9876...5432"
  },
  {
    id: "TF-004",
    date: "2024-01-12",
    amount: 30000,
    sourceCurrency: "INR",
    destinationAmount: 33600,
    destinationCurrency: "RUB",
    recipient: "Vladimir Kuznetsov",
    status: "failed" as const,
    fee: 540,
    exchangeRate: 1.12,
    txHash: "0x1111...2222"
  },
  {
    id: "TF-005",
    date: "2024-01-11",
    amount: 100000,
    sourceCurrency: "INR",
    destinationAmount: 112000,
    destinationCurrency: "RUB",
    recipient: "Elena Smirnova",
    status: "completed" as const,
    fee: 1800,
    exchangeRate: 1.12,
    txHash: "0x3333...4444"
  }
]

function getStatusIcon(status: "completed" | "processing" | "failed" | "pending" | "cancelled") {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "processing":
      return <Clock className="h-4 w-4 text-blue-600" />
    case "failed":
      return <XCircle className="h-4 w-4 text-red-600" />
    case "pending":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    case "cancelled":
      return <Ban className="h-4 w-4 text-gray-600" />
  }
}

function getStatusBadge(status: "completed" | "processing" | "failed" | "pending" | "cancelled") {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
    case "processing":
      return <Badge variant="secondary">Processing</Badge>
    case "failed":
      return <Badge variant="destructive">Failed</Badge>
    case "pending":
      return <Badge variant="outline">Pending</Badge>
    case "cancelled":
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Cancelled</Badge>
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  })
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency === "INR" ? "INR" : "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export function TransferHistoryTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockTransfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(transfer.status)}
                      <span>{transfer.id}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(transfer.date)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {formatAmount(transfer.amount, transfer.sourceCurrency)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        → {formatAmount(transfer.destinationAmount, transfer.destinationCurrency)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Rate: {transfer.exchangeRate}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transfer.recipient}</div>
                      <div className="text-sm text-muted-foreground">
                        {transfer.sourceCurrency} → {transfer.destinationCurrency}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                  <TableCell>
                    <div className="font-medium">
                      ₹{transfer.fee.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/transfers/${transfer.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download Receipt
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Transfer ID
                        </DropdownMenuItem>
                        {transfer.txHash && (
                          <DropdownMenuItem>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View on Blockchain
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, mockTransfers.length)} of {mockTransfers.length} results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage * itemsPerPage >= mockTransfers.length}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
