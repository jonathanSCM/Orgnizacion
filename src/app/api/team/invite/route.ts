import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, inviteSchema } from "@/lib/validation";
import { sendEmail, inviteEmailHtml } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/baseUrl";

const EXPIRATION_DAYS = 7;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const invitations = await prisma.invitation.findMany({
    where: { acceptedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(invitations);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = parseBody(inviteSchema, await req.json());
  if ("error" in parsed) return parsed.error;
  const { name, email, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 400 });
  }

  const existingInvite = await prisma.invitation.findFirst({
    where: { email, acceptedAt: null, expiresAt: { gt: new Date() } },
  });
  if (existingInvite) {
    return NextResponse.json({ error: "Ya hay una invitación pendiente para ese email" }, { status: 400 });
  }

  const token = randomBytes(32).toString("hex");
  const invitation = await prisma.invitation.create({
    data: {
      name,
      email,
      role: role || "MEMBER",
      token,
      expiresAt: new Date(Date.now() + EXPIRATION_DAYS * 24 * 60 * 60 * 1000),
      invitedById: session.user.id,
    },
  });

  const acceptUrl = `${getBaseUrl()}/invite/${token}`;
  await sendEmail({
    to: email,
    subject: "Te invitaron al Panel de Organización",
    html: inviteEmailHtml(name, acceptUrl),
  });

  return NextResponse.json(invitation, { status: 201 });
}
