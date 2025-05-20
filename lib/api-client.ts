// Este archivo es una sugerencia para modificar tu cliente de API
// para que no haga solicitudes a /api/ping

import axios from "axios"

// Crear una instancia de axios con configuración personalizada
const apiClient = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para evitar solicitudes a /ping
apiClient.interceptors.request.use(
  (config) => {
    // Si la URL es /ping, cancelar la solicitud
    if (config.url === "/ping") {
      // Crear un token de cancelación
      const source = axios.CancelToken.source()
      config.cancelToken = source.token
      source.cancel("Solicitud a /ping cancelada intencionalmente")
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default apiClient
