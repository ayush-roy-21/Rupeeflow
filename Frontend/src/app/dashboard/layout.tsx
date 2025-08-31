import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ThemeProvider } from "@/components/theme-provider"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-muted/20 px-4 py-6 md:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </ThemeProvider>
    </div>
  )
}
