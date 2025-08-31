"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Clock, 
  Shield, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  Info
} from "lucide-react"

interface TransferSummaryProps {
  // This would be populated from the form data
}

export function TransferSummary() {
  const [isCalculated, setIsCalculated] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Mock data - in real app this would come from form state or API
  const mockTransfer = {
    sourceAmount: 50000,
    sourceCurrency: "INR",
    destinationAmount: 56000,
    destinationCurrency: "RUB",
    exchangeRate: 1.12,
    fee: 900,
    totalAmount: 50900,
    estimatedTime: "25-30 minutes",
    recipient: "Anastasia Petrova",
    purpose: "Family Support"
  }

  const handleConfirmTransfer = () => {
    setIsProcessing(true)
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false)
      // Navigate to payment page or show success
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {!isCalculated ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Calculate Transfer</h3>
          <p className="text-muted-foreground">
            Fill in the transfer details and click "Calculate Transfer" to see the summary
          </p>
        </div>
      ) : (
        <>
          {/* Transfer Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">You send</span>
              <div className="text-right">
                <div className="text-2xl font-bold">₹{mockTransfer.sourceAmount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">{mockTransfer.sourceCurrency}</div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">They receive</span>
              <div className="text-right">
                <div className="text-2xl font-bold">{mockTransfer.destinationAmount.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">{mockTransfer.destinationCurrency}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Transfer Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Exchange Rate</span>
              <span className="font-medium">1 {mockTransfer.sourceCurrency} = {mockTransfer.exchangeRate} {mockTransfer.destinationCurrency}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transfer Fee</span>
              <span className="font-medium">₹{mockTransfer.fee.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-lg font-bold">₹{mockTransfer.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <Separator />

          {/* Transfer Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Recipient</span>
              <span className="font-medium">{mockTransfer.recipient}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Purpose</span>
              <span className="font-medium">{mockTransfer.purpose}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated Time</span>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{mockTransfer.estimatedTime}</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="mx-auto w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="text-xs text-muted-foreground">Best Rate</div>
                </div>
                <div className="space-y-1">
                  <div className="mx-auto w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Clock className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="text-xs text-muted-foreground">Fast</div>
                </div>
                <div className="space-y-1">
                  <div className="mx-auto w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield className="h-3 w-3 text-purple-600" />
                  </div>
                  <div className="text-xs text-muted-foreground">Secure</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confirm Button */}
          <Button 
            onClick={handleConfirmTransfer}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirm Transfer
              </>
            )}
          </Button>

          {/* Important Notes */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                By confirming, you agree to our terms and conditions. The exchange rate is locked for 15 minutes.
              </span>
            </div>
            
            <div className="flex items-start space-x-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>
                Please ensure all recipient details are correct. Changes cannot be made after confirmation.
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
