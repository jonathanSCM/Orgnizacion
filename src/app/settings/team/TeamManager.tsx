"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ConfirmDialog";

type User = { id: string; name: string; email: string; role: string };
type Invitation = {
  id: string;
  name: string;
  email: string;
  role: string;
  expiresAt: string | Date;
  token: string;
};

export default function TeamManager({
  initialUsers,
  initialInvitations,
  viewerIsLead,
}: {
  initialUsers: User[];
  initialInvitations: Invitation[];
  viewerIsLead: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [users, setUsers] = useState(initialUsers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "LEAD">("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSending(true);
    const res = await fetch("/api/team/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role }),
    });
    setSending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Error al invitar");
      return;
    }
    const created = await res.json();
    setInvitations((prev) => [created, ...prev]);
    setName("");
    setEmail("");
    setNotice(`Invitación enviada a ${created.email}`);
    setShowForm(false);
    router.refresh();
  }

  async function cancelInvite(token: string) {
    const res = await fetch(`/api/team/invite/${token}`, { method: "DELETE" });
    if (res.ok) setInvitations((prev) => prev.filter((i) => i.token !== token));
  }

  async function changeRole(user: User, role: "LEAD" | "MEMBER") {
    if (role === user.role) return;
    const label = role === "LEAD" ? "líder" : "miembro";
    if (!(await confirm(`¿Cambiar a ${user.name} a ${label}?`))) return;

    setRoleError(null);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setRoleError(body.error || "No se pudo cambiar el rol");
      return;
    }
    const updated = await res.json();
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">Miembros</h2>
        <ul className="space-y-2">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex items-center justify-between border border-line bg-card px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line-strong bg-paper text-xs font-semibold text-ink-soft">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm text-ink">{user.name}</p>
                  <p className="text-xs text-ink-faint">{user.email}</p>
                </div>
              </div>
              {viewerIsLead ? (
                <select
                  value={user.role}
                  onChange={(e) => changeRole(user, e.target.value as "LEAD" | "MEMBER")}
                  className="field !w-auto py-1 text-xs"
                >
                  <option value="MEMBER">Miembro</option>
                  <option value="LEAD">Líder</option>
                </select>
              ) : (
                <span className="tag border border-line-strong text-ink-soft">
                  {user.role === "LEAD" ? "Líder" : "Miembro"}
                </span>
              )}
            </li>
          ))}
        </ul>
        {roleError && <p className="mt-2 text-sm font-medium text-rust">{roleError}</p>}
      </div>

      {invitations.length > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Invitaciones pendientes
          </h2>
          <ul className="space-y-2">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between border border-dashed border-line-strong bg-paper px-3.5 py-2.5"
              >
                <div>
                  <p className="text-sm text-ink">{inv.name}</p>
                  <p className="text-xs text-ink-faint">
                    {inv.email} · expira el {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => cancelInvite(inv.token)} className="text-xs text-ink-faint hover:text-rust">
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showForm ? (
        <form onSubmit={sendInvite} className="surface-card space-y-3 p-4">
          <input
            required
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field"
          />
          <select value={role} onChange={(e) => setRole(e.target.value as "MEMBER" | "LEAD")} className="field">
            <option value="MEMBER">Miembro</option>
            <option value="LEAD">Líder</option>
          </select>

          {error && <p className="text-sm font-medium text-rust">{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="btn-primary">
              {sending ? "Enviando invitación..." : "Enviar invitación"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowForm(true)} className="btn-ghost">
          + Invitar por email
        </button>
      )}

      {notice && <p className="text-sm font-medium text-moss">{notice}</p>}
    </div>
  );
}
