"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react"

const userProfile = {
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "+91 98765 43210",
  country: "India",
  city: "Mumbai",
  joinDate: "January 2023",
  kycStatus: "verified" as const,
  accountType: "Individual",
  lastLogin: "2 hours ago",
  totalTransfers: 47,
  totalVolume: "₹12,50,000"
}

const accountStats = [
  {
    label: "Total Transfers",
    value: userProfile.totalTransfers,
    icon: CheckCircle,
    color: "text-green-600"
  },
  {
    label: "Total Volume",
    value: userProfile.totalVolume,
    icon: CheckCircle,
    color: "text-blue-600"
  },
  {
    label: "Member Since",
    value: userProfile.joinDate,
    icon: Calendar,
    color: "text-purple-600"
  },
  {
    label: "Last Login",
    value: userProfile.lastLogin,
    icon: Clock,
    color: "text-amber-600"
  }
]

function getKYCStatusBadge(status: "verified" | "pending" | "rejected" | "not_started") {
  switch (status) {
    case "verified":
      return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>
    case "pending":
      return <Badge variant="secondary">Under Review</Badge>
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>
    case "not_started":
      return <Badge variant="outline">Not Started</Badge>
  }
}

export function ProfileOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Overview</CardTitle>
        <CardDescription>
          Your account information and statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src="/avatars/user.png" alt={userProfile.name} />
            <AvatarFallback className="text-2xl">
              {userProfile.name.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold">{userProfile.name}</h2>
              {getKYCStatusBadge(userProfile.kycStatus)}
            </div>
            <p className="text-muted-foreground mb-2">
              {userProfile.accountType} Account
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Joined {userProfile.joinDate}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Last login {userProfile.lastLogin}</span>
              </div>
            </div>
          </div>
          
          <Button variant="outline">
            Edit Profile
          </Button>
        </div>

        {/* Contact Information */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Contact Information</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{userProfile.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{userProfile.phone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{userProfile.city}, {userProfile.country}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Account Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">KYC Status</span>
                {getKYCStatusBadge(userProfile.kycStatus)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Type</span>
                <span className="font-medium">{userProfile.accountType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Member Since</span>
                <span className="font-medium">{userProfile.joinDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Account Statistics</h3>
          <div className="grid gap-4 md:grid-cols-4">
            {accountStats.map((stat) => (
              <div key={stat.label} className="p-3 border rounded-lg text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full mx-auto mb-2">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="font-semibold">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Status */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Security Status</div>
              <div className="text-sm text-muted-foreground mt-1">
                Your account is protected with two-factor authentication and regular security monitoring. 
                Last security review: 2 weeks ago.
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
