import { createAuthClient, getCurrentUser } from "@/lib/auth"

// Enumeración para los estados de progreso
export enum EstadoProgreso {
  NO_INICIADO = "no_iniciado",
  EN_PROGRESO = "en_progreso",
  COMPLETADO = "completado",
}

// Tipo para asegurar que estadoProgreso pueda ser cualquier valor del enum
export type EstadoProgresoType = EstadoProgreso.NO_INICIADO | EstadoProgreso.EN_PROGRESO | EstadoProgreso.COMPLETADO

// Interfaz para el progreso de un recurso
export interface ProgresoRecurso {
  id?: number
  matricula: string
  recurso_id: number
  estado: EstadoProgresoType
  fecha_inicio?: string
  fecha_finalizacion?: string
  calificacion?: number
  comentarios?: string
}

// Función para crear o actualizar el progreso de un recurso
export async function crearOActualizarProgreso(progreso: ProgresoRecurso): Promise<ProgresoRecurso> {
  try {
    const authClient = createAuthClient()
    const response = await authClient.post("/progreso-recursos", progreso)
    return response.data
  } catch (error) {
    console.error("Error al registrar progreso:", error)
    throw error
  }
}

// Función para obtener el progreso de un recurso específico
export async function obtenerProgresoRecurso(recursoId: number): Promise<ProgresoRecurso | null> {
  try {
    const authClient = createAuthClient()
    const response = await authClient.get(`/progreso-recursos?recurso_id=${recursoId}`)

    // Si hay resultados, devolver el primero
    if (response.data && response.data.length > 0) {
      return response.data[0]
    }

    return null
  } catch (error) {
    console.error(`Error al obtener progreso para el recurso ${recursoId}:`, error)
    return null
  }
}

// Función para obtener todos los progresos del usuario
export async function obtenerTodosLosProgresos(): Promise<ProgresoRecurso[]> {
  try {
    const authClient = createAuthClient()
    const response = await authClient.get("/progreso-recursos")
    return response.data
  } catch (error) {
    console.error("Error al obtener todos los progresos:", error)
    return []
  }
}

// Función para marcar un recurso como completado
export async function marcarComoCompletado(
  recursoId: number,
  calificacion?: number,
  comentarios?: string,
): Promise<ProgresoRecurso | null> {
  try {
    // Obtener el usuario actual para la matrícula
    const usuario = getCurrentUser()
    if (!usuario) {
      console.error("No hay usuario autenticado")
      return null
    }

    // Primero verificamos si ya existe un progreso
    const progresoExistente = await obtenerProgresoRecurso(recursoId)

    // Preparar los datos del progreso
    const ahora = new Date().toISOString()

    const progreso: ProgresoRecurso = {
      matricula: usuario.matricula,
      recurso_id: recursoId,
      estado: EstadoProgreso.COMPLETADO,
      fecha_inicio: progresoExistente?.fecha_inicio || ahora,
      fecha_finalizacion: ahora,
      calificacion: calificacion || 0,
      comentarios: comentarios || "",
    }

    // Si existe un progreso previo y tiene ID, incluirlo
    if (progresoExistente?.id) {
      progreso.id = progresoExistente.id
    }

    const authClient = createAuthClient()
    const response = await authClient.post("/progreso-recursos", progreso)
    return response.data
  } catch (error) {
    console.error(`Error al marcar como completado el recurso ${recursoId}:`, error)
    return null
  }
}

// Función para marcar un recurso como en progreso
export async function marcarEnProgreso(recursoId: number): Promise<ProgresoRecurso | null> {
  try {
    // Obtener el usuario actual para la matrícula
    const usuario = getCurrentUser()
    if (!usuario) {
      console.error("No hay usuario autenticado")
      return null
    }

    // Verificamos si ya existe un progreso
    const progresoExistente = await obtenerProgresoRecurso(recursoId)

    // Si ya está completado, no lo cambiamos
    if (progresoExistente?.estado === EstadoProgreso.COMPLETADO) {
      return progresoExistente
    }

    // Preparar los datos del progreso
    const ahora = new Date().toISOString()

    const progreso: ProgresoRecurso = {
      matricula: usuario.matricula,
      recurso_id: recursoId,
      estado: EstadoProgreso.EN_PROGRESO,
      fecha_inicio: ahora,
      fecha_finalizacion: null as any, // La API podría requerir este campo aunque sea nulo
      calificacion: 0,
      comentarios: "",
    }

    // Si existe un progreso previo y tiene ID, incluirlo
    if (progresoExistente?.id) {
      progreso.id = progresoExistente.id
    }

    const authClient = createAuthClient()
    const response = await authClient.post("/progreso-recursos", progreso)
    return response.data
  } catch (error) {
    console.error(`Error al marcar en progreso el recurso ${recursoId}:`, error)
    return null
  }
}
