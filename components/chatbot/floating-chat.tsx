"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  X,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
  BrainCircuit,
  MessageSquare,
  Plus,
  Trash2,
  LogIn,
  WifiOff,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { getCurrentUser, isAuthenticated } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"
import { sendChatbotMessage } from "@/lib/chatbot"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { simulateTyping, isOnline, startConnectionCheck, stopConnectionCheck } from "@/lib/utils"
import { markdownToHtml, sanitizeHtml } from "@/lib/markdown"

// Actualizar las interfaces para manejar múltiples sesiones
interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isLoading?: boolean
  displayContent?: string
  formattedContent?: string // Para almacenar el contenido con formato HTML
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
  lastUpdated: Date
}

// Componente para mostrar los puntos de "pensando"
const ThinkingDots = () => (
  <div className="flex justify-start mb-2">
    <div className="bg-blue-50 rounded-lg p-3 rounded-bl-none shadow-sm border border-blue-100 flex items-center">
      <div className="flex space-x-1">
        <motion.div
          className="w-2 h-2 rounded-full bg-blue-400"
          animate={{ opacity: [0.4, 1, 0.4], y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-blue-500"
          animate={{ opacity: [0.4, 1, 0.4], y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-blue-600"
          animate={{ opacity: [0.4, 1, 0.4], y: [0, -3, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.4 }}
        />
      </div>
    </div>
  </div>
)

// Componente para mostrar el estado de la conexión
const ConnectionStatus = () => {
  const [online, setOnline] = useState(isOnline())
  const [visible, setVisible] = useState(false)
  const [pendingMessages, setPendingMessages] = useState(0)

  useEffect(() => {
    const handleStatusChange = () => {
      const isConnected = isOnline()
      setOnline(isConnected)

      // Mostrar el indicador cuando cambia el estado
      setVisible(true)

      // Ocultar después de 5 segundos
      setTimeout(() => {
        setVisible(false)
      }, 5000)
    }

    // Verificar el número de mensajes pendientes
    const checkPendingMessages = () => {
      try {
        const queue = localStorage.getItem("messageQueue")
        if (queue) {
          const parsedQueue = JSON.parse(queue)
          setPendingMessages(Array.isArray(parsedQueue) ? parsedQueue.length : 0)
        } else {
          setPendingMessages(0)
        }
      } catch (error) {
        console.error("Error checking pending messages:", error)
        setPendingMessages(0)
      }
    }

    window.addEventListener("online", handleStatusChange)
    window.addEventListener("offline", handleStatusChange)

    // Verificar mensajes pendientes cada 5 segundos
    const interval = setInterval(checkPendingMessages, 5000)

    // Verificar inicialmente
    checkPendingMessages()

    return () => {
      window.removeEventListener("online", handleStatusChange)
      window.removeEventListener("offline", handleStatusChange)
      clearInterval(interval)
    }
  }, [])

  if (!visible && pendingMessages === 0) return null

  return (
    <motion.div
      className="fixed top-4 right-4 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-lg shadow-lg p-3 flex items-center space-x-2 border border-gray-200">
        {online ? (
          <Badge className="bg-green-500 text-white border-0">Conectado</Badge>
        ) : (
          <Badge className="bg-red-500 text-white border-0 flex items-center">
            <WifiOff className="h-3 w-3 mr-1" />
            Sin conexión
          </Badge>
        )}

        {pendingMessages > 0 && (
          <Badge className="bg-amber-500 text-white border-0">
            {pendingMessages} mensaje{pendingMessages !== 1 ? "s" : ""} pendiente{pendingMessages !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>
    </motion.div>
  )
}

// Componente para renderizar HTML de manera segura
const SafeHTML = ({ html }: { html: string }) => {
  return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} className="prose prose-sm max-w-none" />
}

export default function FloatingChat({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string>("")
  const [showSessions, setShowSessions] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [offlineMode, setOfflineMode] = useState(false)

  // Añadir un nuevo estado para controlar si el usuario está autenticado
  const [userAuthenticated, setUserAuthenticated] = useState<boolean>(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false)
  const router = useRouter()

  // Detectar si es un dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Añadir un efecto para verificar la autenticación del usuario
  useEffect(() => {
    const checkAuthentication = () => {
      const authenticated = isAuthenticated()
      setUserAuthenticated(authenticated)

      // Si el usuario acaba de autenticarse y tenía sesiones anónimas, limpiarlas
      if (authenticated && !userAuthenticated) {
        // Limpiar sesiones anónimas del localStorage
        localStorage.removeItem("chatSessions")
        // Cargar las conversaciones del usuario autenticado
        loadUserConversations()
      }
    }

    checkAuthentication()

    // Escuchar cambios en el localStorage (para detectar login/logout)
    window.addEventListener("storage", checkAuthentication)
    return () => window.removeEventListener("storage", checkAuthentication)
  }, [userAuthenticated])

  // Reemplazar el efecto de carga de sesiones para manejar usuarios autenticados vs anónimos
  useEffect(() => {
    if (!currentSessionId) {
      createNewSession()
    }

    // Si el usuario está autenticado, cargar sus conversaciones desde el backend
    if (userAuthenticated) {
      loadUserConversations()
    } else {
      // Para usuarios anónimos, cargar desde localStorage
      const savedSessions = localStorage.getItem("chatSessions")
      if (savedSessions) {
        try {
          const parsedSessions = JSON.parse(savedSessions)
          // Convertir las fechas de string a Date
          const sessionsWithDates = parsedSessions.map((session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            lastUpdated: new Date(session.lastUpdated),
            messages: session.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }))
          setSessions(sessionsWithDates)
        } catch (error) {
          console.error("Error loading saved sessions:", error)
        }
      }
    }
  }, [currentSessionId, userAuthenticated])

  // Modificar el efecto de guardado de sesiones para solo guardar en localStorage si es anónimo
  useEffect(() => {
    if (sessions.length > 0 && !userAuthenticated) {
      localStorage.setItem("chatSessions", JSON.stringify(sessions))
    }
  }, [sessions, userAuthenticated])

  // Añadir efecto para desplazarse al final de los mensajes cuando se añaden nuevos
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Modificar la función loadUserConversations para manejar mejor los errores de red
  const loadUserConversations = useCallback(async () => {
    // No intentar cargar conversaciones del servidor
    console.log("Carga de conversaciones desactivada")

    // Crear una nueva sesión si no hay ninguna
    if (sessions.length === 0) {
      createNewSession()
    }

    return
  }, [sessions.length])

  // Modificar la función loadSessionMessages para manejar mejor los errores de red
  const loadSessionMessages = async (sessionId: string) => {
    if (!userAuthenticated) {
      // Para usuarios anónimos, cargar desde el estado local
      const session = sessions.find((s) => s.id === sessionId)
      if (session) {
        setCurrentSessionId(sessionId)
        setMessages(session.messages)
        setShowSessions(false)
      }
      return
    }

    // Para usuarios autenticados, simplemente cambiar a la sesión sin cargar mensajes
    setCurrentSessionId(sessionId)
    setMessages([]) // Iniciar con mensajes vacíos
    setShowSessions(false)
  }

  // Crear una nueva sesión
  const createNewSession = () => {
    const newSessionId = uuidv4()
    setCurrentSessionId(newSessionId)
    setMessages([])

    // Crear nueva sesión en el estado
    const newSession: ChatSession = {
      id: newSessionId,
      title: `Chat ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: new Date(),
      lastUpdated: new Date(),
    }

    setSessions((prev) => [newSession, ...prev])
    setShowSessions(false)
  }

  // Cambiar a una sesión existente
  const switchToSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId)
    if (session) {
      setCurrentSessionId(sessionId)
      setMessages(session.messages)
      setShowSessions(false)
    }
  }

  // Modificar la función sendMessage para manejar usuarios autenticados vs anónimos
  const sendMessage = async () => {
    if (!message.trim()) return

    const user = getCurrentUser()
    const messageId = `msg-${Date.now()}`

    // Añadir mensaje del usuario
    const userMessage: ChatMessage = {
      id: messageId,
      role: "user",
      content: message,
      displayContent: message,
      timestamp: new Date(),
    }

    // Actualizar mensajes con el mensaje del usuario
    setMessages((prev) => [...prev, userMessage])

    // Limpiar el campo de entrada
    setMessage("")

    // Para usuarios anónimos, actualizar la sesión en el estado local
    if (!userAuthenticated) {
      updateSessionMessages([...messages, userMessage])
    }

    // Mostrar indicador de "pensando"
    setIsThinking(true)
    setIsConnecting(true)

    try {
      // Enviar mensaje al backend
      const response = await sendChatbotMessage(message, currentSessionId, userAuthenticated ? user?.matricula : null)

      // Ocultar indicador de "pensando"
      setIsThinking(false)

      // Crear mensaje del asistente con contenido vacío inicialmente
      const assistantMessageId = `resp-${Date.now()}`
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: response.respuesta,
        displayContent: "", // Inicialmente vacío para el efecto de escritura
        formattedContent: markdownToHtml(response.respuesta), // Convertir markdown a HTML
        timestamp: new Date(),
      }

      // Añadir mensaje vacío del asistente
      setMessages((prev) => [...prev, assistantMessage])

      // Para usuarios anónimos, actualizar la sesión en el estado local
      if (!userAuthenticated) {
        const updatedMessages = [...messages, userMessage, assistantMessage]
        updateSessionMessages(updatedMessages)
      }

      // Iniciar efecto de escritura progresiva con la nueva función
      simulateTyping(response.respuesta, assistantMessageId, setMessages, (text) => {
        return {
          displayContent: text,
          formattedContent: markdownToHtml(text),
        }
      })

      // Actualizar el título de la sesión basado en el primer mensaje
      if (messages.length === 0) {
        updateSessionTitle(currentSessionId, message.substring(0, 30) + (message.length > 30 ? "..." : ""))
      }

      // Si el usuario está autenticado, recargar las conversaciones para actualizar la lista
      if (userAuthenticated && !offlineMode) {
        setTimeout(() => {
          loadUserConversations()
        }, 1000)
      }
    } catch (error) {
      console.error("Error al enviar mensaje:", error)
      setIsThinking(false)

      // Añadir mensaje de error
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          error instanceof Error && error.message === "Sin conexión a internet"
            ? "Parece que no tienes conexión a internet. Por favor, verifica tu conexión e intenta de nuevo."
            : "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.",
        displayContent:
          error instanceof Error && error.message === "Sin conexión a internet"
            ? "Parece que no tienes conexión a internet. Por favor, verifica tu conexión e intenta de nuevo."
            : "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.",
        timestamp: new Date(),
      }

      const finalMessages = [...messages, userMessage, errorMessage]
      setMessages(finalMessages)

      // Para usuarios anónimos, actualizar la sesión en el estado local
      if (!userAuthenticated) {
        updateSessionMessages(finalMessages)
      }

      toast({
        variant: "destructive",
        title: "Error de conexión",
        description:
          error instanceof Error && error.message === "Sin conexión a internet"
            ? "No hay conexión a internet. Por favor, verifica tu conexión."
            : "No se pudo conectar con el servicio de chatbot. Por favor, intenta de nuevo más tarde.",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  // Eliminar una sesión
  const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que se active el clic en la sesión

    if (userAuthenticated) {
      // Para usuarios autenticados, implementar la eliminación en el backend
      // Nota: Esto requeriría un endpoint adicional en el backend
      toast({
        title: "Funcionalidad no disponible",
        description: "La eliminación de conversaciones no está disponible en este momento.",
      })
      return
    }

    // Para usuarios anónimos, eliminar del estado local
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))

    // Si la sesión actual es la que se está eliminando, crear una nueva
    if (currentSessionId === sessionId) {
      createNewSession()
    }

    toast({
      title: "Sesión eliminada",
      description: "La conversación ha sido eliminada correctamente.",
    })
  }

  // Actualizar los mensajes de una sesión
  const updateSessionMessages = (newMessages: ChatMessage[]) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === currentSessionId) {
          return {
            ...session,
            messages: newMessages,
            lastUpdated: new Date(),
          }
        }
        return session
      }),
    )
  }

  // Actualizar el título de una sesión
  const updateSessionTitle = (sessionId: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === sessionId) {
          return {
            ...session,
            title: newTitle,
          }
        }
        return session
      }),
    )
  }

  // Manejar envío con Enter (pero permitir nueva línea con Shift+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Formatear fecha
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Formatear fecha para la lista de sesiones
  const formatSessionDate = (date: Date) => {
    return date.toLocaleDateString([], { day: "numeric", month: "short" })
  }

  // Añadir un botón para iniciar sesión si el usuario no está autenticado
  const renderLoginButton = () => {
    if (userAuthenticated) return null

    return (
      <div className="mt-2 text-center">
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
          onClick={() => router.push("/login")}
        >
          <LogIn className="h-3 w-3 mr-1" />
          Iniciar sesión para guardar conversaciones
        </Button>
      </div>
    )
  }

  // Botón flotante para abrir el chat
  const renderFloatingButton = () => (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        onClick={() => {
          setIsOpen(!isOpen)
          setIsMinimized(false)
        }}
        className={`rounded-full w-14 h-14 p-0 shadow-lg ${
          isOpen
            ? "bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
            : "bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        }`}
      >
        <motion.div animate={isOpen ? { rotate: 180 } : { rotate: 0 }} transition={{ duration: 0.3 }}>
          {isOpen ? <X className="h-6 w-6" /> : <BrainCircuit className="h-6 w-6" />}
        </motion.div>
      </Button>
    </motion.div>
  )

  // Ventana de chat
  const renderChatWindow = () => {
    if (!isOpen) return null

    // Ajustar tamaño según el dispositivo
    const chatStyle = {
      height: isMinimized ? "auto" : isMobile ? "80vh" : "min(500px, 80vh)",
      width: isMobile ? "90vw" : "min(420px, 95vw)",
      bottom: isMobile ? "70px" : "24px",
      right: isMobile ? "5vw" : "24px",
      maxWidth: "95vw",
      maxHeight: isMobile ? "80vh" : "80vh",
    }

    return (
      <>
        {/* Añadir indicador de estado de conexión */}
        <ConnectionStatus />

        <motion.div
          className="fixed z-50 flex flex-col bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-200"
          style={chatStyle}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          {/* Encabezado */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-3 flex justify-between items-center">
            <div className="flex items-center">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
                className="mr-2"
              >
                <BrainCircuit className="h-5 w-5" />
              </motion.div>
              <h3 className="font-medium">SysMentor AI</h3>
              <Badge className="ml-2 bg-white/20 text-white border-0 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                24/7
              </Badge>

              {/* Indicador de modo offline */}
              {offlineMode && (
                <Badge className="ml-2 bg-amber-500/80 text-white border-0 text-xs flex items-center">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Modo offline
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-white hover:bg-white/20"
                onClick={() => setShowSessions(!showSessions)}
                title="Ver conversaciones"
              >
                {showSessions ? <X className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-white hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Lista de sesiones */}
              {showSessions && (
                <div className="bg-gray-50 border-b border-gray-200 p-3 max-h-60 overflow-y-auto">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Conversaciones</h4>
                    <Button size="sm" className="h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={createNewSession}>
                      <Plus className="h-3 w-3 mr-1" />
                      Nuevo chat
                    </Button>
                  </div>

                  {isLoadingConversations ? (
                    <div className="flex justify-center items-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                      <span className="text-sm text-gray-500">Cargando conversaciones...</span>
                    </div>
                  ) : sessions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">No hay conversaciones guardadas</p>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <motion.div
                          key={session.id}
                          className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${
                            session.id === currentSessionId ? "bg-blue-100" : "hover:bg-gray-100"
                          }`}
                          onClick={() => loadSessionMessages(session.id)}
                          whileHover={{
                            x: 3,
                            backgroundColor: session.id === currentSessionId ? "#dbeafe" : "#f3f4f6",
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{session.title}</p>
                            <p className="text-xs text-gray-500">{formatSessionDate(session.lastUpdated)}</p>
                          </div>
                          {!userAuthenticated && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => deleteSession(session.id, e)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Área de mensajes */}
              <div
                className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-gray-50 to-white"
                style={{
                  scrollBehavior: "smooth",
                  overflowX: "hidden",
                  maxHeight: "calc(100% - 120px)",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <motion.div
                      className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full mb-3"
                      animate={{
                        boxShadow: [
                          "0 0 0 0 rgba(59, 130, 246, 0)",
                          "0 0 0 10px rgba(59, 130, 246, 0.1)",
                          "0 0 0 20px rgba(59, 130, 246, 0)",
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "loop",
                      }}
                    >
                      <BrainCircuit className="h-8 w-8 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">¡Hola! Soy SysMentor AI</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Estoy aquí para ayudarte con tus dudas sobre Ingeniería en Sistemas. ¿En qué puedo asistirte hoy?
                    </p>
                    <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                      {[
                        "¿Qué es la programación orientada a objetos?",
                        "Explica el concepto de bases de datos",
                        "¿Cómo funciona una red de computadoras?",
                      ].map((suggestion, index) => (
                        <motion.div key={index} whileHover={{ scale: 1.03, x: 5 }} whileTap={{ scale: 0.97 }}>
                          <Button
                            variant="outline"
                            className="text-xs justify-start h-auto py-2 px-3 text-left w-full bg-gradient-to-r from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 border-blue-200"
                            onClick={() => {
                              setMessage(suggestion)
                              if (textareaRef.current) {
                                textareaRef.current.focus()
                              }
                            }}
                          >
                            {suggestion}
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <AnimatePresence>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div
                            className={`max-w-[85%] rounded-lg p-3 ${
                              msg.role === "user"
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-md"
                                : "bg-white border border-gray-200 rounded-bl-none shadow-sm"
                            }`}
                            style={{
                              wordBreak: "break-word",
                              overflowWrap: "break-word",
                              width: "100%",
                            }}
                          >
                            <>
                              {msg.role === "assistant" ? (
                                <div
                                  className="whitespace-pre-wrap break-words text-sm"
                                  style={{
                                    width: "100%",
                                    maxWidth: "100%",
                                    overflow: "visible",
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                  }}
                                >
                                  {/* Renderizar HTML formateado si está disponible */}
                                  {msg.formattedContent ? (
                                    <SafeHTML html={msg.formattedContent} />
                                  ) : (
                                    msg.displayContent || ""
                                  )}

                                  {msg.displayContent !== msg.content && (
                                    <motion.span
                                      className="inline-block w-1 h-4 bg-blue-500 ml-0.5"
                                      animate={{ opacity: [0, 1, 0] }}
                                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8 }}
                                    />
                                  )}
                                </div>
                              ) : (
                                <div className="text-sm whitespace-pre-wrap break-words">{msg.content}</div>
                              )}
                              <div
                                className={`text-xs mt-1 text-right ${
                                  msg.role === "user" ? "text-blue-200" : "text-gray-400"
                                }`}
                              >
                                {formatTimestamp(msg.timestamp)}
                              </div>
                            </>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Indicador de "pensando" */}
                    <AnimatePresence>
                      {isThinking && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ThinkingDots />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Área de entrada de mensaje */}
              <div className="p-3 bg-white border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 border-blue-200 text-blue-600 hover:bg-blue-50"
                      onClick={createNewSession}
                      title="Nueva conversación"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </motion.div>
                  <div className="relative flex-1">
                    <Textarea
                      ref={textareaRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Escribe tu mensaje..."
                      className="resize-none pr-10 py-2 min-h-[40px] max-h-[120px] border-blue-200 focus-visible:ring-blue-500 rounded-xl"
                    />
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        size="sm"
                        className="absolute right-2 bottom-1 h-7 w-7 p-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg"
                        onClick={sendMessage}
                        disabled={!message.trim() || isConnecting}
                      >
                        {isConnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                      </Button>
                    </motion.div>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className="text-xs text-gray-400">
                    Desarrollado con <span className="text-red-400">♥</span> por SysMentor
                  </span>
                </div>
                {renderLoginButton()}
              </div>
            </>
          )}
        </motion.div>
      </>
    )
  }

  // Añadir efecto para iniciar y detener la comprobación de conexión
  useEffect(() => {
    // Iniciar la comprobación de conexión cuando se monta el componente
    startConnectionCheck()

    // Detener la comprobación cuando se desmonta
    return () => {
      stopConnectionCheck()
    }
  }, [])

  // Function to retry loading conversations
  const retryLoadingConversations = () => {
    console.log("Retry loading conversations")
    loadUserConversations()
  }

  return (
    <>
      {renderFloatingButton()}
      {renderChatWindow()}
    </>
  )
}
