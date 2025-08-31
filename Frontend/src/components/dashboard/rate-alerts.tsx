"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  Plus, 
  Trash2, 
  Edit,
  TrendingUp,
  TrendingDown
} from "lucide-react"

const alertTypes = [
  { value: "above", label: "Rate goes above", icon: TrendingUp },
  { value: "below", label: "Rate goes below", icon: TrendingDown }
]

const currencyPairs = [
  { value: "INR-RUB", label: "INR → RUB" },
  { value: "RUB-INR", label: "RUB → INR" },
  { value: "USD-INR", label: "USD → INR" },
  { value: "USD-RUB", label: "USD → RUB" }
]

const notificationMethods = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "push", label: "Push Notification" }
]

const existingAlerts = [
  {
    id: "alert_001",
    pair: "INR-RUB",
    type: "above",
    rate: 1.15,
    isActive: true,
    notifications: ["email", "push"],
    createdAt: "2 days ago"
  },
  {
    id: "alert_002",
    pair: "USD-INR",
    type: "below",
    rate: 83.00,
    isActive: false,
    notifications: ["email"],
    createdAt: "1 week ago"
  }
]

export function RateAlerts() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAlert, setNewAlert] = useState<{
    pair: string
    type: "above" | "below"
    rate: string
    notifications: string[]
  }>({
    pair: "",
    type: "above",
    rate: "",
    notifications: ["email"]
  })

  const handleAddAlert = () => {
    // Handle adding new alert
    console.log("Adding alert:", newAlert)
    setShowAddForm(false)
    setNewAlert({ pair: "", type: "above", rate: "", notifications: ["email"] })
  }

  const toggleAlert = (alertId: string) => {
    // Handle toggling alert status
    console.log("Toggling alert:", alertId)
  }

  const deleteAlert = (alertId: string) => {
    // Handle deleting alert
    console.log("Deleting alert:", alertId)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Rate Alerts</span>
            </CardTitle>
            <CardDescription>
              Get notified when rates reach your target levels
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Alert
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Alert Form */}
        {showAddForm && (
          <div className="p-4 border rounded-lg space-y-4">
            <h3 className="font-medium">Add New Rate Alert</h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currency-pair">Currency Pair</Label>
                <Select value={newAlert.pair} onValueChange={(value: string) => setNewAlert({...newAlert, pair: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyPairs.map((pair) => (
                      <SelectItem key={pair.value} value={pair.value}>
                        {pair.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="alert-type">Alert Type</Label>
                <Select value={newAlert.type} onValueChange={(value: "above" | "below") => setNewAlert({...newAlert, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {alertTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center space-x-2">
                          <type.icon className="h-4 w-4" />
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="target-rate">Target Rate</Label>
              <Input
                id="target-rate"
                type="number"
                step="0.01"
                placeholder="Enter target rate"
                value={newAlert.rate}
                onChange={(e) => setNewAlert({...newAlert, rate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Notification Methods</Label>
              <div className="flex flex-wrap gap-2">
                {notificationMethods.map((method) => (
                  <label key={method.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newAlert.notifications.includes(method.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewAlert({
                            ...newAlert,
                            notifications: [...newAlert.notifications, method.value]
                          })
                        } else {
                          setNewAlert({
                            ...newAlert,
                            notifications: newAlert.notifications.filter(n => n !== method.value)
                          })
                        }
                      }}
                    />
                    <span className="text-sm">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button onClick={handleAddAlert} className="flex-1">
                Create Alert
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Existing Alerts */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Your Rate Alerts</h3>
          
          {existingAlerts.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Rate Alerts</h3>
              <p className="text-muted-foreground mb-4">
                Create your first rate alert to get notified when rates reach your target
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {existingAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                      {alert.type === "above" ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {currencyPairs.find(p => p.value === alert.pair)?.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {alert.type === "above" ? "Above" : "Below"} {alert.rate}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={alert.isActive ? "default" : "secondary"}>
                          {alert.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {alert.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={alert.isActive}
                      onCheckedChange={() => toggleAlert(alert.id)}
                    />
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4" onClick={() => deleteAlert(alert.id)} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Information */}
        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p>
            Rate alerts help you monitor exchange rates and get notified when they reach your target levels. 
            You can set multiple alerts for different currency pairs and conditions.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
