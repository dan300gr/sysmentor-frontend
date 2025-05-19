// Función para convertir markdown básico a HTML
export function markdownToHtml(text: string): string {
  if (!text) return ""

  // Convertir saltos de línea a <br>
  let html = text.replace(/\n/g, "<br>")

  // Convertir negritas: **texto** o __texto__
  html = html.replace(/\*\*(.*?)\*\*|__(.*?)__/g, "<strong>$1$2</strong>")

  // Convertir cursivas: *texto* o _texto_
  html = html.replace(/\*(.*?)\*|_(.*?)_/g, "<em>$1$2</em>")

  // Convertir listas con viñetas
  html = html.replace(/^\s*\*\s+(.*?)(?=<br>|$)/gm, "<li>$1</li>")
  html = html.replace(/<li>(.*?)<\/li>(?:\s*<br>\s*<li>|<br>\s*<li>)/g, "<li>$1</li><li>")
  html = html.replace(/(<li>.*?<\/li>)+/g, "<ul>$&</ul>")

  // Convertir encabezados: # Título
  html = html.replace(/^#\s+(.*?)(?=<br>|$)/gm, "<h1>$1</h1>")
  html = html.replace(/^##\s+(.*?)(?=<br>|$)/gm, "<h2>$1</h2>")
  html = html.replace(/^###\s+(.*?)(?=<br>|$)/gm, "<h3>$1</h3>")

  // Convertir enlaces: [texto](url)
  html = html.replace(
    /\[(.*?)\]$$(.*?)$$/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">$1</a>',
  )

  // Convertir bloques de código: ```código```
  html = html.replace(
    /```([\s\S]*?)```/g,
    '<pre class="bg-gray-100 p-2 rounded my-2 overflow-x-auto text-sm"><code>$1</code></pre>',
  )

  // Convertir código en línea: `código`
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>')

  return html
}

// Función para sanitizar HTML (prevenir XSS)
export function sanitizeHtml(html: string): string {
  // Esta es una implementación básica
  // En producción, considera usar una biblioteca como DOMPurify
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/on\w+="[^"]*"/g, "")
}
