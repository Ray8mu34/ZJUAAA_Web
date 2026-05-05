import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCategories = [
  {
    slug: "observation",
    titleZh: "观测手册",
    summaryZh: "从入门到实践的观测指南，帮助你迈出天文观测的第一步。",
    sortOrder: 1,
    isVisible: true
  },
  {
    slug: "astronomy-intro",
    titleZh: "天文学入门",
    summaryZh: "天文学基础知识，适合零基础同学快速建立天文知识框架。",
    sortOrder: 2,
    isVisible: true
  },
  {
    slug: "mechanisms",
    titleZh: "物理机制",
    summaryZh: "深入理解天文现象背后的物理原理。",
    sortOrder: 3,
    isVisible: true
  },
  {
    slug: "history",
    titleZh: "天文学史",
    summaryZh: "回顾人类认识宇宙的历程，了解天文学发展的关键节点。",
    sortOrder: 4,
    isVisible: true
  },
  {
    slug: "questions",
    titleZh: "问题导向专题",
    summaryZh: "以问题为切入点，探讨天文学中的经典与前沿问题。",
    sortOrder: 5,
    isVisible: true
  },
  {
    slug: "cards",
    titleZh: "知识卡片库",
    summaryZh: "碎片化的天文知识卡片，适合快速阅读与查阅。",
    sortOrder: 6,
    isVisible: true
  }
];

async function main() {
  console.log("Seeding default manual categories...");

  for (const category of defaultCategories) {
    const existing = await prisma.manualCategory.findUnique({
      where: { slug: category.slug }
    });

    if (existing) {
      await prisma.manualCategory.update({
        where: { slug: category.slug },
        data: category
      });
      console.log(`Updated category: ${category.titleZh}`);
    } else {
      await prisma.manualCategory.create({
        data: category
      });
      console.log(`Created category: ${category.titleZh}`);
    }
  }

  console.log("Done seeding categories.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
