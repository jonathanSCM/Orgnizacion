import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_STATUSES = [
  { name: "Pendiente", color: "#9a8f7a", order: 0 },
  { name: "En progreso", color: "#35506b", order: 1 },
  { name: "Necesita revisión", color: "#c1911f", order: 2 },
  { name: "En revisión", color: "#7c5cbf", order: 3 },
  { name: "Pausado", color: "#b8461c", order: 4 },
  { name: "En producción", color: "#56684a", order: 5 },
  { name: "Completado", color: "#2f6f62", order: 6 },
];

async function main() {
  for (const status of DEFAULT_STATUSES) {
    await prisma.statusOption.upsert({
      where: { name: status.name },
      update: {},
      create: status,
    });
  }

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log("No hay usuarios todavía: entrá a /register para crear el primer admin.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
