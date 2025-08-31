"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Send, 
  Download, 
  Upload, 
  CreditCard,
  FileText,
  HelpCircle
} from "lucide-react"
import Link from "next/link"

const actions = [
  {
    title: "Send Money",
    description: "Transfer money to India or Russia",
    icon: Send,
    href: "/dashboard/send",
    variant: "default" as const,
    color: "text-blue-600"
  },
  {
    title: "Download Receipt",
    description: "Get your transfer receipt",
    icon: Download,
    href: "/dashboard/receipts",
    variant: "outline" as const,
    color: "text-green-600"
  },
  {
    title: "Upload Documents",
    description: "Submit KYC documents",
    icon: Upload,
    href: "/dashboard/kyc",
    variant: "outline" as const,
    color: "text-purple-600"
  },
  {
    title: "Add Payment Method",
    description: "Link bank account or card",
    icon: CreditCard,
    href: "/dashboard/payment-methods",
    variant: "outline" as const,
    color: "text-orange-600"
  },
  {
    title: "View Statements",
    description: "Download monthly statements",
    icon: FileText,
    href: "/dashboard/statements",
    variant: "outline" as const,
    color: "text-indigo-600"
  },
  {
    title: "Get Help",
    description: "Contact support team",
    icon: HelpCircle,
    href: "/dashboard/support",
    variant: "outline" as const,
    color: "text-gray-600"
  }
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {actions.map((action) => (
          <Link key={action.title} href={action.href}>
            <Button 
              variant={action.variant} 
              className="w-full justify-start h-auto p-3"
            >
              <action.icon className={`mr-3 h-4 w-4 ${action.color}`} />
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs text-muted-foreground">
                  {action.description}
                </div>
              </div>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
