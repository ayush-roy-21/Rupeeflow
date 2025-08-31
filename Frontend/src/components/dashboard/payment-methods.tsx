"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  Building2, 
  Plus, 
  Edit, 
  Trash2,
  Shield,
  CheckCircle
} from "lucide-react"

const paymentMethods = [
  {
    id: "pm_001",
    type: "bank" as const,
    name: "HDFC Bank",
    accountNumber: "XXXX1234",
    accountType: "Savings",
    isDefault: true,
    status: "verified" as const
  },
  {
    id: "pm_002",
    type: "card" as const,
    name: "HDFC Credit Card",
    cardNumber: "XXXX-XXXX-XXXX-5678",
    cardType: "Credit",
    isDefault: false,
    status: "verified" as const
  },
  {
    id: "pm_003",
    type: "bank" as const,
    name: "SBI Bank",
    accountNumber: "XXXX5678",
    accountType: "Current",
    isDefault: false,
    status: "pending" as const
  }
]

function getPaymentMethodIcon(type: "bank" | "card") {
  return type === "bank" ? (
    <Building2 className="h-5 w-5 text-blue-600" />
  ) : (
    <CreditCard className="h-5 w-5 text-green-600" />
  )
}

function getStatusBadge(status: "verified" | "pending" | "failed") {
  switch (status) {
    case "verified":
      return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>
    case "pending":
      return <Badge variant="secondary">Pending</Badge>
    case "failed":
      return <Badge variant="destructive">Failed</Badge>
  }
}

export function PaymentMethods() {
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>
              Manage your linked bank accounts and cards
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center space-x-3">
              {getPaymentMethodIcon(method.type)}
              <div>
                <div className="font-medium">{method.name}</div>
                <div className="text-sm text-muted-foreground">
                  {method.type === "bank" 
                    ? `${method.accountType} • ${method.accountNumber}`
                    : `${method.cardType} • ${method.cardNumber}`
                  }
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusBadge(method.status)}
                  {method.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {paymentMethods.length === 0 && (
          <div className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Payment Methods</h3>
            <p className="text-muted-foreground mb-4">
              Add a bank account or card to start making transfers
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Payment Method
            </Button>
          </div>
        )}

        {/* Security Note */}
        <div className="flex items-start space-x-2 text-sm text-muted-foreground pt-4 border-t">
          <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            Your payment information is encrypted and secure. We never store your full card details.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
