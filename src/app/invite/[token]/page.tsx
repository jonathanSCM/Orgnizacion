"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

type Invitation = { name: string; email: string; role: "LEAD" | "MEMBER" };

export default function InvitePage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/team/invite/${params.token}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setLoadError(body.error || "Invitación inválida");
          return;
        }
        setInvitation(await res.json());
      })
      .catch(() => setLoadError("No se pudo cargar la invitación"));
  }, [params.token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/team/invite/${params.token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "No se pudo aceptar la invitación");
      return;
    }
    router.push("/login");
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm surface-card p-9 text-center">
          <h1 className="font-display text-xl font-semibold text-ink">Invitación no disponible</h1>
          <p className="mt-2 text-sm text-ink-soft">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-ink-faint">Cargando invitación...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5 surface-card p-9">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Hola, {invitation.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Te invitaron a unirte al Panel de Organización como{" "}
            {invitation.role === "LEAD" ? "líder" : "miembro"} ({invitation.email}). Elegí tu contraseña
            para activar tu cuenta.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Confirmar contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="field"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm font-medium text-rust">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creando cuenta..." : "Aceptar invitación"}
        </button>
      </form>
    </div>
  );
}
