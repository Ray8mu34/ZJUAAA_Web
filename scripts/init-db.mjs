import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const dbPath = path.resolve(projectRoot, "prisma", "dev.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS AdminUser (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    displayName TEXT NOT NULL,
    passwordHash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    lastLoginAt DATETIME,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS SiteSetting (
    id TEXT PRIMARY KEY,
    siteNameZh TEXT NOT NULL DEFAULT '浙江大学学生天文爱好者协会',
    siteNameEn TEXT NOT NULL DEFAULT 'Zhejiang University Astronomical Amateur Association',
    heroTitleZh TEXT NOT NULL DEFAULT '你好，我们是浙江大学学生天文爱好者协会',
    heroTitleEn TEXT NOT NULL DEFAULT 'Hello, There is ZJUAAA HOME',
    heroSubtitleZh TEXT NOT NULL DEFAULT '追逐星辰的浙大人',
    heroSubtitleEn TEXT NOT NULL DEFAULT 'Star gazers based in ZJU',
    manifestoZh TEXT NOT NULL DEFAULT '由此，上达群星',
    manifestoEn TEXT NOT NULL DEFAULT 'Per Aspera Ad Astra.',
    primaryButtonZh TEXT NOT NULL DEFAULT '社团概览',
    primaryButtonEn TEXT NOT NULL DEFAULT 'View All Works',
    primaryButtonHref TEXT NOT NULL DEFAULT '/about',
    secondaryButtonZh TEXT NOT NULL DEFAULT '加入我们',
    secondaryButtonEn TEXT NOT NULL DEFAULT 'Join Us',
    secondaryButtonHref TEXT NOT NULL DEFAULT '/join-us',
    joinFormUrl TEXT NOT NULL DEFAULT 'https://example.com/join',
    contactFormUrl TEXT NOT NULL DEFAULT 'https://example.com/contact',
    bilibiliUrl TEXT NOT NULL DEFAULT 'https://space.bilibili.com/',
    heroImagePath TEXT,
    logoImagePath TEXT,
    wechatLabel TEXT NOT NULL DEFAULT 'ZJUAAA_',
    qqLabel TEXT NOT NULL DEFAULT '3389651066',
    contactEmail TEXT NOT NULL DEFAULT 'contact@example.com',
    addressZh TEXT NOT NULL DEFAULT '浙江省杭州市西湖区三墩镇余杭塘路866号浙江大学紫金港校区东四教学楼502-1',
    addressEn TEXT NOT NULL DEFAULT 'Room 502-1, Teaching Building East 4, Zijingang Campus, Zhejiang University',
    aboutIntroZh TEXT NOT NULL DEFAULT '浙江大学学生天文爱好者协会成立于2002年，是浙江大学学术科技类社团。我们围绕天文、科普和公益三大主题，持续组织观星、课程、讲座与科普传播。',
    aboutIntroEn TEXT NOT NULL DEFAULT 'ZJUAAA was founded in 2002 as an academic student association focused on astronomy, science communication, and public engagement.',
    academicDeptZh TEXT NOT NULL DEFAULT '学术部负责观测器材、天文课程、内部知识分享与专业活动支持，是社团最硬核的内容力量。',
    publicDeptZh TEXT NOT NULL DEFAULT '公关部负责大型活动策划、对外联络与项目推进，承担社团组织与协调的核心工作。',
    mediaDeptZh TEXT NOT NULL DEFAULT '宣传部负责平面、视频、图文与多平台传播，把星空带到更多人眼前。',
    joinIntroZh TEXT NOT NULL DEFAULT '无论你是刚接触天文的新同学，还是已经开始观测与拍摄的爱好者，都欢迎加入我们。',
    joinBenefitsZh TEXT NOT NULL DEFAULT '会员可优先参与观星活动、加入知识分享群、获取活动信息与社团周边。',
    joinPosterNoteZh TEXT NOT NULL DEFAULT '这里将展示纳新海报、部门介绍和第三方报名入口。',
    alumniNamesZh TEXT NOT NULL DEFAULT '历届成员名单可在此维护，每行一个姓名。',
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS MediaAsset (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'shared',
    filePath TEXT NOT NULL,
    mimeType TEXT NOT NULL,
    altZh TEXT,
    altEn TEXT,
    width INTEGER,
    height INTEGER,
    fileSize INTEGER,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS KnowledgePost (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    titleZh TEXT NOT NULL,
    titleEn TEXT,
    summaryZh TEXT,
    summaryEn TEXT,
    author TEXT NOT NULL,
    coverImagePath TEXT,
    externalUrl TEXT,
    markdownZh TEXT NOT NULL DEFAULT '',
    markdownEn TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    isFeatured INTEGER NOT NULL DEFAULT 0,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    publishedAt DATETIME,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ManualCategory (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    titleZh TEXT NOT NULL,
    summaryZh TEXT NOT NULL DEFAULT '',
    coverImagePath TEXT,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    isVisible INTEGER NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ManualChapter (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    categoryId TEXT NOT NULL,
    chapterNo TEXT NOT NULL,
    titleZh TEXT NOT NULL,
    titleEn TEXT,
    author TEXT,
    summaryZh TEXT,
    coverImagePath TEXT,
    markdownZh TEXT NOT NULL DEFAULT '',
    markdownEn TEXT,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES ManualCategory(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ActivityNotice (
    id TEXT PRIMARY KEY,
    titleZh TEXT NOT NULL,
    titleEn TEXT,
    summaryZh TEXT,
    summaryEn TEXT,
    coverImagePath TEXT,
    locationZh TEXT,
    locationEn TEXT,
    externalUrl TEXT,
    startAt DATETIME,
    endAt DATETIME,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS AstroPhoto (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    titleZh TEXT NOT NULL,
    titleEn TEXT,
    photographer TEXT NOT NULL,
    imagePath TEXT,
    descriptionZh TEXT,
    descriptionEn TEXT,
    skyRegionZh TEXT,
    skyRegionEn TEXT,
    locationZh TEXT,
    locationEn TEXT,
    equipmentMainLens TEXT,
    equipmentCamera TEXT,
    equipmentMount TEXT,
    equipmentFilter TEXT,
    equipmentSoftware TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log(`Initialized SQLite database at ${dbPath}`);
db.close();
