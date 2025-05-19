import axios, { type AxiosError } from "axios"

// URL base de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api-sysmentor.onrender.com"

// Definición del tipo de rol para mantener consistencia
export type UserRole = "estudiante" | "admin"

// Interfaz para el usuario según la respuesta real de la API
interface LoginResponse {
  access_token: string
  token_type: string
  user_id?: number
  matricula?: string
  nombre?: string
  apellido_paterno?: string
  apellido_materno?: string
  correo?: string
  rol?: string
  fecha_registro?: string
  // Mantenemos el campo usuario por compatibilidad
  usuario?: {
    id: number
    matricula: string
    nombre: string
    apellido_paterno: string
    apellido_materno: string
    correo: string
    rol: string
    fecha_registro: string
  }
}

// Interfaz para errores de la API
interface ApiErrorResponse {
  detail?: string | string[]
  [key: string]: unknown
}

// Interfaz para el usuario normalizado que usaremos en la aplicación
export interface Usuario {
  id: number
  matricula: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  correo: string
  rol: UserRole
  fecha_registro: string
}

/**
 * Función para iniciar sesión
 * @param matricula Matrícula del usuario
 * @param contrasena Contraseña del usuario
 * @returns Respuesta con token y datos del usuario
 */
export async function loginUser(matricula: string, contrasena: string): Promise<{ token: string; user: Usuario }> {
  try {
    // Crear un objeto URLSearchParams para enviar los datos como x-www-form-urlencoded
    const formData = new URLSearchParams()
    formData.append("username", matricula)
    formData.append("password", contrasena)

    console.log("Enviando datos:", formData.toString())

    const response = await axios.post<LoginResponse>(`${API_URL}/api/usuarios/login`, formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    console.log("Respuesta de la API:", response.data)

    // Normalizar la respuesta para manejar ambas estructuras posibles
    let userData: Usuario

    if (response.data.usuario) {
      // Si la respuesta tiene la estructura esperada con un objeto usuario
      const apiUser = response.data.usuario
      userData = {
        ...apiUser,
        // Asegurarse de que rol sea del tipo correcto
        rol: (apiUser.rol === "admin" ? "admin" : "estudiante") as UserRole,
      }
    } else {
      // Si la respuesta tiene los datos de usuario en el nivel superior
      const rol = response.data.rol || "estudiante"
      userData = {
        id: response.data.user_id || 0,
        matricula: response.data.matricula || "",
        nombre: response.data.nombre || "",
        apellido_paterno: response.data.apellido_paterno || "",
        apellido_materno: response.data.apellido_materno || "",
        correo: response.data.correo || "",
        rol: (rol === "admin" ? "admin" : "estudiante") as UserRole,
        fecha_registro: response.data.fecha_registro || new Date().toISOString(),
      }
    }

    return {
      token: response.data.access_token,
      user: userData,
    }
  } catch (error) {
    console.error("Error en loginUser:", error)
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiErrorResponse>
      if (axiosError.response) {
        console.error("Detalles del error:", axiosError.response.data)
        throw new Error(`Error al iniciar sesión: ${JSON.stringify(axiosError.response.data)}`)
      }
    }
    throw new Error("Error al iniciar sesión")
  }
}

/**
 * Función para verificar si el usuario está autenticado
 * @returns Booleano indicando si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false

  const token = localStorage.getItem("token")
  return !!token
}

/**
 * Función para obtener el usuario actual
 * @returns Datos del usuario o null si no está autenticado
 */
export function getCurrentUser(): Usuario | null {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("user")

  // Verificar que userStr no sea null, undefined o la cadena "undefined"
  if (!userStr || userStr === "undefined") return null

  try {
    const parsedUser = JSON.parse(userStr)

    // Verificar que parsedUser sea un objeto válido
    if (!parsedUser || typeof parsedUser !== "object") return null

    // Asegurarse de que el rol sea del tipo correcto
    const rol = parsedUser.rol || "estudiante"
    return {
      ...parsedUser,
      rol: (rol === "admin" ? "admin" : "estudiante") as UserRole,
    }
  } catch (error) {
    console.error("Error al parsear usuario:", error)
    // Si hay un error al parsear, limpiar el localStorage para evitar futuros errores
    localStorage.removeItem("user")
    return null
  }
}

/**
 * Función para cerrar sesión
 */
export function logout(): void {
  if (typeof window === "undefined") return

  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

/**
 * Función para obtener el token de autenticación
 * @returns Token de autenticación o null si no existe
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null

  const token = localStorage.getItem("token")

  // Verificar que token no sea null, undefined o la cadena "undefined"
  if (!token || token === "undefined") return null

  return token
}

// Añadir console.log para depurar la URL base de la API
export function createAuthClient() {
  const token = getAuthToken()
  const baseURL = `${API_URL}/api`

  console.log("Creando cliente de autenticación con URL base:", baseURL)

  return axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  })
}
