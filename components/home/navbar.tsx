"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, LogOut, Wand2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("Usuario")
  const router = useRouter()
  const { toast } = useToast()

  // Verificar estado de autenticación al cargar el componente y cuando cambia localStorage
  useEffect(() => {
    checkAuthStatus()

    // Escuchar cambios en localStorage
    window.addEventListener("storage", checkAuthStatus)

    return () => {
      window.removeEventListener("storage", checkAuthStatus)
    }
  }, [])

  // Función para verificar el estado de autenticación
  const checkAuthStatus = () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      const userStr = localStorage.getItem("user")

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          setIsLoggedIn(true)
          setUserName(user.nombre || "Usuario")
          console.log("Usuario autenticado:", user.nombre)
        } catch (error) {
          console.error("Error al parsear usuario:", error)
          setIsLoggedIn(false)
        }
      } else {
        setIsLoggedIn(false)
      }
    }
  }

  const handleLogout = () => {
    // Eliminar token y datos de usuario
    localStorage.removeItem("token")
    localStorage.removeItem("user")

    // Actualizar estado
    setIsLoggedIn(false)

    // Mostrar notificación
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente",
    })

    // Redireccionar a la página principal
    router.push("/")
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">SysMentor</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Inicio
            </Link>
            <Link href="/temario" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Temario
            </Link>
            <Link
              href="/chatbot"
              className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium flex items-center"
            >
              <Wand2 className="h-4 w-4 mr-1" />
              Generador IA
            </Link>
            <Link href="/foros" className="text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Foros
            </Link>
          </nav>

          {/* Login/Register Button or User Menu (Desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">Bienvenido, {userName}</span>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </Button>
              </div>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Registrarse</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Abrir menú principal</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Inicio
            </Link>
            <Link
              href="/temario"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Temario
            </Link>
            <Link
              href="/chatbot"
              className="px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Generador IA
            </Link>
            <Link
              href="/foros"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Foros
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {isLoggedIn ? (
              <div className="px-5 space-y-3">
                <div className="flex items-center">
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{userName}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleLogout()
                    setIsMenuOpen(false)
                  }}
                  className="flex w-full items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            ) : (
              <div className="px-5 space-y-3">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    Iniciar Sesión
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                    Registrarse
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
