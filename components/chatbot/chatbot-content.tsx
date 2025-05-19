"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, MessageSquare, RefreshCw, Clock, Zap, BrainCircuit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { isAuthenticated, getCurrentUser } from "@/lib/auth"
import { motion, AnimatePresence } from "framer-motion"
import { v4 as uuidv4 } from "uuid"
import { sendChatbotMessage, getUserConversations, getConversationMessages } from "@/lib/chatbot"

// Interfaces para los tipos de datos
interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isLoading?: boolean
  // Para el efecto de streaming
  displayContent?: string
}

interface ChatSession {
  id: string
  title: string
  lastMessage: string
  timestamp: Date
}

export default function ChatbotContent() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessionId, setSessionId] = useState<string>("")
  const [isTyping, setIsTyping] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeTab, setActiveTab] = useState("chat")
  const [loading, setLoading] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    if (!isAuthenticated()) {
      toast({
        variant: "destructive",
        title: "Acceso restringido",
        description: "Debes iniciar sesión para acceder al chatbot.",
      })
      router.push("/login")
      return
    }

    // Generar un nuevo sessionId si no existe
    if (!sessionId) {
      setSessionId(uuidv4())
    }

    // Cargar sesiones previas
    loadSessions()
  }, [router, toast, sessionId])

  // Efecto para hacer scroll al último mensaje
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Efecto para ajustar altura del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [message])

  // Efecto para simular el streaming de texto
  useEffect(() => {
    const simulateTextStreaming = () => {
      setMessages((prevMessages) => {
        return prevMessages.map((msg) => {
          if (msg.role === "assistant" && msg.content && msg.displayContent !== msg.content) {
            // Si el mensaje es del asistente y aún no se ha mostrado completamente
            const currentLength = msg.displayContent?.length || 0
            const targetLength = msg.content.length

            if (currentLength < targetLength) {
              // Reducir la velocidad: usar 20 en lugar de 10 para una escritura más lenta
              // y añadir una pequeña variación aleatoria para que parezca más natural
              const divisor = 20 + Math.floor(Math.random() * 5)
              const charsToAdd = Math.max(1, Math.floor((targetLength - currentLength) / divisor))
              const newLength = Math.min(currentLength + charsToAdd, targetLength)

              return {
                ...msg,
                displayContent: msg.content.substring(0, newLength),
              }
            }
          }
          return msg
        })
      })
    }

    // Aumentar el intervalo de 30ms a 50ms para una escritura más lenta
    const interval = setInterval(simulateTextStreaming, 50)
    return () => clearInterval(interval)
  }, [messages])

  // Función para cargar sesiones previas
  const loadSessions = async () => {
    try {
      setLoading(true)
      const user = getCurrentUser()
      if (user) {
        const sessionsData = await getUserConversations(user.matricula)

        if (sessionsData && Array.isArray(sessionsData)) {
          const formattedSessions = sessionsData.map((session: any) => ({
            id: session.session_id,
            title: session.titulo || "Conversación sin título",
            lastMessage: session.resumen || "Sin mensajes",
            timestamp: new Date(session.fecha_ultima_actividad),
          }))
          setSessions(formattedSessions)
        }
      }
    } catch (error) {
      console.error("Error al cargar sesiones:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar las conversaciones previas.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para cargar mensajes de una sesión
  const loadSessionMessages = async (sessionId: string) => {
    try {
      setLoading(true)
      const response = await getConversationMessages(sessionId)

      if (response && response.mensajes) {
        const loadedMessages = response.mensajes.map((msg: any) => ({
          id: `msg-${msg.id}`,
          role: msg.matricula ? ("user" as const) : ("assistant" as const),
          content: msg.matricula ? msg.mensaje : msg.respuesta,
          displayContent: msg.matricula ? msg.mensaje : msg.respuesta, // Para mensajes cargados, mostrar todo de inmediato
          timestamp: new Date(msg.fecha),
        }))

        setMessages(loadedMessages)
        setSessionId(sessionId)
        setActiveTab("chat")
      }
    } catch (error) {
      console.error("Error al cargar mensajes de la sesión:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los mensajes de la conversación.",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para enviar un mensaje
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

    setMessages((prev) => [...prev, userMessage])
    setMessage("")

    // Añadir mensaje de carga del asistente
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: "assistant",
      content: "",
      displayContent: "",
      timestamp: new Date(),
      isLoading: true,
    }

    setMessages((prev) => [...prev, loadingMessage])
    setIsConnecting(true)

    try {
      // Mostrar efecto de typing
      setIsTyping(true)

      // Enviar mensaje al backend
      const response = await sendChatbotMessage(message, sessionId, user?.matricula)

      // Eliminar mensaje de carga
      setMessages((prev) => prev.filter((msg) => !msg.isLoading))

      // Añadir respuesta del asistente con efecto de streaming
      const assistantMessage: ChatMessage = {
        id: `resp-${Date.now()}`,
        role: "assistant",
        content: response.respuesta,
        displayContent: "", // Inicialmente vacío para el efecto de streaming
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Actualizar sesiones
      loadSessions()
    } catch (error) {
      console.error("Error al enviar mensaje:", error)

      // Eliminar mensaje de carga
      setMessages((prev) => prev.filter((msg) => !msg.isLoading))

      // Añadir mensaje de error
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.",
        displayContent:
          "Lo siento, ha ocurrido un error al procesar tu mensaje. Por favor, intenta de nuevo más tarde.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])

      toast({
        variant: "destructive",
        title: "Error de conexión",
        description:
          "No se pudo conectar con el servicio de chatbot. Por favor, verifica tu conexión e intenta de nuevo.",
      })
    } finally {
      setIsTyping(false)
      setIsConnecting(false)
    }
  }

  // Manejar envío con Enter (pero permitir nueva línea con Shift+Enter)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Iniciar nueva conversación
  const startNewConversation = () => {
    setSessionId(uuidv4())
    setMessages([])
  }

  // Formatear fecha
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Formatear fecha completa
  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" })
  }

  // Modificar el useEffect para verificación de autenticación:
  useEffect(() => {
    // Generar un nuevo sessionId si no existe
    if (!sessionId) {
      setSessionId(uuidv4())
    }

    // Cargar sesiones previas si el usuario está autenticado
    const user = getCurrentUser()
    if (user) {
      loadSessions()
    }
  }, [router, toast, sessionId])

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel lateral con historial de conversaciones */}
        <div className="lg:col-span-1">
          <Card className="h-full border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-1"></div>
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white">
              <CardTitle className="text-lg flex items-center">
                <motion.div
                  animate={{
                    rotate: [0, 5, 0, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "mirror",
                  }}
                >
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                </motion.div>
                Conversaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[500px] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, 0, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatType: "mirror",
                    }}
                    className="mx-auto mb-3"
                  >
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto" />
                  </motion.div>
                  <p className="text-gray-500">No hay conversaciones previas</p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={startNewConversation}
                      className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Iniciar conversación
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={startNewConversation}
                      className="w-full mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Nueva conversación
                    </Button>
                  </motion.div>

                  {sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      className={`p-3 rounded-lg cursor-pointer border ${
                        session.id === sessionId
                          ? "border-blue-300 bg-blue-50"
                          : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"
                      }`}
                      onClick={() => loadSessionMessages(session.id)}
                      whileHover={{ scale: 1.01, x: 3 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="font-medium text-gray-800">{session.title}</div>
                      <div className="text-sm text-gray-500 truncate mt-1">{session.lastMessage}</div>
                      <div className="text-xs text-gray-400 mt-1">{formatFullDate(session.timestamp)}</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Área principal de chat */}
        <div className="lg:col-span-2">
          <Card className="h-full border-0 shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-1"></div>
            <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <div className="relative">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, 0, -5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Number.POSITIVE_INFINITY,
                        repeatType: "mirror",
                      }}
                    >
                      <BrainCircuit className="h-5 w-5 mr-2 text-blue-600" />
                    </motion.div>
                    <motion.div
                      className="absolute -inset-1 rounded-full bg-blue-400 opacity-20"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.2, 0.1, 0.2],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                    />
                  </div>
                  Asistente SysMentor
                  <Badge className="ml-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                    <Sparkles className="h-3 w-3 mr-1" />
                    IA
                  </Badge>
                </CardTitle>
                <div className="flex space-x-2">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={loadSessions}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Actualizar
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={startNewConversation}>
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Nuevo chat
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="chat" value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-gray-200">
                  <div className="px-4">
                    <TabsList className="h-10">
                      <TabsTrigger value="chat" className="data-[state=active]:bg-blue-50">
                        Chat
                      </TabsTrigger>
                      <TabsTrigger value="info" className="data-[state=active]:bg-blue-50">
                        Información
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>

                <TabsContent value="chat" className="m-0">
                  <div className="h-[400px] overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6">
                        <motion.div
                          className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full mb-4"
                          animate={{
                            boxShadow: [
                              "0 0 0 0 rgba(79, 70, 229, 0.2)",
                              "0 0 0 15px rgba(79, 70, 229, 0)",
                              "0 0 0 0 rgba(79, 70, 229, 0)",
                            ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Number.POSITIVE_INFINITY,
                          }}
                        >
                          <BrainCircuit className="h-10 w-10 text-white" />
                        </motion.div>
                        <h3 className="text-xl font-medium text-gray-800 mb-2">¡Hola! Soy SysMentor AI</h3>
                        <p className="text-gray-600 mb-6">
                          Estoy aquí para ayudarte con tus dudas sobre Ingeniería en Sistemas y Tecnologías de la
                          Información. ¿En qué puedo asistirte hoy?
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-md">
                          {[
                            "¿Qué es la programación orientada a objetos?",
                            "Explica el concepto de bases de datos",
                            "¿Cómo funciona una red de computadoras?",
                            "Ayúdame con algoritmos de ordenamiento",
                          ].map((suggestion, index) => (
                            <motion.div key={index} whileHover={{ scale: 1.03, x: 3 }} whileTap={{ scale: 0.97 }}>
                              <Button
                                variant="outline"
                                className="text-sm justify-start h-auto py-2 px-3 text-left w-full bg-gradient-to-r from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 border-blue-200"
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
                      messages.map((msg) => (
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
                          >
                            {msg.isLoading ? (
                              <div className="flex items-center space-x-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Generando respuesta...</span>
                              </div>
                            ) : (
                              <>
                                <div className="text-sm whitespace-pre-wrap">
                                  {msg.role === "assistant" ? msg.displayContent || "" : msg.content}
                                  {msg.role === "assistant" && msg.displayContent !== msg.content && (
                                    <motion.span
                                      className="inline-block w-1 h-4 bg-blue-500 ml-0.5"
                                      animate={{ opacity: [0, 1, 0] }}
                                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8 }}
                                    />
                                  )}
                                </div>
                                <div
                                  className={`text-xs mt-1 text-right ${
                                    msg.role === "user" ? "text-blue-200" : "text-gray-400"
                                  }`}
                                >
                                  {formatTimestamp(msg.timestamp)}
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                    <div ref={messagesEndRef} />

                    {/* Indicador de "escribiendo" */}
                    <AnimatePresence>
                      {isTyping && (
                        <motion.div
                          className="flex justify-start"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                        >
                          <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-3 rounded-bl-none">
                            <div className="flex space-x-1">
                              <motion.div
                                className="w-2 h-2 rounded-full bg-blue-600"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8, delay: 0 }}
                              />
                              <motion.div
                                className="w-2 h-2 rounded-full bg-indigo-600"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8, delay: 0.2 }}
                              />
                              <motion.div
                                className="w-2 h-2 rounded-full bg-purple-600"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.8, delay: 0.4 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </TabsContent>

                <TabsContent value="info" className="m-0 p-4">
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                      <h3 className="text-lg font-medium text-blue-800 mb-2 flex items-center">
                        <BrainCircuit className="h-5 w-5 mr-2 text-blue-600" />
                        Sobre el Asistente
                      </h3>
                      <p className="text-gray-700">
                        SysMentor AI es un asistente académico especializado en Ingeniería en Sistemas y Tecnologías de
                        la Información. Está diseñado para ayudarte con conceptos, ejercicios y dudas relacionadas con
                        tu carrera.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-md font-medium text-gray-800 mb-2 flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-indigo-600" />
                        Capacidades
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          "Explicación de conceptos técnicos",
                          "Ayuda con ejercicios de programación",
                          "Información sobre tecnologías y herramientas",
                          "Orientación sobre materias y temas del plan de estudios",
                          "Recomendación de recursos adicionales",
                        ].map((capability, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.02, x: 3 }}
                            className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm"
                          >
                            <div className="flex items-start">
                              <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5">
                                <Sparkles className="h-3 w-3 text-blue-600" />
                              </div>
                              <span className="text-sm text-gray-700">{capability}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-md font-medium text-gray-800 mb-2 flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-amber-600" />
                        Limitaciones
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                          "No puede acceder a internet en tiempo real",
                          "Conocimientos limitados a su entrenamiento",
                          "No puede ejecutar código o realizar cálculos complejos",
                          "No sustituye la orientación de profesores",
                        ].map((limitation, index) => (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.02, x: 3 }}
                            className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm"
                          >
                            <div className="flex items-start">
                              <div className="bg-amber-100 p-1 rounded-full mr-2 mt-0.5">
                                <span className="text-amber-600 text-xs font-bold">!</span>
                              </div>
                              <span className="text-sm text-gray-700">{limitation}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="p-3 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center space-x-2 w-full">
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
                      className="absolute right-2 bottom-2 h-8 w-8 p-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg"
                      onClick={sendMessage}
                      disabled={!message.trim() || isConnecting}
                    >
                      {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
