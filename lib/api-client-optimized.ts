import axios from "axios"
import { CACHE_DURATIONS, API_ENDPOINTS, generateCacheKey, isCacheValid } from "./api-config"

// Crear instancia de axios
const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para manejar caché y optimizaciones
api.interceptors.request.use(async (config) => {
  // No cachear solicitudes que no sean GET
  if (config.method !== "get") return config

  // Extraer endpoint y parámetros
  const url = config.url || ""
  const params = config.params || {}

  // Determinar duración de caché basado en el endpoint
  let cacheDuration = CACHE_DURATIONS.RECURSOS // Valor por defecto

  if (url.includes(API_ENDPOINTS.SEMESTRES)) {
    cacheDuration = CACHE_DURATIONS.SEMESTRES
  } else if (url.includes(API_ENDPOINTS.MATERIAS)) {
    cacheDuration = CACHE_DURATIONS.MATERIAS
  } else if (url.includes(API_ENDPOINTS.TEMAS)) {
    cacheDuration = CACHE_DURATIONS.TEMAS
  } else if (url.includes(API_ENDPOINTS.PROGRESOS)) {
    cacheDuration = CACHE_DURATIONS.PROGRESOS
  }

  // Generar clave de caché
  const cacheKey = generateCacheKey(url, params)

  // Verificar si hay datos en caché
  const cachedData = localStorage.getItem(cacheKey)
  if (cachedData) {
    try {
      const { data, timestamp } = JSON.parse(cachedData)

      // Si los datos en caché son válidos, cancelar la solicitud y devolver los datos en caché
      if (isCacheValid(timestamp, cacheDuration)) {
        const source = axios.CancelToken.source()
        config.cancelToken = source.token
        source.cancel(JSON.stringify({ data, fromCache: true }))
        return config
      }
    } catch (e) {
      console.error("Error al leer caché:", e)
    }
  }

  return config
})

// Interceptor para manejar respuestas y guardar en caché
api.interceptors.response.use(
  (response) => {
    // Solo cachear respuestas de solicitudes GET
    if (response.config.method === "get") {
      // Asegurarse de que url nunca sea undefined
      const url = response.config.url || ""
      const params = response.config.params || {}
      // Generar clave de caché con url garantizado como string
      const cacheKey = generateCacheKey(url, params)

      // Guardar en caché
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: response.data,
          timestamp: Date.now(),
        }),
      )
    }

    return response
  },
  (error) => {
    // Si la solicitud fue cancelada debido a caché, devolver los datos en caché
    if (axios.isCancel(error)) {
      try {
        const { data, fromCache } = JSON.parse(error.message || "{}")
        if (fromCache) {
          return Promise.resolve({ data, status: 200, fromCache: true })
        }
      } catch (e) {
        console.error("Error al procesar datos de caché:", e)
      }
    }

    return Promise.reject(error)
  },
)

export default api
