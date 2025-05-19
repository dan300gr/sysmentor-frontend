import type React from "react"
import { AuthProvider } from "@/components/auth/auth-provider"

export default function MateriaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider>{children}</AuthProvider>
}
