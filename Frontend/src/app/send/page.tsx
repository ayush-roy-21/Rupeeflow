import { Header } from "@/components/common/header"
import { Footer } from "@/components/common/footer"
import { TransferForm } from "@/components/transfer/transfer-form"

export default function SendMoneyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl lg:text-4xl font-serif font-black text-foreground mb-4">Send Money to Russia</h1>
              <p className="text-lg text-muted-foreground">Fast, secure, and transparent international transfers</p>
            </div>
            <TransferForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
