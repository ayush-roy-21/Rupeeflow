"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Lock, 
  Smartphone, 
  Mail,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle
} from "lucide-react"

const securityFeatures = [
  {
    id: "2fa",
    title: "Two-Factor Authentication",
    description: "Add an extra layer of security to your account",
    status: "enabled" as const,
    icon: Smartphone,
    lastUpdated: "2 weeks ago"
  },
  {
    id: "login-alerts",
    title: "Login Alerts",
    description: "Get notified of suspicious login attempts",
    status: "enabled" as const,
    icon: Mail,
    lastUpdated: "1 week ago"
  },
  {
    id: "session-timeout",
    title: "Session Timeout",
    description: "Automatically log out after inactivity",
    status: "enabled" as const,
    icon: Lock,
    lastUpdated: "3 days ago"
  },
  {
    id: "ip-restriction",
    title: "IP Restriction",
    description: "Limit access to specific IP addresses",
    status: "disabled" as const,
    icon: Shield,
    lastUpdated: "Never set"
  }
]

const recentLogins = [
  {
    id: "login_001",
    location: "Mumbai, India",
    device: "Chrome on Windows",
    ip: "192.168.1.100",
    time: "2 hours ago",
    status: "successful" as const
  },
  {
    id: "login_002",
    location: "Mumbai, India",
    device: "Chrome on Windows",
    ip: "192.168.1.100",
    time: "1 day ago",
    status: "successful" as const
  },
  {
    id: "login_003",
    location: "Unknown",
    device: "Unknown Device",
    ip: "203.45.67.89",
    time: "3 days ago",
    status: "failed" as const
  }
]

function getStatusIcon(status: "enabled" | "disabled") {
  return status === "enabled" ? (
    <CheckCircle className="h-4 w-4 text-green-600" />
  ) : (
    <AlertTriangle className="h-4 w-4 text-amber-600" />
  )
}

function getStatusBadge(status: "enabled" | "disabled") {
  return status === "enabled" ? (
    <Badge variant="default" className="bg-green-100 text-green-800">Enabled</Badge>
  ) : (
    <Badge variant="secondary">Disabled</Badge>
  )
}

function getLoginStatusBadge(status: "successful" | "failed") {
  return status === "successful" ? (
    <Badge variant="default" className="bg-green-100 text-green-800">Successful</Badge>
  ) : (
    <Badge variant="destructive">Failed</Badge>
  )
}

export function SecuritySettings() {
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: ""
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleChangePassword = async () => {
    // Handle password change
    console.log("Changing password:", passwords)
    setShowChangePassword(false)
    setPasswords({ current: "", new: "", confirm: "" })
  }

  const toggleSecurityFeature = (featureId: string) => {
    // Handle toggling security features
    console.log("Toggling feature:", featureId)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Security Settings</span>
        </CardTitle>
        <CardDescription>
          Manage your account security and privacy settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Features */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Security Features</h3>
          <div className="space-y-3">
            {securityFeatures.map((feature) => (
              <div
                key={feature.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{feature.title}</div>
                    <div className="text-sm text-muted-foreground">{feature.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Last updated: {feature.lastUpdated}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {getStatusIcon(feature.status)}
                  {getStatusBadge(feature.status)}
                  <Switch
                    checked={feature.status === "enabled"}
                    onCheckedChange={() => toggleSecurityFeature(feature.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Change Password */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Change Password</h3>
            <Button
              variant="outline"
              onClick={() => setShowChangePassword(!showChangePassword)}
            >
              <Key className="mr-2 h-4 w-4" />
              {showChangePassword ? "Cancel" : "Change Password"}
            </Button>
          </div>
          
          {showChangePassword && (
            <div className="p-4 border rounded-lg space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPassword ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwords.new}
                  onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                />
              </div>
              
              <Button onClick={handleChangePassword} className="w-full">
                Update Password
              </Button>
            </div>
          )}
        </div>

        {/* Recent Logins */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Recent Login Activity</h3>
          <div className="space-y-3">
            {recentLogins.map((login) => (
              <div
                key={login.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium">{login.location}</div>
                    <div className="text-sm text-muted-foreground">{login.device}</div>
                    <div className="text-xs text-muted-foreground">
                      IP: {login.ip} • {login.time}
                    </div>
                  </div>
                </div>
                
                {getLoginStatusBadge(login.status)}
              </div>
            ))}
          </div>
          
          <Button variant="outline" className="w-full">
            View All Login Activity
          </Button>
        </div>

        {/* Security Tips */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-blue-800">Security Tips</div>
              <ul className="text-blue-700 mt-1 space-y-1">
                <li>• Use a strong, unique password</li>
                <li>• Enable two-factor authentication</li>
                <li>• Monitor your login activity regularly</li>
                <li>• Never share your credentials with anyone</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
