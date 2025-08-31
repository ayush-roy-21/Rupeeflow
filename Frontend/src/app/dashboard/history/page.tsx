import { TransferHistoryTable } from "@/components/dashboard/transfer-history-table"
import { TransferHistoryFilters } from "@/components/dashboard/transfer-history-filters"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Filter } from "lucide-react"

export default function TransferHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transfer History</h1>
          <p className="text-muted-foreground">
            View and manage all your money transfers
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <TransferHistoryFilters />
        <TransferHistoryTable />
      </div>
    </div>
  )
}
