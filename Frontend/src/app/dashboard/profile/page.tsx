import { ProfileForm } from "@/components/dashboard/profile-form"
import { ProfileOverview } from "@/components/dashboard/profile-overview"
import { SecuritySettings } from "@/components/dashboard/security-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information and security settings
        </p>
      </div>

      <div className="grid gap-6">
        <ProfileOverview />
        
        <div className="grid gap-6 lg:grid-cols-2">
          <ProfileForm />
          <SecuritySettings />
        </div>
      </div>
    </div>
  )
}
