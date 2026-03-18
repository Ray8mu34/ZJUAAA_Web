import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "..", "prisma", "dev.db");

const db = new DatabaseSync(dbPath);

const columns = new Set(
  db
    .prepare("PRAGMA table_info('SiteSetting')")
    .all()
    .map((row) => row.name)
);

const additions = [
  ["heroImagePath", "TEXT"],
  ["logoImagePath", "TEXT"],
  ["cardTheme", "TEXT NOT NULL DEFAULT 'dark'"],
  ["contactEmail", "TEXT NOT NULL DEFAULT 'contact@example.com'"],
  [
    "aboutIntroZh",
    "TEXT NOT NULL DEFAULT '浙江大学学生天文爱好者协会成立于2002年，是浙江大学学术科技类社团。我们围绕天文、科普和公益三大主题，持续组织观星、课程、讲座与科普传播。'"
  ],
  [
    "aboutIntroEn",
    "TEXT NOT NULL DEFAULT 'ZJUAAA was founded in 2002 as an academic student association focused on astronomy, science communication, and public engagement.'"
  ],
  ["academicDeptZh", "TEXT NOT NULL DEFAULT '学术部负责观测器材、天文课程、内部知识分享与专业活动支持，是社团最硬核的内容力量。'"],
  ["publicDeptZh", "TEXT NOT NULL DEFAULT '公关部负责大型活动策划、对外联络与项目推进，承担社团组织与协调的核心工作。'"],
  ["mediaDeptZh", "TEXT NOT NULL DEFAULT '宣传部负责平面、视频、图文与多平台传播，把星空带到更多人眼前。'"],
  ["joinIntroZh", "TEXT NOT NULL DEFAULT '无论你是刚接触天文的新同学，还是已经开始观测与拍摄的爱好者，都欢迎加入我们。'"],
  ["joinBenefitsZh", "TEXT NOT NULL DEFAULT '会员可优先参与观星活动、加入知识分享群、获取活动信息与社团周边。'"],
  ["joinPosterNoteZh", "TEXT NOT NULL DEFAULT '这里将展示纳新海报、部门介绍和第三方报名入口。'"],
  ["alumniNamesZh", "TEXT NOT NULL DEFAULT '历届成员名单可在此维护，每行一个姓名。'"]
];

const mediaAssetAdditions = [["category", "TEXT NOT NULL DEFAULT 'shared'"]];

const contentTableAdditions = {
  KnowledgePost: [["coverImagePath", "TEXT"], ["externalUrl", "TEXT"]],
  ManualChapter: [["coverImagePath", "TEXT"], ["author", "TEXT"], ["summaryZh", "TEXT"]],
  ActivityNotice: [["coverImagePath", "TEXT"]],
  AstroPhoto: [["imagePath", "TEXT"]]
};

const mediaExisting = new Set(
  db
    .prepare("PRAGMA table_info('MediaAsset')")
    .all()
    .map((row) => row.name)
);

for (const [name, sql] of mediaAssetAdditions) {
  if (!mediaExisting.has(name)) {
    db.exec(`ALTER TABLE MediaAsset ADD COLUMN ${name} ${sql};`);
    console.log(`Added column ${name} to MediaAsset`);
  }
}

for (const [name, sql] of additions) {
  if (!columns.has(name)) {
    db.exec(`ALTER TABLE SiteSetting ADD COLUMN ${name} ${sql};`);
    console.log(`Added column ${name}`);
  }
}

for (const [table, tableColumns] of Object.entries(contentTableAdditions)) {
  const existing = new Set(
    db
      .prepare(`PRAGMA table_info('${table}')`)
      .all()
      .map((row) => row.name)
  );

  for (const [name, sql] of tableColumns) {
    if (!existing.has(name)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${sql};`);
      console.log(`Added column ${name} to ${table}`);
    }
  }
}

db.close();
console.log("Database schema sync completed.");
