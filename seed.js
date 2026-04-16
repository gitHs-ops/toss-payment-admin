const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: { role: "ADMIN" },
    create: { id: "admin-001", email: "admin@test.com", name: "관리자", role: "ADMIN" },
  });
  console.log("완료:", user.email);
}
main().catch(console.error).finally(() => prisma.$disconnect());
