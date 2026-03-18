import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "change-this-password";
  const displayName = process.env.ADMIN_DISPLAY_NAME || "ZJUAAA Admin";

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    await prisma.adminUser.update({
      where: { username },
      data: {
        displayName,
        passwordHash,
        status: "ACTIVE"
      }
    });
    console.log(`Updated admin user: ${username}`);
  } else {
    await prisma.adminUser.create({
      data: {
        username,
        displayName,
        passwordHash
      }
    });
    console.log(`Created admin user: ${username}`);
  }

  await prisma.siteSetting.upsert({
    where: { id: "site" },
    create: { id: "site" },
    update: {}
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
