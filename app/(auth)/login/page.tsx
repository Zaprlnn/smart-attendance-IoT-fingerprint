import { BrandPanel } from "@/components/login/brand-panel"
import { LoginForm } from "@/components/login/login-form"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />

      <div className="relative flex flex-1 items-center justify-center bg-background px-6 py-10">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
