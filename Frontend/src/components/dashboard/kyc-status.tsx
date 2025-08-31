"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  FileText,
  Camera,
  Building2
} from "lucide-react"

const kycSteps = [
  {
    id: "personal-info",
    title: "Personal Information",
    description: "Basic details and contact information",
    status: "completed" as const,
    icon: User
  },
  {
    id: "identity-docs",
    title: "Identity Documents",
    description: "Passport, Aadhaar, or driving license",
    status: "completed" as const,
    icon: FileText
  },
  {
    id: "address-proof",
    title: "Address Proof",
    description: "Utility bills or bank statements",
    status: "pending" as const,
    icon: Building2
  },
  {
    id: "selfie-verification",
    title: "Selfie Verification",
    description: "Live photo for identity confirmation",
    status: "pending" as const,
    icon: Camera
  }
]

const kycData = {
  overallStatus: "in_progress" as const,
  completionPercentage: 50,
  currentStep: "address-proof",
  estimatedTime: "2-3 business days",
  transferLimit: "₹50,000 per transfer",
  monthlyLimit: "₹2,00,000 per month"
}

function getStatusIcon(status: "completed" | "pending" | "failed") {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case "pending":
      return <Clock className="h-5 w-5 text-amber-600" />
    case "failed":
      return <AlertCircle className="h-5 w-5 text-red-600" />
  }
}

function getStatusBadge(status: "completed" | "pending" | "failed") {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
    case "pending":
      return <Badge variant="secondary">Pending</Badge>
    case "failed":
      return <Badge variant="destructive">Failed</Badge>
  }
}

function getOverallStatusBadge(status: "not_started" | "in_progress" | "completed" | "rejected") {
  switch (status) {
    case "not_started":
      return <Badge variant="outline">Not Started</Badge>
    case "in_progress":
      return <Badge variant="secondary">In Progress</Badge>
    case "completed":
      return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>
  }
}

export function KYCStatus() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>KYC Status</span>
            </CardTitle>
            <CardDescription>
              Complete verification to unlock higher transfer limits
            </CardDescription>
          </div>
          {getOverallStatusBadge(kycData.overallStatus)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Overview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Verification Progress</span>
            <span className="text-sm text-muted-foreground">
              {kycData.completionPercentage}% Complete
            </span>
          </div>
          <Progress value={kycData.completionPercentage} className="h-2" />
          <div className="text-sm text-muted-foreground">
            Estimated completion time: {kycData.estimatedTime}
          </div>
        </div>

        {/* Current Limits */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Current Transfer Limit</div>
            <div className="text-lg font-semibold">{kycData.transferLimit}</div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="text-sm text-muted-foreground">Monthly Limit</div>
            <div className="text-lg font-semibold">{kycData.monthlyLimit}</div>
          </div>
        </div>

        {/* KYC Steps */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Verification Steps</h3>
          <div className="space-y-3">
            {kycSteps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  step.id === kycData.currentStep ? "bg-muted/50 border-primary" : ""
                }`}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                  <step.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-sm text-muted-foreground">{step.description}</div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(step.status)}
                  {getStatusBadge(step.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-4 border-t">
          <Button className="flex-1">
            Continue Verification
          </Button>
          <Button variant="outline">
            View Requirements
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
