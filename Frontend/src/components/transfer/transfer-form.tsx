"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown, Wallet, CreditCard, Building, Shield, Clock, CheckCircle } from "lucide-react"

export function TransferForm() {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState("10000")
  const [exchangeRate] = useState(0.89)
  const [fee] = useState(2.5)

  const calculateTransfer = () => {
    const amountNum = Number.parseFloat(amount) || 0
    const convertedAmount = amountNum * exchangeRate
    const feeAmount = convertedAmount * (fee / 100)
    const totalReceived = convertedAmount - feeAmount

    return {
      converted: convertedAmount,
      fee: feeAmount,
      received: totalReceived,
    }
  }

  const calculation = calculateTransfer()

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Send Amount */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">You Send</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-8 text-xl h-14"
                  placeholder="10000"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Indian Rupees</span>
                <Badge variant="secondary">INR</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receive Amount */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg">They Receive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <div className="h-14 px-3 py-2 border rounded-md bg-muted/50 flex items-center text-xl font-medium">
                  <span className="text-muted-foreground mr-2">₽</span>
                  {calculation.received.toFixed(2)}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Russian Rubles</span>
                <Badge variant="secondary">RUB</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exchange Rate Info */}
      <Card className="border-2 bg-muted/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-center mb-4">
            <ArrowUpDown className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium">1 INR = {exchangeRate} RUB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Our Fee ({fee}%)</span>
              <span className="font-medium">₽{calculation.fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total to Convert</span>
              <span className="font-medium">₽{calculation.converted.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center font-medium text-lg">
              <span>Recipient Gets</span>
              <span className="text-primary">₽{calculation.received.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full h-12 text-lg"
        onClick={() => setStep(2)}
        disabled={!amount || Number.parseFloat(amount) <= 0}
      >
        Continue to Recipient Details
      </Button>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Recipient Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" placeholder="Enter first name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" placeholder="Enter last name" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="recipient@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" placeholder="+7 XXX XXX XXXX" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address in Russia</Label>
            <Input id="address" placeholder="Enter full address" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>
          Back
        </Button>
        <Button className="flex-1" onClick={() => setStep(3)}>
          Continue to Payment
        </Button>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 cursor-pointer hover:border-primary transition-colors">
              <CardContent className="p-4 text-center">
                <Wallet className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="font-medium">Web3 Wallet</div>
                <div className="text-sm text-muted-foreground">MetaMask, WalletConnect</div>
              </CardContent>
            </Card>

            <Card className="border-2 cursor-pointer hover:border-primary transition-colors">
              <CardContent className="p-4 text-center">
                <CreditCard className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="font-medium">Debit/Credit Card</div>
                <div className="text-sm text-muted-foreground">Visa, Mastercard</div>
              </CardContent>
            </Card>

            <Card className="border-2 cursor-pointer hover:border-primary transition-colors">
              <CardContent className="p-4 text-center">
                <Building className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="font-medium">Bank Transfer</div>
                <div className="text-sm text-muted-foreground">UPI, NEFT, RTGS</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Summary */}
      <Card className="border-2 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Transfer Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Transfer Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You Send</span>
                  <span>₹{amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exchange Rate</span>
                  <span>1 INR = {exchangeRate} RUB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fee</span>
                  <span>₽{calculation.fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Recipient Gets</span>
                  <span className="text-primary">₽{calculation.received.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Delivery Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-secondary" />
                  <span>Delivery in 5-10 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  <span>Real-time tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-secondary" />
                  <span>Bank-level security</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(2)}>
          Back
        </Button>
        <Button className="flex-1" size="lg">
          Confirm & Send ₹{amount}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div
                className={`
                w-10 h-10 rounded-full flex items-center justify-center font-medium
                ${step >= stepNumber ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
              `}
              >
                {stepNumber}
              </div>
              {stepNumber < 3 && (
                <div
                  className={`
                  w-16 h-0.5 mx-2
                  ${step > stepNumber ? "bg-primary" : "bg-muted"}
                `}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-center mt-4">
          <div className="text-center">
            <div className="font-medium">
              {step === 1 && "Enter Amount"}
              {step === 2 && "Recipient Details"}
              {step === 3 && "Review & Pay"}
            </div>
            <div className="text-sm text-muted-foreground">Step {step} of 3</div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  )
}
