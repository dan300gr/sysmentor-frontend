import { createAuthClient, getCurrentUser } from "@/lib/auth"
import axios from "axios"

// Interfaces para los tipos de datos
export interface Foro {
  id: number
  matricula: string
  materia_id: number
  titulo: string
  contenido: string
  fecha_publicacion: string
  likes: number
  dislikes: number
  usuario?: {
    nombre: string
    apellido_paterno: string
    apellido_materno: string
  }
  materia?: {
    nombre: string
  }
}

export interface ForoCreate {
  materia_id: number
  titulo: string
  contenido: string
}

export interface ForoUpdate {
  titulo?: string
  contenido?: string
}

export interface Comentario {
  id: number
  foro_id: number
  matricula: string
  comentario: string
  fecha_comentario: string
  usuario?: {
    nombre: string
    apellido_paterno: string
    apellido_materno: string
  }
}

export interface ComentarioCreate {
  foro_id: number
  comentario: string
}

export interface ComentarioUpdate {
  comentario: string
}

export type TipoReaccion = "like" | "dislike"

export interface Reaccion {
  foro_id: number
  tipo: TipoReaccion
}

// Función para obtener todos los temas del foro
export async function obtenerTemas(materia_id?: number, skip = 0, limit = 20): Promise<Foro[]> {
  try {
    const authClient = createAuthClient()
    let url = `/foros?skip=${skip}&limit=${limit}`

    if (materia_id) {
      url += `&materia_id=${materia_id}`
    }

    const response = await authClient.get(url)
    return response.data
  } catch (error) {
    console.error("Error al obtener temas del foro:", error)
    return []
  }
}

// Función para obtener un tema específico
export async function obtenerTema(id: number): Promise<Foro | null> {
  try {
    const authClient = createAuthClient()
    const response = await authClient.get(`/foros/${id}`)
    return response.data
  } catch (error) {
    console.error(`Error al obtener tema del foro con ID ${id}:`, error)
    return null
  }
}

// Función para crear un nuevo tema
export async function crearTema(tema: ForoCreate): Promise<Foro | null> {
  try {
    const usuario = getCurrentUser()
    if (!usuario) {
      throw new Error("Usuario no autenticado")
    }

    const authClient = createAuthClient()
    const response = await authClient.post("/foros/", {
      ...tema,
      matricula: usuario.matricula,
    })

    return response.data
  } catch (error) {
    console.error("Error al crear tema del foro:", error)
    throw error
  }
}

// Función para actualizar un tema
export async function actualizarTema(id: number, tema: ForoUpdate): Promise<Foro | null> {
  try {
    const authClient = createAuthClient()
    const response = await authClient.put(`/foros/${id}`, tema)
    return response.data
  } catch (error) {
    console.error(`Error al actualizar tema del foro con ID ${id}:`, error)
    throw error
  }
}

// Función para eliminar un tema
export async function eliminarTema(id: number): Promise<boolean> {
  try {
    const authClient = createAuthClient()
    await authClient.delete(`/foros/${id}`)
    return true
  } catch (error) {
    console.error(`Error al eliminar tema del foro con ID ${id}:`, error)
    throw error
  }
}

// Función para obtener comentarios de un tema
export async function obtenerComentarios(foroId: number): Promise<Comentario[]> {
  try {
    const authClient = createAuthClient()
    const response = await authClient.get(`/comentarios-foro/foro/${foroId}`)
    return response.data
  } catch (error) {
    console.error(`Error al obtener comentarios del tema ${foroId}:`, error)
    return []
  }
}

// Función para crear un comentario
export async function crearComentario(comentario: ComentarioCreate): Promise<Comentario | null> {
  try {
    const usuario = getCurrentUser()
    if (!usuario) {
      throw new Error("Usuario no autenticado")
    }

    const authClient = createAuthClient()
    const response = await authClient.post("/comentarios-foro/", {
      ...comentario,
      matricula: usuario.matricula,
    })

    return response.data
  } catch (error) {
    console.error("Error al crear comentario:", error)
    throw error
  }
}

// Función para actualizar un comentario
export async function actualizarComentario(id: number, comentario: ComentarioUpdate): Promise<Comentario | null> {
  try {
    const authClient = createAuthClient()
    const response = await authClient.put(`/comentarios-foro/${id}`, comentario)
    return response.data
  } catch (error) {
    console.error(`Error al actualizar comentario con ID ${id}:`, error)
    throw error
  }
}

// Función para eliminar un comentario
export async function eliminarComentario(id: number): Promise<boolean> {
  try {
    const authClient = createAuthClient()
    await authClient.delete(`/comentarios-foro/${id}`)
    return true
  } catch (error) {
    console.error(`Error al eliminar comentario con ID ${id}:`, error)
    throw error
  }
}

// Función para añadir o actualizar una reacción
export async function reaccionar(foroId: number, tipo: TipoReaccion): Promise<boolean> {
  try {
    const usuario = getCurrentUser()
    if (!usuario) {
      throw new Error("Usuario no autenticado")
    }

    // Según la documentación, el endpoint espera:
    // - foro_id como parámetro de ruta (ya incluido en la URL)
    // - tipo como parámetro de consulta (query parameter)
    const authClient = createAuthClient()
    await authClient.post(`/foros/${foroId}/reacciones?tipo=${tipo}`, {})

    return true
  } catch (error) {
    console.error(`Error al reaccionar al tema ${foroId}:`, error)

    // Mejorar el manejo de errores para proporcionar información más detallada
    if (axios.isAxiosError(error) && error.response) {
      console.error("Detalles del error:", error.response.data)

      // Si hay un mensaje de error específico, mostrarlo
      if (error.response.data.detail) {
        if (typeof error.response.data.detail === "string") {
          throw new Error(`Error al reaccionar: ${error.response.data.detail}`)
        } else {
          throw new Error(`Error al reaccionar: ${JSON.stringify(error.response.data.detail)}`)
        }
      }
    }

    throw error
  }
}
