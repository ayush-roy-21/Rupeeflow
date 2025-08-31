"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Info, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Shield,
  Lock,
  Eye
} from "lucide-react"

const verificationLevels = [
  {
    level: "Basic",
    description: "Email and phone verification",
    transferLimit: "₹10,000 per transfer",
    monthlyLimit: "₹50,000 per month",
    requirements: ["Email verification", "Phone verification"],
    status: "completed" as const
  },
  {
    level: "Standard",
    description: "Identity document verification",
    transferLimit: "₹50,000 per transfer",
    monthlyLimit: "₹2,00,000 per month",
    requirements: ["Passport/Aadhaar", "Address proof", "Selfie verification"],
    status: "in_progress" as const
  },
  {
    level: "Enhanced",
    description: "Enhanced due diligence",
    transferLimit: "₹2,00,000 per transfer",
    monthlyLimit: "₹10,00,000 per month",
    requirements: ["Enhanced verification", "Source of funds", "Additional documents"],
    status: "locked" as const
  }
]

const complianceInfo = [
  {
    title: "Data Security",
    description: "All documents are encrypted and stored securely",
    icon: Shield
  },
  {
    title: "Privacy Protection",
    description: "Your information is protected under data protection laws",
    icon: Lock
  },
  {
    title: "Regulatory Compliance",
    description: "We comply with RBI and local regulations",
    icon: Eye
  }
]

function getStatusIcon(status: "completed" | "in_progress" | "locked") {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-5 w-5 text-green-600" />
    case "in_progress":
      return <Clock className="h-5 w-5 text-blue-600" />
    case "locked":
      return <AlertTriangle className="h-5 w-5 text-amber-600" />
  }
}

function getStatusBadge(status: "completed" | "in_progress" | "locked") {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
    case "in_progress":
      return <Badge variant="secondary">In Progress</Badge>
    case "locked":
      return <Badge variant="outline">Locked</Badge>
  }
}

export function KYCRequirements() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Levels & Requirements</CardTitle>
        <CardDescription>
          Complete verification levels to unlock higher transfer limits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verification Levels */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Verification Levels</h3>
          <div className="space-y-3">
            {verificationLevels.map((level) => (
              <div
                key={level.level}
                className={`p-4 border rounded-lg ${
                  level.status === "in_progress" ? "bg-muted/50 border-primary" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(level.status)}
                    <div>
                      <div className="font-medium">{level.level}</div>
                      <div className="text-sm text-muted-foreground">{level.description}</div>
                    </div>
                  </div>
                  {getStatusBadge(level.status)}
                </div>
                
                <div className="grid gap-3 md:grid-cols-2 mb-3">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Transfer Limit:</span>
                    <div className="font-medium">{level.transferLimit}</div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Monthly Limit:</span>
                    <div className="font-medium">{level.monthlyLimit}</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Requirements:</div>
                  <div className="flex flex-wrap gap-2">
                    {level.requirements.map((req) => (
                      <Badge key={req} variant="secondary" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {level.status === "in_progress" && (
                  <Button className="w-full mt-3">
                    Continue Verification
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Security & Compliance</h3>
          <div className="grid gap-4 md:grid-cols-1">
            {complianceInfo.map((info) => (
              <div key={info.title} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                  <info.icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{info.title}</div>
                  <div className="text-sm text-muted-foreground">{info.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Notes */}
        <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-amber-800">Important Notes</div>
              <ul className="text-amber-700 mt-1 space-y-1">
                <li>• All documents must be clear and legible</li>
                <li>• Documents should not be expired</li>
                <li>• Processing time: 2-3 business days</li>
                <li>• You may be contacted for additional verification</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Help & Support */}
        <div className="text-center">
          <Button variant="outline" className="w-full">
            <Info className="mr-2 h-4 w-4" />
            Need Help with KYC?
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
