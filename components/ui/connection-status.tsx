"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConnectionStatusProps {
  className?: string
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [visible, setVisible] = useState<boolean>(false)
  const [statusChanged, setStatusChanged] = useState<boolean>(false)

  useEffect(() => {
    // Función para actualizar el estado de conexión
    const updateOnlineStatus = () => {
      const online = navigator.onLine
      if (online !== isOnline) {
        setIsOnline(online)
        setVisible(true)
        setStatusChanged(true)

        // Ocultar después de 5 segundos
        setTimeout(() => {
          setVisible(false)
        }, 5000)
      }
    }

    // Verificar el estado inicial
    setIsOnline(navigator.onLine)

    // Añadir event listeners para cambios en la conexión
    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    // Limpiar event listeners
    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [isOnline])

  // No mostrar nada si nunca ha cambiado el estado
  if (!statusChanged) return null

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 transition-all duration-300 transform",
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg",
          isOnline ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="h-5 w-5" />
            <span>Conexión restablecida</span>
          </>
        ) : (
          <>
            <WifiOff className="h-5 w-5" />
            <span>Sin conexión a internet</span>
          </>
        )}
      </div>
    </div>
  )
}
