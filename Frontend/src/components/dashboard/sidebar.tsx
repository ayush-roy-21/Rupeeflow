"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  Home, 
  Send, 
  History, 
  Wallet, 
  User, 
  Settings, 
  Menu,
  TrendingUp,
  Shield,
  FileText,
  HelpCircle,
  LogOut
} from "lucide-react"

const sidebarNavItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Send Money",
    href: "/dashboard/send",
    icon: Send,
  },
  {
    title: "Transfer History",
    href: "/dashboard/history",
    icon: History,
  },
  {
    title: "Wallet",
    href: "/dashboard/wallet",
    icon: Wallet,
  },
  {
    title: "KYC & Compliance",
    href: "/dashboard/kyc",
    icon: Shield,
  },
  {
    title: "Exchange Rates",
    href: "/dashboard/rates",
    icon: TrendingUp,
  },
  {
    title: "Documents",
    href: "/dashboard/documents",
    icon: FileText,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Help & Support",
    href: "/dashboard/support",
    icon: HelpCircle,
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 md:hidden"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pl-1 pr-0">
          <MobileNav />
        </SheetContent>
      </Sheet>
      <div className={cn("hidden md:flex", className)}>
        <DesktopNav />
      </div>
    </>
  )
}

function DesktopNav() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary"></div>
          <span className="font-bold text-xl">RupeeFlow</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {sidebarNavItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="grid items-start gap-2">
      {sidebarNavItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}
