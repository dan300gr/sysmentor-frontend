// Interfaz para los mensajes en cola
export interface QueuedMessage {
  id: string
  sessionId: string
  message: string
  matricula: string | null
  timestamp: number
  attempts: number
}

// Interfaz para el resultado del procesamiento de la cola
export interface QueueProcessResult {
  success: number
  failed: number
  remaining: number
}

// Clave para almacenar la cola en localStorage
const QUEUE_STORAGE_KEY = "messageQueue"

// Obtener la cola de mensajes
export function getMessageQueue(): QueuedMessage[] {
  const storedQueue = localStorage.getItem(QUEUE_STORAGE_KEY)
  if (!storedQueue) {
    return []
  }

  let queue: QueuedMessage[] = []
  try {
    queue = JSON.parse(storedQueue)
    // Verificar que sea un array
    if (!Array.isArray(queue)) {
      return []
    }
  } catch (error) {
    console.error("Error parsing message queue:", error)
    return []
  }

  return queue
}

// Guardar la cola de mensajes
function saveMessageQueue(queue: QueuedMessage[]): void {
  localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
}

// Añadir un mensaje a la cola
export function enqueueMessage(sessionId: string, message: string, matricula: string | null): string {
  try {
    // Generar un ID único para el mensaje
    const messageId = `queued-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Crear el objeto del mensaje
    const queuedMessage: QueuedMessage = {
      id: messageId,
      sessionId,
      message,
      matricula,
      timestamp: Date.now(),
      attempts: 0,
    }

    // Obtener la cola actual
    const queue: QueuedMessage[] = getMessageQueue()

    // Añadir el mensaje a la cola
    queue.push(queuedMessage)

    // Guardar la cola actualizada
    saveMessageQueue(queue)

    return messageId
  } catch (error) {
    console.error("Error enqueueing message:", error)
    return ""
  }
}

// Eliminar un mensaje de la cola
export function dequeueMessage(messageId: string): void {
  const queue = getMessageQueue()
  const updatedQueue = queue.filter((msg) => msg.id !== messageId)
  saveMessageQueue(updatedQueue)
}

// Actualizar los intentos de un mensaje
export function updateMessageAttempts(messageId: string): void {
  const queue = getMessageQueue()
  const updatedQueue = queue.map((msg) => (msg.id === messageId ? { ...msg, attempts: msg.attempts + 1 } : msg))
  saveMessageQueue(updatedQueue)
}

// Procesar la cola de mensajes
export async function processMessageQueue(
  sendFunction: (sessionId: string, message: string, matricula: string | null) => Promise<any>,
): Promise<QueueProcessResult> {
  try {
    // Obtener la cola actual
    const storedQueue = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (!storedQueue) {
      return { success: 0, failed: 0, remaining: 0 }
    }

    let queue: QueuedMessage[] = []
    try {
      queue = JSON.parse(storedQueue)
      // Verificar que sea un array
      if (!Array.isArray(queue)) {
        return { success: 0, failed: 0, remaining: 0 }
      }
    } catch (error) {
      console.error("Error parsing message queue:", error)
      return { success: 0, failed: 0, remaining: 0 }
    }

    if (queue.length === 0) {
      return { success: 0, failed: 0, remaining: 0 }
    }

    // Procesar hasta 5 mensajes a la vez para no sobrecargar
    const messagesToProcess = queue.slice(0, 5)
    const remainingMessages = queue.slice(5)

    let successCount = 0
    let failedCount = 0

    // Procesar los mensajes
    for (const queuedMessage of messagesToProcess) {
      try {
        // Incrementar el contador de intentos
        queuedMessage.attempts++

        // Si ha habido demasiados intentos, descartar el mensaje
        if (queuedMessage.attempts > 5) {
          failedCount++
          continue
        }

        // Enviar el mensaje
        await sendFunction(queuedMessage.sessionId, queuedMessage.message, queuedMessage.matricula)

        // Si llegamos aquí, el mensaje se envió correctamente
        successCount++
      } catch (error) {
        console.error(`Error processing queued message ${queuedMessage.id}:`, error)

        // Si falla, volver a poner en la cola para reintentar más tarde
        remainingMessages.push(queuedMessage)
        failedCount++
      }
    }

    // Guardar la cola actualizada
    saveMessageQueue(remainingMessages)

    return {
      success: successCount,
      failed: failedCount,
      remaining: remainingMessages.length,
    }
  } catch (error) {
    console.error("Error processing message queue:", error)
    return { success: 0, failed: 0, remaining: 0 }
  }
}

// Función para obtener el número de mensajes en cola
export function getQueuedMessageCount(): number {
  try {
    const storedQueue = localStorage.getItem(QUEUE_STORAGE_KEY)
    if (!storedQueue) {
      return 0
    }

    const queue = JSON.parse(storedQueue)
    return Array.isArray(queue) ? queue.length : 0
  } catch (error) {
    console.error("Error getting queued message count:", error)
    return 0
  }
}

// Función para limpiar la cola de mensajes
export function clearMessageQueue(): void {
  localStorage.removeItem(QUEUE_STORAGE_KEY)
}
