"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/contexts/WalletContext"
import { createBlockchainService, TransferData } from "@/lib/blockchain-service"
import { CONTRACT_ADDRESSES } from "@/lib/blockchain"
import { 
  Calculator, 
  Clock, 
  Shield, 
  TrendingUp,
  AlertCircle,
  Wallet,
  CheckCircle,
  XCircle
} from "lucide-react"

const sourceCountries = [
  { code: "IN", name: "India", currency: "INR" },
  { code: "RU", name: "Russia", currency: "RUB" },
  { code: "US", name: "United States", currency: "USD" }
]

const destinationCountries = [
  { code: "IN", name: "India", currency: "INR" },
  { code: "RU", name: "Russia", currency: "RUB" }
]

export function SendMoneyForm() {
  const { isConnected, account, signer } = useWallet()
  const { toast } = useToast()
  
  const [sourceCountry, setSourceCountry] = useState("IN")
  const [destinationCountry, setDestinationCountry] = useState("RU")
  const [amount, setAmount] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [purpose, setPurpose] = useState("")
  const [isCalculating, setIsCalculating] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [quote, setQuote] = useState<any>(null)
  const [selectedToken, setSelectedToken] = useState("USDC")

  const handleCalculate = async () => {
    if (!amount || !sourceCountry || !destinationCountry) return
    
    setIsCalculating(true)
    try {
      // Simulate API call for quote
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockQuote = {
        sourceAmount: parseFloat(amount),
        destinationAmount: parseFloat(amount) * 1.12, // Mock exchange rate
        exchangeRate: 1.12,
        fees: {
          baseFee: parseFloat(amount) * 0.018,
          processingFee: 0,
          totalFee: parseFloat(amount) * 0.018
        },
        totalAmount: parseFloat(amount) * 1.018
      }
      
      setQuote(mockQuote)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to calculate quote",
        variant: "destructive"
      })
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSendMoney = async () => {
    if (!isConnected || !signer || !account) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to send money",
        variant: "destructive"
      })
      return
    }

    if (!quote) {
      toast({
        title: "No Quote",
        description: "Please calculate a quote first",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const blockchainService = createBlockchainService(signer)
      
      // Prepare transfer data
      const transferData: TransferData = {
        recipient: "0x0000000000000000000000000000000000000000", // Mock recipient
        amount: amount,
        stablecoin: CONTRACT_ADDRESSES[selectedToken as keyof typeof CONTRACT_ADDRESSES] || CONTRACT_ADDRESSES.USDC,
        sourceCurrency: sourceCountries.find(c => c.code === sourceCountry)?.currency || "INR",
        destinationCurrency: destinationCountries.find(c => c.code === destinationCountry)?.currency || "RUB",
        sourceCountry: sourceCountries.find(c => c.code === sourceCountry)?.name || "India",
        destinationCountry: destinationCountries.find(c => c.code === destinationCountry)?.name || "Russia",
        recipientDetails: JSON.stringify({
          name: recipientName,
          phone: recipientPhone,
          email: recipientEmail,
          purpose: purpose
        })
      }

      // Initiate transfer
      const result = await blockchainService.initiateTransfer(transferData)
      
      toast({
        title: "Transfer Initiated",
        description: `Transfer ID: ${result.transferId}. Transaction: ${result.txHash.slice(0, 10)}...`,
        variant: "default"
      })

      // Reset form
      setAmount("")
      setRecipientName("")
      setRecipientPhone("")
      setRecipientEmail("")
      setPurpose("")
      setQuote(null)

    } catch (error: any) {
      console.error('Transfer error:', error)
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to initiate transfer",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const isFormValid = amount && recipientName && recipientPhone && sourceCountry !== destinationCountry

  return (
    <div className="space-y-6">
      {/* Transfer Direction */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="source-country">From</Label>
          <Select value={sourceCountry} onValueChange={setSourceCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {sourceCountries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name} ({country.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="destination-country">To</Label>
          <Select value={destinationCountry} onValueChange={setDestinationCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {destinationCountries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name} ({country.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount">Amount to Send</Label>
        <div className="relative">
          <Input
            id="amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pr-20"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-sm text-muted-foreground">
              {sourceCountries.find(c => c.code === sourceCountry)?.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex flex-wrap gap-2">
        {[1000, 5000, 10000, 25000, 50000].map((quickAmount) => (
          <Button
            key={quickAmount}
            variant="outline"
            size="sm"
            onClick={() => setAmount(quickAmount.toString())}
          >
            ₹{quickAmount.toLocaleString()}
          </Button>
        ))}
      </div>

      {/* Recipient Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Recipient Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="recipient-name">Full Name</Label>
          <Input
            id="recipient-name"
            placeholder="Enter recipient's full name"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient-phone">Phone Number</Label>
          <Input
            id="recipient-phone"
            placeholder="+7 (XXX) XXX-XX-XX"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recipient-email">Email (Optional)</Label>
          <Input
            id="recipient-email"
            type="email"
            placeholder="recipient@example.com"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purpose">Purpose of Transfer</Label>
          <Select value={purpose} onValueChange={setPurpose}>
            <SelectTrigger>
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="family-support">Family Support</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="investment">Investment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transfer Features */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="mx-auto w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-xs">
                <div className="font-medium">Best Rate</div>
                <div className="text-muted-foreground">Guaranteed</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-xs">
                <div className="font-medium">Fast</div>
                <div className="text-muted-foreground">30 min</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="mx-auto w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-xs">
                <div className="font-medium">Secure</div>
                <div className="text-muted-foreground">Blockchain</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Connection Status */}
      {!isConnected && (
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to send money using blockchain technology.
          </AlertDescription>
        </Alert>
      )}

      {/* Quote Display */}
      {quote && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Transfer Quote</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Amount to Send:</span>
                <span className="font-medium">₹{quote.sourceAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Exchange Rate:</span>
                <span className="font-medium">1 INR = {quote.exchangeRate} RUB</span>
              </div>
              <div className="flex justify-between">
                <span>Amount to Receive:</span>
                <span className="font-medium">₽{quote.destinationAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Fee:</span>
                <span>₹{quote.fees.totalFee.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>₹{quote.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Selection */}
      {quote && (
        <div className="space-y-2">
          <Label>Select Stablecoin</Label>
          <Select value={selectedToken} onValueChange={setSelectedToken}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USDC">USDC (USD Coin)</SelectItem>
              <SelectItem value="USDT">USDT (Tether)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleCalculate}
          disabled={!amount || sourceCountry === destinationCountry || isCalculating}
          className="flex-1"
        >
          <Calculator className="mr-2 h-4 w-4" />
          {isCalculating ? "Calculating..." : "Calculate"}
        </Button>
        <Button
          onClick={handleSendMoney}
          disabled={!isFormValid || !quote || !isConnected || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Send Money
            </>
          )}
        </Button>
      </div>

      {/* Validation Message */}
      {sourceCountry === destinationCountry && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>Source and destination countries must be different</span>
        </div>
      )}
    </div>
  )
}
