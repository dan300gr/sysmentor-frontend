import type { NextApiRequest, NextApiResponse } from "next"

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Responder con un estado 200 OK y un mensaje simple
  if (req.method === "HEAD") {
    // Para solicitudes HEAD, solo devolver encabezados sin cuerpo
    res.status(200).end()
  } else {
    // Para GET y otros métodos, devolver JSON
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
  }
}
