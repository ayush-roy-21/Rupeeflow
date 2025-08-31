"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Users, 
  Shield 
} from "lucide-react"

const metrics = [
  {
    title: "Total Transfers",
    value: "₹2,45,000",
    change: "+12.5%",
    changeType: "positive" as const,
    icon: TrendingUp,
    description: "This month"
  },
  {
    title: "Average Fee",
    value: "1.8%",
    change: "-0.3%",
    changeType: "positive" as const,
    icon: DollarSign,
    description: "vs last month"
  },
  {
    title: "Settlement Time",
    value: "23 min",
    change: "-5 min",
    changeType: "positive" as const,
    icon: Clock,
    description: "Average"
  },
  {
    title: "Active Users",
    value: "1,247",
    change: "+8.2%",
    changeType: "positive" as const,
    icon: Users,
    description: "This month"
  },
  {
    title: "KYC Verified",
    value: "98.5%",
    change: "+1.2%",
    changeType: "positive" as const,
    icon: Shield,
    description: "Compliance rate"
  },
  {
    title: "Success Rate",
    value: "99.7%",
    change: "+0.1%",
    changeType: "positive" as const,
    icon: TrendingUp,
    description: "Transfer success"
  }
]

export function DashboardOverview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={metric.changeType === "positive" ? "default" : "destructive"}
                className="text-xs"
              >
                {metric.change}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
