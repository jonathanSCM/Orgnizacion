# Desplegar en Coolify

Esta app corre en local con SQLite (cero configuración), pero para un despliegue real se usa **PostgreSQL** — el `Dockerfile` cambia el motor de base de datos automáticamente al construir la imagen, no hace falta tocar nada del código.

## 1. Crear la base de datos Postgres en Coolify

1. En tu proyecto de Coolify, **+ New Resource → Databases → PostgreSQL**.
2. Dejá que Coolify genere usuario/contraseña, o ponelos vos.
3. Una vez creada, copiá la **URL de conexión interna** (algo como `postgres://usuario:password@nombre-del-servicio:5432/nombre-db`) — la vas a necesitar en el paso 3.

## 2. Crear la aplicación

1. **+ New Resource → Application → Public Repository** (o conectá tu cuenta de GitHub si preferís deploy privado).
2. Repositorio: `https://github.com/jonathanSCM/Orgnizacion.git`, rama `main`.
3. Build pack: **Dockerfile** (Coolify lo detecta solo al ver el `Dockerfile` en la raíz).
4. Puerto expuesto: `3000`.
5. Configurá tu dominio (o subdominio) antes del primer deploy si querés que Coolify emita el certificado HTTPS automáticamente.

## 3. Variables de entorno

En la sección **Environment Variables** de la aplicación en Coolify, cargá:

| Variable | Valor | Notas |
|---|---|---|
| `DATABASE_URL` | la URL de Postgres del paso 1 | **Obligatoria** |
| `NEXTAUTH_SECRET` | un valor aleatorio largo | **Obligatoria**. Generalo con `openssl rand -base64 32` (o cualquier generador de strings random) |
| `NEXTAUTH_URL` | `https://tu-dominio.com` | **Obligatoria**. El dominio público real, no `localhost` |
| `GEMINI_API_KEY` | tu API key de Gemini | Opcional, pero sin esto no funciona el análisis de documentos con IA. Conseguila gratis en https://aistudio.google.com/apikey |
| `GEMINI_DAILY_LIMIT` | `200` | Opcional (tope de solicitudes de IA por día, protección de abuso) |
| `RESEND_API_KEY` | tu API key de Resend | Opcional, pero sin esto no se pueden mandar invitaciones ni recuperar contraseña por email |
| `MAIL_FROM` | `Panel de Organización <noreply@tu-dominio-verificado.com>` | Solo funciona con un dominio verificado en tu cuenta de Resend |
| `BOSS_PANEL_URL` | `https://jefe.tu-dominio.com` | Opcional — URL pública del Panel del Jefe (app separada, ver su propio DEPLOY.md). Sin esto no se sincroniza nada, no rompe nada acá |
| `BOSS_PANEL_SYNC_TOKEN` | el mismo valor que `SYNC_TOKEN` en el Panel del Jefe | Opcional, va junto con `BOSS_PANEL_URL` |

No hace falta configurar `PORT` — el contenedor ya escucha en `3000` (Coolify lo detecta con el puerto expuesto del paso 2).

## 4. Deploy

1. Deploy manual desde el botón de Coolify (o activá auto-deploy en push a `main`).
2. La primera vez, el contenedor va a: sincronizar el esquema con tu Postgres (crea todas las tablas), sembrar los estados por defecto (Pendiente, En progreso, etc.), y arrancar el servidor. Mirá los logs de deploy si querés ver esos tres pasos.
3. Entrá a tu dominio — como la base está vacía, vas a caer directo en **`/register`**: creá ahí tu cuenta, queda automáticamente como **líder** del equipo.
4. Desde `/settings/team` podés invitar al resto por email, y como líder podés cambiarle el rol a cualquiera (incluso el tuyo, mientras quede al menos un líder).

## Notas

- **Redeploys**: cada vez que Coolify reconstruye el contenedor, el arranque vuelve a correr `prisma db push` (sincroniza cambios de schema sin borrar datos existentes) y el seed de estados (no duplica los que ya existen). Tus proyectos/tareas/usuarios en Postgres persisten entre deploys — solo el contenedor se reconstruye, la base de datos vive aparte.
- **Backups**: configurá el backup automático de Postgres desde la pestaña de Coolify del recurso de base de datos — no hay nada especial que hacer del lado de la app.
- El `prisma db push` del arranque corre con `--accept-data-loss`, que cubre cambios "destructivos pero ejecutables" (ej. borrar una columna con datos) sin pedir confirmación — necesario porque el arranque es no interactivo. Pero hay un caso que ese flag *no* cubre: agregar una columna obligatoria sin default a una tabla que ya tiene filas. Ahí Prisma no tiene forma de decidir qué valor ponerle a las filas existentes, así que el `db push` falla igual (mensaje "changes that cannot be executed") y el contenedor queda en loop de reinicio — fue lo que pasó con `ApiToken` al pasar de token hasheado a texto plano. La única salida en ese caso es manual: conectarse a la base con el `DATABASE_URL` de Coolify y borrar/ajustar las filas conflictivas de esa tabla puntual (`npx prisma db execute --url "..." --stdin` con un `DELETE FROM "Tabla";`), y recién ahí el siguiente deploy sincroniza bien. Si vas a agregar una columna obligatoria a una tabla con datos, mejor dale un `@default(...)` en el schema para evitar este problema de entrada.
