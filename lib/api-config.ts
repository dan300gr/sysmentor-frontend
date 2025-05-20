// Configuración centralizada para la API

// Tiempo de caché para diferentes tipos de datos (en milisegundos)
export const CACHE_DURATIONS = {
  SEMESTRES: 24 * 60 * 60 * 1000, // 24 horas
  MATERIAS: 12 * 60 * 60 * 1000, // 12 horas
  TEMAS: 6 * 60 * 60 * 1000, // 6 horas
  RECURSOS: 3 * 60 * 60 * 1000, // 3 horas
  PROGRESOS: 5 * 60 * 1000, // 5 minutos
}

// Endpoints de la API
export const API_ENDPOINTS = {
  SEMESTRES: "/semestres",
  MATERIAS: "/materias",
  TEMAS: "/semanas-temas",
  RECURSOS: "/recursos",
  PROGRESOS: "/progresos",
  CUESTIONARIOS: "/cuestionarios",
  PREGUNTAS: "/preguntas",
}

// Función para generar claves de caché
export const generateCacheKey = (endpoint: string, params?: Record<string, any>): string => {
  if (!params) return `cache_${endpoint}`

  const paramsString = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join("&")

  return `cache_${endpoint}_${paramsString}`
}

// Función para verificar si los datos en caché son válidos
export const isCacheValid = (timestamp: number, duration: number): boolean => {
  return Date.now() - timestamp < duration
}
