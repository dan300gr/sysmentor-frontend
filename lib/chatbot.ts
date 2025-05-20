import axios, { type AxiosError } from "axios"
import { getAuthToken } from "@/lib/auth"
import { enqueueMessage, processMessageQueue, type QueueProcessResult } from "@/lib/message-queue"

// Definir la URL base de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-sysmentor.onrender.com"

// Interfaces para las respuestas de la API
export interface ChatbotResponse {
  respuesta: string
  session_id: string
  fecha?: string
}

export interface ConversationResponse {
  mensajes: MessageResponse[]
}

export interface MessageResponse {
  id: number
  matricula?: string
  mensaje?: string
  respuesta?: string
  fecha: string
}

export interface SessionResponse {
  session_id: string
  titulo?: string
  resumen?: string
  fecha_ultima_actividad: string
}

// Interfaz para los mensajes del chatbot
export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

// Interfaz para las sesiones de chat
export interface ChatSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

// Función auxiliar para crear un cliente HTTP para el chatbot
export function createChatbotClient() {
  const token = getAuthToken()

  return axios.create({
    baseURL: API_URL, // Quitar el /api de la baseURL ya que las rutas ya lo incluyen
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // Añadir timeout para evitar esperas largas
    timeout: 30000, // Aumentado de 15000 a 30000 ms (30 segundos)
    // Configuración para manejar errores de red
    validateStatus: (status) => {
      return status >= 200 && status < 500 // Manejar solo errores de cliente
    },
    // Añadir withCredentials para manejar CORS si es necesario
    withCredentials: false, // Cambiar a true si el servidor requiere credenciales
  })
}

// Función para verificar si hay conexión a internet
function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine
}

// Función para generar respuestas offline basadas en el tipo de contenido solicitado
function generateOfflineResponse(message: string, sessionId: string): ChatbotResponse {
  // Detectar si es una solicitud del generador de contenido
  if (
    message.includes("Genera un ejercicio") ||
    message.includes("Crea un cuestionario") ||
    message.includes("Explica detalladamente") ||
    message.includes("Genera una idea de proyecto")
  ) {
    return {
      respuesta:
        "# Modo Offline Activado\n\n" +
        "Actualmente estoy funcionando en modo offline debido a problemas de conexión con el servidor. " +
        "Puedo ofrecerte una versión simplificada del contenido solicitado:\n\n" +
        "## Contenido Generado Localmente\n\n" +
        "Para obtener el contenido completo y personalizado, por favor intenta nuevamente cuando " +
        "la conexión al servidor se restablezca.\n\n" +
        "### Mientras tanto, puedes:\n\n" +
        "- Revisar contenido previamente generado\n" +
        "- Preparar otros temas para generar cuando la conexión se restablezca\n" +
        "- Utilizar el modo de chat normal para preguntas básicas\n\n" +
        "Tu solicitud ha sido guardada y se procesará automáticamente cuando la conexión se restablezca.",
      session_id: sessionId,
      fecha: new Date().toISOString(),
    }
  }

  // Respuesta genérica para mensajes normales
  return {
    respuesta:
      "Estoy funcionando en modo offline debido a problemas de conexión. " +
      "Tu mensaje ha sido guardado y se enviará cuando se restablezca la conexión. " +
      "Mientras tanto, puedo ayudarte con información básica que no requiera conexión al servidor.",
    session_id: sessionId,
    fecha: new Date().toISOString(),
  }
}

// Función para enviar un mensaje al chatbot
export async function sendChatbotMessage(
  message: string,
  sessionId: string,
  matricula?: string | null,
): Promise<ChatbotResponse> {
  // Si no hay conexión, encolar el mensaje y devolver una respuesta simulada
  if (!isOnline()) {
    const messageId = enqueueMessage(sessionId, message, matricula || null)
    console.log(`Sin conexión. Mensaje encolado con ID: ${messageId}`)

    return generateOfflineResponse(message, sessionId)
  }

  let retries = 3

  while (retries > 0) {
    try {
      const client = createChatbotClient()

      // Crear el objeto de datos según la estructura esperada por la API
      const requestData = {
        mensaje: message,
        session_id: sessionId,
        matricula: matricula || null,
      }

      console.log("Enviando mensaje al chatbot:", requestData)

      // Añadir el prefijo /api a la ruta
      const response = await client.post<ChatbotResponse>("/api/mensajes/mensajes-chatbot/conversar", requestData)
      console.log("Respuesta recibida:", response.data)

      // Procesar la cola de mensajes pendientes si este mensaje tuvo éxito
      processMessageQueue((sid: string, msg: string, mat: string | null) => sendChatbotMessage(msg, sid, mat))
        .then((result: QueueProcessResult) => {
          if (result.success > 0) {
            console.log(`Se enviaron ${result.success} mensajes pendientes`)
          }
        })
        .catch((err: Error) => console.error("Error procesando cola de mensajes:", err))

      return response.data
    } catch (error) {
      const axiosError = error as AxiosError
      console.error(`Error al enviar mensaje al chatbot (intentos restantes: ${retries - 1}):`, axiosError)
      retries--

      // Si aún quedan intentos, esperar antes de reintentar
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }
  }

  // Si llegamos aquí, todos los intentos fallaron
  console.error("Todos los intentos de conexión fallaron")

  // Encolar el mensaje para intentar enviarlo más tarde
  enqueueMessage(sessionId, message, matricula || null)

  // Generar una respuesta local para el modo offline
  return generateOfflineResponse(message, sessionId)
}

// Función para obtener las conversaciones de un usuario
export async function getUserConversations(matricula: string): Promise<SessionResponse[]> {
  try {
    if (!isOnline()) {
      console.log("Sin conexión. No se pueden cargar conversaciones.")
      return []
    }

    const client = createChatbotClient()
    // Añadir el prefijo /api a la ruta
    const response = await client.get<SessionResponse[]>(`/api/mensajes/mensajes-chatbot/sesiones/${matricula}`)
    return response.data
  } catch (error) {
    console.error("Error al obtener conversaciones:", error)
    return []
  }
}

// Función para obtener los mensajes de una conversación
export async function getConversationMessages(sessionId: string): Promise<ConversationResponse> {
  try {
    if (!isOnline()) {
      console.log("Sin conexión. No se pueden cargar mensajes.")
      return { mensajes: [] }
    }

    const client = createChatbotClient()
    // Añadir el prefijo /api a la ruta
    const response = await client.get<ConversationResponse>(`/api/mensajes/mensajes-chatbot/mensajes/${sessionId}`)
    return response.data
  } catch (error) {
    console.error("Error al obtener mensajes:", error)
    return { mensajes: [] }
  }
}

// Función para eliminar una conversación
export const deleteConversation = async (sessionId: string, matricula: string): Promise<boolean> => {
  try {
    const client = createChatbotClient()
    await client.delete(`/api/mensajes/mensajes-chatbot/conversaciones/${sessionId}/${matricula}`)
    return true
  } catch (error) {
    console.error("Error al eliminar la conversación:", error)
    return false
  }
}

// Función para cambiar el título de una conversación
export const updateConversationTitle = async (
  sessionId: string,
  matricula: string,
  title: string,
): Promise<boolean> => {
  try {
    const client = createChatbotClient()
    await client.put(`/api/mensajes/mensajes-chatbot/conversaciones/${sessionId}/titulo`, {
      session_id: sessionId,
      matricula,
      titulo: title,
    })
    return true
  } catch (error) {
    console.error("Error al actualizar el título de la conversación:", error)
    return false
  }
}

// Función para reiniciar los intentos de carga de conversaciones
export function resetConversationLoadingAttempts(): void {
  console.log("Reiniciando intentos de carga de conversaciones")
}
