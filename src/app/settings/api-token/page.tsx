import { requireSession } from "@/lib/session";
import Navbar from "@/components/Navbar";
import ApiTokenManager from "./ApiTokenManager";

export default async function ApiTokenPage() {
  const session = await requireSession();

  return (
    <div>
      <Navbar userName={session.user.name ?? session.user.email ?? ""} />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight text-ink">
          Token de API personal
        </h1>
        <p className="mb-7 text-sm text-ink-soft">
          Usalo para que un asistente de IA (Claude Code u otro) lea y actualice tus proyectos en tu nombre — desde
          la terminal, sin pasar por esta pantalla. Cualquier cambio hecho con el token queda en el historial como
          hecho por vos.
        </p>
        <ApiTokenManager userName={session.user.name ?? session.user.email ?? ""} />
      </main>
    </div>
  );
}
