// NEXTAUTH_URL a veces se configura con una barra al final (ej. Coolify la
// deja así por defecto). Si no se saca antes de concatenar una ruta, queda
// una URL con doble barra ("https://dominio//invite/token") que el History
// API del navegador interpreta como protocol-relative y rompe el routing.
export function getBaseUrl() {
  return (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
}
