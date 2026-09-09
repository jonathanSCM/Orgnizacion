import { Resend } from "resend";

function getClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const client = getClient();
  const from = process.env.MAIL_FROM || "Panel de Organización <onboarding@resend.dev>";

  if (!client) {
    console.log(`[mailer] RESEND_API_KEY no configurada. Correo NO enviado a ${to}: "${subject}"`);
    return;
  }

  const { error } = await client.emails.send({ from, to, subject, html });
  if (error) {
    console.error(`[mailer] Error enviando correo a ${to}:`, error);
  }
}

function emailShell(title: string, bodyHtml: string): string {
  return `
  <div style="font-family: Georgia, serif; background:#f3ede0; padding: 32px; color:#211a12;">
    <div style="max-width: 480px; margin: 0 auto; background:#fffdf7; border:1px solid #ded2b6; padding: 28px;">
      <div style="width:28px;height:28px;background:#b8461c;color:#fffdf7;display:flex;align-items:center;justify-content:center;font-weight:600;margin-bottom:16px;">P</div>
      <h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>
      <div style="font-family: Arial, sans-serif; font-size:14px; line-height:1.6; color:#6b6152;">
        ${bodyHtml}
      </div>
    </div>
  </div>`;
}

function buttonHtml(url: string, label: string): string {
  return `<p style="margin:20px 0;"><a href="${url}" style="background:#b8461c;color:#fffdf7;padding:10px 18px;text-decoration:none;font-family:Arial,sans-serif;font-weight:600;font-size:14px;display:inline-block;">${label}</a></p>
  <p style="font-size:12px;color:#a89d89;word-break:break-all;">${url}</p>`;
}

export function inviteEmailHtml(name: string, acceptUrl: string): string {
  return emailShell(
    "Te invitaron al Panel de Organización",
    `<p>Hola ${name},</p>
     <p>Te invitaron a unirte al equipo en el Panel de Organización. Hacé clic para crear tu contraseña y entrar:</p>
     ${buttonHtml(acceptUrl, "Aceptar invitación")}
     <p>Este link expira en 7 días. Si no esperabas esta invitación, podés ignorar este correo.</p>`
  );
}

export function resetPasswordEmailHtml(name: string, resetUrl: string): string {
  return emailShell(
    "Restablecé tu contraseña",
    `<p>Hola ${name},</p>
     <p>Pediste restablecer tu contraseña del Panel de Organización. Hacé clic para elegir una nueva:</p>
     ${buttonHtml(resetUrl, "Restablecer contraseña")}
     <p>Este link expira en 1 hora. Si no pediste esto, podés ignorar este correo — tu contraseña actual sigue siendo válida.</p>`
  );
}
