"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser, isAuthenticated, type Usuario } from "@/lib/auth"

interface AuthContextType {
  user: Usuario | null
  isLoggedIn: boolean
  loading: boolean
  refreshAuthState: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  loading: true,
  refreshAuthState: () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = useCallback(() => {
    try {
      const loggedIn = isAuthenticated()
      if (loggedIn) {
        const currentUser = getCurrentUser()
        setUser(currentUser)
      } else {
        setUser(null)

        // Redirigir a login si está en una ruta protegida
        const protectedRoutes = ["/temario", "/chatbot", "/foros"]
        if (protectedRoutes.some((route) => pathname?.startsWith(route))) {
          router.push("/login")
        }
      }
    } catch (error) {
      console.error("Error al verificar autenticación:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [pathname, router])

  // Función para refrescar el estado de autenticación manualmente
  const refreshAuthState = useCallback(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    checkAuth()

    // Escuchar cambios en localStorage (para manejar logout en otras pestañas)
    const handleStorageChange = () => {
      checkAuth()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [checkAuth])

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, loading, refreshAuthState }}>
      {children}
    </AuthContext.Provider>
  )
}
