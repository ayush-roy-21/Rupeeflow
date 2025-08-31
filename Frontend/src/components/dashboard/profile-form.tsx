"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building,
  Save,
  X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const countries = [
  { code: "IN", name: "India" },
  { code: "RU", name: "Russia" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" }
]

const accountTypes = [
  { value: "individual", label: "Individual" },
  { value: "business", label: "Business" },
  { value: "corporate", label: "Corporate" }
]

const initialProfile = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+91 98765 43210",
  country: "IN",
  city: "Mumbai",
  address: "123 Main Street, Andheri West",
  postalCode: "400058",
  accountType: "individual",
  companyName: "",
  occupation: "Software Engineer"
}

export function ProfileForm() {
  const [profile, setProfile] = useState(initialProfile)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setProfile(initialProfile)
    setIsEditing(false)
  }

  const updateProfile = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>
              Update your personal information and contact details
            </CardDescription>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <User className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Personal Information</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profile.firstName}
                onChange={(e) => updateProfile("firstName", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profile.lastName}
                onChange={(e) => updateProfile("lastName", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => updateProfile("email", e.target.value)}
                disabled={!isEditing}
              />
              {!isEditing && (
                <Badge variant="secondary">Verified</Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) => updateProfile("phone", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation</Label>
            <Input
              id="occupation"
              value={profile.occupation}
              onChange={(e) => updateProfile("occupation", e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Address Information</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select 
                value={profile.country} 
                onValueChange={(value) => updateProfile("country", value)}
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={profile.city}
                onChange={(e) => updateProfile("city", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={profile.address}
              onChange={(e) => updateProfile("address", e.target.value)}
              disabled={!isEditing}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              value={profile.postalCode}
              onChange={(e) => updateProfile("postalCode", e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Account Type */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Account Information</h3>
          
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type</Label>
            <Select 
              value={profile.accountType} 
              onValueChange={(value) => updateProfile("accountType", value)}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {accountTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {profile.accountType === "business" && (
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={profile.companyName}
                onChange={(e) => updateProfile("companyName", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center space-x-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              {isSaving ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}

        {/* Information Note */}
        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p>
            Some information may require verification before changes take effect. 
            Contact support if you need to update verified information.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
