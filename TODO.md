# Backlog

Ideas recopiladas investigando herramientas similares (Plane, Huly, Vikunja, Focalboard, OpenProject, Taiga, Kaneo) y el estado de la IA en gestión de proyectos, más deuda técnica detectada durante el desarrollo.

## Hecho

- [x] Scaffold Next.js + Prisma (SQLite) + NextAuth
- [x] Tablero Kanban de proyectos en el dashboard (drag & drop por estado)
- [x] Estados personalizados (`/settings/statuses`)
- [x] Equipo / encargados en proyectos y tareas (`/settings/team`)
- [x] Historial automático de cambios (estado, encargado, campos, tareas)
- [x] Documentos con IA (Gemini): resumen de proyecto (stack, lenguaje, estado, repo, despliegue, pendientes) y actas de reunión (próximos pasos)
- [x] Info pública de GitHub por proyecto (`github-info`)
- [x] Rediseño visual (tema claro editorial: Fraunces + Public Sans, paleta papel/tinta/óxido)
- [x] Fix crítico: `pdf-parse` no analizaba ningún PDF (bug de `!module.parent`)
- [x] Command palette (Cmd/Ctrl+K)
- [x] Módulos para agrupar tareas dentro de un proyecto

## En el radar (por prioridad sugerida)

### Alto impacto / esfuerzo razonable
- [x] Resumen semanal automático por proyecto con IA (botón en la pestaña Historial, cachea el último resultado)
- [x] Tope diario de solicitudes de IA (`GEMINI_DAILY_LIMIT`, default 200/día)
- [x] Endpoint + botón para borrar documentos
- [x] "Preguntale al proyecto": Q&A con IA sobre el texto de los documentos ya subidos, en la pestaña Documentos
- [x] Soporte de GitLab y Bitbucket en la info pública de repositorio (antes solo GitHub)
- [x] Vistas alternativas de tareas: Lista (ordenable) y Calendario (por fecha límite), además de la vista Agrupada por módulo

### Calidad / deuda técnica
- [x] Validación con Zod en las rutas de API que reciben input de usuario (`src/lib/validation.ts`)
- [x] Límite de tamaño de archivo en la subida de documentos (10 MB)
- [x] Bloqueo de cuenta tras 5 intentos fallidos de login (15 min, sin revelar el motivo en el mensaje de error)
- [x] Tests con Vitest (`npm run test`) — 25 tests: `aiUsage`, `time`, `validation`. Alcance: lógica pura, no las rutas completas (requeriría mockear `getServerSession`/`NextRequest`, queda como siguiente paso si se quiere)
- [x] Recuperar contraseña — Resend integrado, probado de punta a punta
- [x] Paginación con "Cargar más" en el dashboard (proyectos) y en el Historial de cada proyecto — Tareas/Equipo quedan sin paginar a propósito (romperían las vistas de Agrupado/Calendario, y son listas acotadas)
- [ ] Evaluar migración a Next.js 16 (hay CVEs moderadas/altas pendientes en la línea 15.x) — cambio grande, se hace más adelante, después de validar el primer despliegue

### Estilo / UX
- [x] Reemplazar `confirm()`/`alert()` nativos del navegador por un modal propio (`ConfirmDialog.tsx` + `useConfirm()`)
- [x] Loading skeletons (`loading.tsx` en dashboard y detalle de proyecto)
- [x] Animación de entrada escalonada al cargar el tablero
- [x] Modo oscuro diseñado a propósito (papel oscuro/tinta clara cálidos, respeta preferencia del sistema, toggle persistente)

### Equipo / cuentas (nuevo, con Resend)
- [x] Invitaciones por email para agregar miembros al equipo (reemplaza la creación directa con contraseña temporal)
- [x] Recuperar contraseña por email

### Despliegue
- [x] Dockerfile + guía de despliegue en Coolify (`DEPLOY.md`) — Postgres en producción, SQLite en local
- [x] Registro del primer admin (`/register`, solo disponible con 0 usuarios) + gestión de roles desde `/settings/team`

### Colaboración / IA (post-lanzamiento)
- [x] Notificaciones in-app (campanita) + "Mis tareas" cross-proyecto + comentarios en tareas
- [x] Prioridad de tarea separada del tipo, feed de actividad global en el dashboard, acciones en lote, checklist por tarea
- [x] Token de API personal para que un asistente de IA (Claude Code u otro) lea/actualice proyectos en nombre del usuario
- [x] Notificaciones a Discord por proyecto (webhook saliente, con @mención al encargado si tiene su Discord ID cargado)
- [ ] Bot de Discord para actualizar tareas desde el chat (pausado a propósito, después del webhook)

### Ideas nuevas (investigado 2026-09-10, sin empezar)
- [ ] Resaltar tareas vencidas (dueDate pasada y no completada) con borde/badge rojo — esfuerzo bajo, alto impacto visual
- [ ] Ampliar el Command Palette (Cmd/Ctrl+K) para que busque también por título de tarea, no solo proyectos
- [ ] Exportar a CSV (tareas o historial de un proyecto)
- [ ] Dependencias entre tareas ("bloquea" / "depende de")
- [ ] Digest semanal por email (tus tareas de la semana, lo que venció, lo que te asignaron) — reusando Resend
- [ ] Filtros guardados en la pestaña Tareas (por encargado/prioridad/módulo, sin pasar por la selección en lote)
- [ ] 2FA de login
- [ ] Página de auditoría completa para LEAD (historial de todos los proyectos, filtrable) — separado del feed resumido del dashboard
- [ ] Ver/cerrar sesiones activas de la cuenta

## Notas

- Sin Ciclos/Sprints — decisión del usuario, no está en el radar.

- No convertir esto en un roadmap de 6 fases tipo el de ProShop — mejor ir marcando de a uno y probando en el navegador antes de seguir (ver `feedback_ui_style_preference` y el propio riesgo de "alcance" documentado en el proyecto ProShop del usuario: completar de a partes, no todo junto).
