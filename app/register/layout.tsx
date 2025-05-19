import type React from "react"
import { AuthProvider } from "@/components/auth/auth-provider"

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider>{children}</AuthProvider>
}
