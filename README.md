# Panel de Organización

Panel interno tipo Jira para organizar los proyectos del equipo: estados personalizados, tablero Kanban con historial de cambios, y análisis de documentos con IA (resúmenes de proyecto y actas de reunión) para generar automáticamente próximos pasos.

## Requisitos

- Node.js 20+
- Nada más: usa SQLite (un archivo local), no hace falta instalar Postgres ni Docker.

## Puesta en marcha

```bash
npm install
cp .env.example .env      # y edita GEMINI_API_KEY si quieres análisis con IA
npx prisma migrate dev    # crea la base de datos SQLite y aplica el esquema
npm run dev
```

Abre http://localhost:3000 — como la base está vacía, vas a caer en `/register`: creá ahí tu primera cuenta (queda automáticamente como líder del equipo). Desde `/settings/team` podés invitar al resto por email.

## Habilitar la IA (Gemini, gratis)

1. Entra a https://aistudio.google.com/apikey y genera una API key (no pide tarjeta).
2. Pégala en `.env` como `GEMINI_API_KEY=...`.
3. Reinicia `npm run dev`.

Sin la key, la app funciona igual: los documentos se guardan pero sin análisis automático.

## Qué incluye

- **Tablero de proyectos** (`/dashboard`): un Kanban donde cada columna es un estado (Pendiente, Necesita revisión, etc.) y cada tarjeta es un proyecto completo. Arrastra un proyecto entre columnas para cambiar su estado — queda registrado quién lo hizo y hace cuánto está ahí.
- **Estados personalizados** (`/settings/statuses`): crea/borra los estados que necesites.
- **Equipo** (`/settings/team`): agrega miembros del equipo para poder asignarlos como encargados de proyectos y tareas.
- **Dentro de cada proyecto**: pestaña **Tareas** (lista de cambios necesarios/a realizar/realizados con su encargado), **Info del proyecto** (descripción, stack, link de despliegue, repo de GitHub con info pública automática, encargado), **Documentos** e **Historial** completo.
- **Documentos con IA**: sube un `.pdf`/`.md`/`.txt`:
  - **Resumen/spec del proyecto** → la IA sugiere lenguaje, stack, resumen y estado; puedes aplicarlo al proyecto con un clic.
  - **Acta/transcripción de reunión** → la IA extrae próximos pasos y los puedes convertir en tareas con un clic.

- **Invitaciones y recuperar contraseña** (Resend): configura `RESEND_API_KEY` y `MAIL_FROM` en `.env` para poder invitar gente por email y que puedan recuperar su contraseña. Gratis en https://resend.com/api-keys.

## Despliegue en producción

Ver [DEPLOY.md](./DEPLOY.md) para la guía paso a paso de despliegue en Coolify (usa el `Dockerfile` incluido, que cambia automáticamente de SQLite a PostgreSQL para producción).

## Notas

- Base de datos local: SQLite (`prisma/dev.db`). En producción (Docker/Coolify) se usa PostgreSQL automáticamente — ver `DEPLOY.md`.
- El campo de GitHub/GitLab/Bitbucket es solo un enlace + info pública (sin OAuth ni importación de issues).
