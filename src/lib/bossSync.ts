// Empuja proyectos/tareas/estados al Panel del Jefe (app separada, de solo
// lectura + sprints para el jefe). No-op silencioso si no está configurado
// -- mismo espíritu que src/lib/discord.ts y src/lib/mailer.ts: nunca debe
// hacer fallar la acción que lo dispara.
type SyncType = "project" | "task" | "status";

export async function syncToBoss(type: SyncType, op: "upsert" | "delete", data: unknown) {
  const url = process.env.BOSS_PANEL_URL;
  const token = process.env.BOSS_PANEL_SYNC_TOKEN;
  if (!url || !token) return;

  const body = op === "upsert" ? JSON.stringify({ type, data }) : JSON.stringify({ type, id: (data as { id: string }).id });

  await fetch(`${url}/api/sync/${op}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body,
  })
    .then(async (res) => {
      if (!res.ok) console.error(`[boss-sync] respondió ${res.status}: ${await res.text().catch(() => "")}`);
    })
    .catch((err) => console.error("[boss-sync] error:", err));
}
