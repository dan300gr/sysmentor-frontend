import type React from "react"
import { Toaster } from "@/components/ui/toaster"
import { ChatProvider } from "@/components/layout/chat-provider"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SysMentor - Plataforma Académica para Ingeniería en Sistemas",
  description:
    "Plataforma académica inteligente para estudiantes de Ingeniería en Sistemas y Tecnologías de la Información",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <ChatProvider>{children}</ChatProvider>
        <Toaster />
      </body>
    </html>
  )
}
