"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Filter, 
  X,
  Calendar,
  DollarSign
} from "lucide-react"

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "completed", label: "Completed" },
  { value: "processing", label: "Processing" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
  { value: "cancelled", label: "Cancelled" }
]

const amountRanges = [
  { value: "all", label: "All Amounts" },
  { value: "0-10000", label: "₹0 - ₹10,000" },
  { value: "10000-50000", label: "₹10,000 - ₹50,000" },
  { value: "50000-100000", label: "₹50,000 - ₹1,00,000" },
  { value: "100000+", label: "₹1,00,000+" }
]

const currencyPairs = [
  { value: "all", label: "All Currencies" },
  { value: "INR-RUB", label: "INR → RUB" },
  { value: "RUB-INR", label: "RUB → INR" },
  { value: "USD-INR", label: "USD → INR" },
  { value: "USD-RUB", label: "USD → RUB" }
]

export function TransferHistoryFilters() {
  const [searchQuery, setSearchQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [amountRange, setAmountRange] = useState("all")
  const [currencyPair, setCurrencyPair] = useState("all")
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })

  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const handleApplyFilters = () => {
    const filters = []
    if (status !== "all") filters.push(`Status: ${statusOptions.find(s => s.value === status)?.label}`)
    if (amountRange !== "all") filters.push(`Amount: ${amountRanges.find(a => a.value === amountRange)?.label}`)
    if (currencyPair !== "all") filters.push(`Currency: ${currencyPairs.find(c => c.value === currencyPair)?.label}`)
    if (dateRange.from || dateRange.to) filters.push("Date Range")
    
    setActiveFilters(filters)
  }

  const clearFilters = () => {
    setStatus("all")
    setAmountRange("all")
    setCurrencyPair("all")
    setDateRange({ from: undefined, to: undefined })
    setActiveFilters([])
  }

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter))
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by transfer ID, recipient name, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount-range">Amount Range</Label>
              <Select value={amountRange} onValueChange={setAmountRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select amount range" />
                </SelectTrigger>
                <SelectContent>
                  {amountRanges.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency-pair">Currency Pair</Label>
              <Select value={currencyPair} onValueChange={setCurrencyPair}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency pair" />
                </SelectTrigger>
                <SelectContent>
                  {currencyPairs.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => {/* Open date picker */}}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                      </>
                    ) : (
                      dateRange.from.toLocaleDateString()
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <Button onClick={handleApplyFilters} className="w-full md:w-auto">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters} className="w-full md:w-auto">
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="flex items-center space-x-1">
              <span>{filter}</span>
              <button
                onClick={() => removeFilter(filter)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
