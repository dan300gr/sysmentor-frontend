// Función auxiliar para crear un cliente HTTP para el chatbot
import axios from "axios"
import { getAuthToken } from "@/lib/auth"

// Importar las funciones de la cola de mensajes
import { enqueueMessage, processMessageQueue, type QueueProcessResult } from "@/lib/message-queue"

// URL base de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-sysmentor.onrender.com"

// Bandera para controlar si debemos seguir intentando cargar conversaciones
let shouldTryLoadingConversations = true

// Modificar la función createChatbotClient para usar las rutas correctas y añadir más opciones de depuración
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
    timeout: 15000, // Aumentar el timeout a 15 segundos
    // Configuración para manejar errores de red
    validateStatus: (status) => {
      return status >= 200 && status < 500 // Manejar solo errores de cliente
    },
    // Añadir withCredentials para manejar CORS si es necesario
    withCredentials: false, // Cambiar a true si el servidor requiere credenciales
  })
}

// Función para verificar si hay conexión a internet
function isOnline() {
  return navigator.onLine
}

// Modificar la función sendChatbotMessage para usar la cola de mensajes
export async function sendChatbotMessage(message: string, sessionId: string, matricula?: string | null) {
  // Si no hay conexión, encolar el mensaje y devolver una respuesta simulada
  if (!isOnline()) {
    const messageId = enqueueMessage(sessionId, message, matricula || null)
    console.log(`Sin conexión. Mensaje encolado con ID: ${messageId}`)

    return {
      respuesta:
        "Tu mensaje ha sido guardado y se enviará cuando se restablezca la conexión a internet. Por ahora, puedo ayudarte con información básica que no requiera conexión.",
      session_id: sessionId,
      fecha: new Date().toISOString(),
    }
  }

  let retries = 3
  let lastError = null

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

      const response = await client.post("/api/mensajes/mensajes-chatbot/conversar", requestData)
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
      console.error(`Error al enviar mensaje al chatbot (intentos restantes: ${retries - 1}):`, error)
      lastError = error
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

  // Devolver una respuesta simulada para que la aplicación siga funcionando
  return {
    respuesta:
      "Lo siento, parece que estoy teniendo problemas para conectarme al servidor. Tu mensaje ha sido guardado y se enviará cuando se restablezca la conexión.",
    session_id: sessionId,
    fecha: new Date().toISOString(),
  }
}

// Modificar la función getUserConversations para que no intente conectarse al servidor
export async function getUserConversations(matricula: string) {
  console.log("Función de obtener conversaciones desactivada")
  // Simplemente devolver un array vacío sin intentar conectarse al servidor
  return []
}

// Modificar la función getConversationMessages para que no intente conectarse al servidor
export async function getConversationMessages(sessionId: string) {
  console.log("Función de obtener mensajes de conversación desactivada")
  // Devolver un objeto con un array de mensajes vacío
  return { mensajes: [] }
}

// Función para reiniciar los intentos de carga de conversaciones
export function resetConversationLoadingAttempts() {
  shouldTryLoadingConversations = true
  console.log("Reiniciando intentos de carga de conversaciones")
}
