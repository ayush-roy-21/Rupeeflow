import { KYCStatus } from "@/components/dashboard/kyc-status"
import { DocumentUpload } from "@/components/dashboard/document-upload"
import { KYCRequirements } from "@/components/dashboard/kyc-requirements"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function KYCPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">KYC & Compliance</h1>
        <p className="text-muted-foreground">
          Complete your identity verification to unlock higher transfer limits
        </p>
      </div>

      <div className="grid gap-6">
        <KYCStatus />
        
        <div className="grid gap-6 lg:grid-cols-2">
          <DocumentUpload />
          <KYCRequirements />
        </div>
      </div>
    </div>
  )
}
