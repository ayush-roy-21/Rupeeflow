"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  FileText, 
  Image, 
  CheckCircle, 
  XCircle,
  Download,
  Eye,
  Trash2
} from "lucide-react"

const documentTypes = [
  {
    id: "passport",
    name: "Passport",
    description: "Valid passport with photo and signature",
    required: true,
    acceptedFormats: ["PDF", "JPG", "PNG"],
    maxSize: "5MB"
  },
  {
    id: "aadhaar",
    name: "Aadhaar Card",
    description: "Aadhaar card or e-Aadhaar",
    required: true,
    acceptedFormats: ["PDF", "JPG", "PNG"],
    maxSize: "5MB"
  },
  {
    id: "driving-license",
    name: "Driving License",
    description: "Valid driving license",
    required: false,
    acceptedFormats: ["PDF", "JPG", "PNG"],
    maxSize: "5MB"
  },
  {
    id: "address-proof",
    name: "Address Proof",
    description: "Utility bill, bank statement, or rental agreement",
    required: true,
    acceptedFormats: ["PDF", "JPG", "PNG"],
    maxSize: "5MB"
  }
]

const uploadedDocuments = [
  {
    id: "doc_001",
    type: "passport",
    name: "passport_front.pdf",
    size: "2.3MB",
    status: "verified" as const,
    uploadedAt: "2 days ago"
  },
  {
    id: "doc_002",
    type: "aadhaar",
    name: "aadhaar_card.pdf",
    size: "1.8MB",
    status: "pending" as const,
    uploadedAt: "1 day ago"
  }
]

function getDocumentIcon(type: string) {
  switch (type) {
    case "passport":
      return <FileText className="h-5 w-5 text-blue-600" />
    case "aadhaar":
      return <FileText className="h-5 w-5 text-green-600" />
    case "driving-license":
      return <FileText className="h-5 w-5 text-purple-600" />
    case "address-proof":
      return <FileText className="h-5 w-5 text-orange-600" />
    default:
      return <FileText className="h-5 w-5 text-gray-600" />
  }
}

function getStatusBadge(status: "verified" | "pending" | "rejected") {
  switch (status) {
    case "verified":
      return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>
    case "pending":
      return <Badge variant="secondary">Under Review</Badge>
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>
  }
}

export function DocumentUpload() {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle file upload
      console.log("File dropped:", e.dataTransfer.files[0])
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Upload</CardTitle>
        <CardDescription>
          Upload required documents for KYC verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop files here, or click to browse
          </p>
          <Button>
            Choose Files
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Supported formats: PDF, JPG, PNG (Max 5MB each)
          </p>
        </div>

        {/* Document Requirements */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Required Documents</h3>
          <div className="space-y-3">
            {documentTypes.map((docType) => (
              <div
                key={docType.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getDocumentIcon(docType.id)}
                  <div>
                    <div className="font-medium flex items-center space-x-2">
                      {docType.name}
                      {docType.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {docType.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {docType.acceptedFormats.join(", ")} • Max {docType.maxSize}
                    </div>
                  </div>
                </div>
                
                <Button variant="outline" size="sm">
                  Upload
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Uploaded Documents */}
        {uploadedDocuments.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Uploaded Documents</h3>
            <div className="space-y-3">
              {uploadedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getDocumentIcon(doc.type)}
                    <div>
                      <div className="font-medium">{doc.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {doc.size} • {doc.uploadedAt}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(doc.status)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Upload Progress</span>
            <span>2 of 4 documents uploaded</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: "50%" }}></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
