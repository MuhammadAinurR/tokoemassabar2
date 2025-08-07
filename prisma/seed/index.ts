const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  // Clear existing users
  await prisma.user.deleteMany({});

  // Create admin user
  await prisma.user.create({
    data: {
      username: "admin",
      password: await hash("admin4213", 12),
      role: "admin",
    },
  });

  // Create staff user
  await prisma.user.create({
    data: {
      username: "staff",
      password: await hash("staff1234", 12),
      role: "staff",
    },
  });
  await prisma.user.create({
    data: {
      username: "staff2",
      password: await hash("staff24321", 12),
      role: "staff",
    },
  });
  await prisma.user.create({
    data: {
      username: "staff3",
      password: await hash("staff12334", 12),
      role: "staff",
    },
  });

  console.log("Seed data inserted successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
