import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminSecurityConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, "..", "config", "admin-security.json"), "utf8")
);

function assertAdminPasswordLength(password) {
  if (password.length < adminSecurityConfig.minAdminPasswordLength) {
    throw new Error(`管理员密码至少需要 ${adminSecurityConfig.minAdminPasswordLength} 位。`);
  }
}

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "change-this-password";
  const displayName = process.env.ADMIN_DISPLAY_NAME || "ZJUAAA Admin";

  assertAdminPasswordLength(password);

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
