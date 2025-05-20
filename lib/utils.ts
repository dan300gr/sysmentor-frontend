import type React from "react"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para verificar si hay conexión a internet
export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine
}

// Función para guardar datos en caché con tiempo de expiración
export function saveToCache<T>(key: string, data: T, expirationMinutes = 60): void {
  try {
    const item = {
      data,
      expiry: new Date().getTime() + expirationMinutes * 60 * 1000,
    }
    localStorage.setItem(key, JSON.stringify(item))
  } catch (error) {
    console.error("Error saving to cache:", error)
  }
}

// Función para obtener datos de la caché
export function getFromCache<T>(key: string): T | null {
  try {
    const itemStr = localStorage.getItem(key)
    if (!itemStr) return null

    const item = JSON.parse(itemStr)
    const now = new Date().getTime()

    // Verificar si el item ha expirado
    if (now > item.expiry) {
      localStorage.removeItem(key)
      return null
    }

    return item.data as T
  } catch (error) {
    console.error("Error getting from cache:", error)
    return null
  }
}

// Función para iniciar la comprobación periódica de conexión
let connectionCheckInterval: NodeJS.Timeout | null = null

export function startConnectionCheck(intervalMs = 30000): void {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval)
  }

  // Realizar una comprobación inicial
  checkConnection()

  // Configurar comprobaciones periódicas
  connectionCheckInterval = setInterval(checkConnection, intervalMs)
}

// Función para detener la comprobación periódica
export function stopConnectionCheck(): void {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval)
    connectionCheckInterval = null
  }
}

// Función para comprobar la conexión
function checkConnection(): void {
  if (!isOnline()) {
    console.log("Sin conexión a internet")
    return
  }

  // Realizar una petición simple para verificar la conexión real
  fetch("/api/ping", {
    method: "HEAD",
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  })
    .then(() => {
      console.log("Conexión verificada")
      // Aquí se podría disparar un evento o actualizar un estado global
    })
    .catch((error) => {
      console.error("Error al verificar conexión:", error)
      // Aquí se podría disparar un evento o actualizar un estado global
    })
}

// Función para simular el efecto de escritura progresiva
export function simulateTyping<T>(
  text: string,
  messageId: string,
  setMessages: React.Dispatch<React.SetStateAction<T[]>>,
  formatText?: (text: string) => Partial<T>,
) {
  let currentIndex = 0
  // Aumentar el intervalo: más tiempo entre iteraciones
  const typingInterval = 40

  // Función para calcular la velocidad de escritura con variación natural
  const getTypingDelay = () => {
    // Añadir variación aleatoria para que parezca más natural
    // Más lento en puntuaciones y más rápido en texto normal
    const currentChar = text[currentIndex] || ""
    const isPunctuation = [".", ",", "!", "?", ";", ":"].includes(currentChar)

    // Pausa más larga después de puntuación
    if (isPunctuation && currentIndex > 0) {
      return typingInterval + Math.random() * 150
    }

    // Variación normal para el resto del texto
    return typingInterval + Math.random() * 30
  }

  const typeNextChunk = () => {
    if (currentIndex < text.length) {
      // Añadir entre 1-3 caracteres por vez para una escritura más natural
      const charsToAdd = Math.max(1, Math.floor(Math.random() * 3))
      const nextIndex = Math.min(currentIndex + charsToAdd, text.length)
      const currentText = text.substring(0, nextIndex)

      setMessages((prevMessages) =>
        prevMessages.map((msg) => {
          if ((msg as unknown as { id: string }).id === messageId) {
            if (formatText) {
              return { ...msg, ...formatText(currentText) }
            }
            return { ...msg, displayContent: currentText } as T
          }
          return msg
        }),
      )

      currentIndex = nextIndex
      // Usar un delay variable para una escritura más natural
      setTimeout(typeNextChunk, getTypingDelay())
    }
  }

  typeNextChunk()
}
