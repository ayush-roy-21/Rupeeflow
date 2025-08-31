"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Wallet, User, LogOut, AlertCircle } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWallet } from "@/contexts/WalletContext"

export function Header() {
  const { 
    isConnected, 
    account, 
    connect, 
    disconnect, 
    isLoading, 
    error 
  } = useWallet()

  const connectWallet = async () => {
    await connect()
  }

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Send Money", href: "/send" },
    { name: "Track Transfer", href: "/track" },
    { name: "Rates", href: "/rates" },
    { name: "Support", href: "/support" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">₹</span>
          </div>
          <span className="font-serif font-black text-xl text-foreground">RupeeFlow</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />

          {error && (
            <Alert className="w-auto border-destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {!isConnected ? (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button 
                size="sm" 
                onClick={connectWallet}
                disabled={isLoading}
              >
                <Wallet className="mr-2 h-4 w-4" />
                {isLoading ? "Connecting..." : "Connect Wallet"}
              </Button>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Wallet className="mr-2 h-4 w-4" />
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : "Connected"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={disconnect}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col space-y-4 mt-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t">
                {!isConnected ? (
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={connectWallet}
                      disabled={isLoading}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      {isLoading ? "Connecting..." : "Connect Wallet"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={disconnect}>
                      Disconnect
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
