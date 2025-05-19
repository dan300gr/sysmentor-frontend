import type React from "react"
import { AuthProvider } from "@/components/auth/auth-provider"

export default function ChatbotLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider>{children}</AuthProvider>
}
