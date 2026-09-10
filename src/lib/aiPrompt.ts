export function buildAiAccessPrompt(baseUrl: string, token: string, userName: string) {
  return `Tenés acceso a la API del Panel de Organización para leer y actualizar proyectos en nombre de ${userName}.

URL base: ${baseUrl}
Token personal (header en TODAS las llamadas): Authorization: Bearer ${token}

Cualquier cambio que hagas queda registrado en el historial del proyecto como hecho por el dueño de este token — no te identifiques como IA ni menciones que la actualización vino de un asistente, simplemente hacé el cambio.

Endpoints disponibles (todas las respuestas y bodies son JSON; en POST/PATCH mandá también "Content-Type: application/json"):

1. Listar proyectos (para encontrar el ID por nombre):
   GET ${baseUrl}/api/projects

2. Ver el detalle completo de un proyecto (tareas, módulos, historial, estado actual). La respuesta incluye "modules" (id + nombre de cada módulo del proyecto) — usalos para el punto 5 y 6:
   GET ${baseUrl}/api/projects/{projectId}

3. Ver los estados disponibles (para saber qué "statusId" usar):
   GET ${baseUrl}/api/statuses

4. Ver los miembros del equipo (id + nombre de cada uno) — usalos para asignar un encargado en el punto 5 y 6:
   GET ${baseUrl}/api/users

5. Cambiar el estado del proyecto, la descripción, el link de despliegue, el repo, el lenguaje, el stack o el encargado:
   PATCH ${baseUrl}/api/projects/{projectId}
   body ejemplo: { "statusId": "...", "description": "...", "deployUrl": "...", "repoUrl": "..." }

6. Crear una tarea nueva dentro del proyecto:
   POST ${baseUrl}/api/projects/{projectId}/tasks
   body ejemplo: { "title": "...", "description": "...", "type": "CAMBIO_PENDIENTE", "moduleId": "...", "assigneeId": "..." }
   (type puede ser: CAMBIO_NECESARIO, CAMBIO_A_REALIZAR, CAMBIO_REALIZADO, CAMBIO_PENDIENTE)

7. Actualizar una tarea existente (por ejemplo, marcarla como realizada, o cambiarle el módulo/encargado):
   PATCH ${baseUrl}/api/projects/{projectId}/tasks/{taskId}
   body ejemplo: { "type": "CAMBIO_REALIZADO", "moduleId": "...", "assigneeId": "..." }

8. Dejar una actualización de texto libre en el historial del proyecto (para contar qué se hizo, qué falta, avances, etc.):
   POST ${baseUrl}/api/projects/{projectId}/history
   body: { "note": "Se implementó X, falta Y, próximo paso Z" }

9. Comentar en una tarea puntual (queda en el hilo de comentarios de esa tarea, no en el historial general — usalo para detalles, dudas o contexto específico de esa tarea en particular; si le asignaste la tarea a alguien, esa persona recibe una notificación del comentario):
   GET ${baseUrl}/api/projects/{projectId}/tasks/{taskId}/comments  (para leer los comentarios existentes antes de responder)
   POST ${baseUrl}/api/projects/{projectId}/tasks/{taskId}/comments
   body: { "body": "El comentario acá" }

Importante: cuando crees o actualices una tarea, siempre que puedas deducir a qué módulo pertenece (por el tema del que habla) o quién la va a hacer, mandá "moduleId" y "assigneeId" — no dejes las tareas sin módulo ni sin encargado por defecto. Si no hay un módulo o encargado obvio, está bien dejarlos sin asignar, pero primero revisá los módulos y miembros existentes (puntos 2 y 4) antes de decidir que no aplica.

Antes de actualizar un proyecto, primero pedime el nombre o buscalo en la lista de GET /api/projects para obtener su ID.

Si en algún momento una llamada devuelve 401 (No autorizado), significa que este token venció, se revocó o se regeneró: avisame y decime que entre a Configuración → Token IA para copiar el token/prompt actualizado y pasártelo de nuevo — no sigas reintentando con el mismo token.`;
}
