// Isolated visual QA sandbox. Never uses DATABASE_URL from the caller or .env.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, spawn } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DatabaseSync } from 'node:sqlite';
import { ensureDesignQAMedia } from './design-qa-media.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.env.NODE_ENV === 'production') throw new Error('Design QA is development only.');
const mode = process.argv[2] || 'start';
if (!['start', 'seed', 'serve', 'test', 'build'].includes(mode)) throw new Error('Unknown QA command.');
const state = process.argv.includes('--empty') ? 'empty' : process.argv.includes('--sparse') ? 'sparse' : 'rich';
const dir = path.join(root, '.design-qa');
await fs.mkdir(dir, { recursive: true });
const databaseUrl = `file:${path.join(dir, 'design.db').replaceAll('\\', '/')}`;
const env = { ...process.env, NODE_ENV: 'development', DATABASE_URL: databaseUrl,
  DESIGN_QA: '1', AUTH_SECRET: 'local-design-qa-only-not-a-production-secret',
  AUTH_TRUST_HOST: 'true', INTERNAL_AUTH_SECRET: 'local-design-qa-internal',
  INTERNAL_USERNAME: 'design', INTERNAL_PASSWORD: 'design-qa-only',
  UPLOAD_DIR: path.join(dir, 'uploads'), INTERNAL_FILE_DIR: path.join(dir, 'internal-files'), AUDIT_LOG_DIR: path.join(dir, 'logs') };

if (mode !== 'serve' && mode !== 'test' && mode !== 'build') {
  const mediaDirectory = path.join(root, 'tests/fixtures/design-qa/media');
  await ensureDesignQAMedia(root, mediaDirectory);
  // Prisma's Windows schema engine needs an existing SQLite file here.
  new DatabaseSync(path.join(dir, 'design.db')).close();
  const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', 'db', 'push', '--force-reset', '--skip-generate'], { cwd: root, env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
  await fs.mkdir(env.UPLOAD_DIR, { recursive: true });
  await fs.mkdir(env.INTERNAL_FILE_DIR, { recursive: true });
  await fs.cp(mediaDirectory, path.join(env.UPLOAD_DIR, 'design-qa'), { recursive: true });
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const image = i => `/uploads/design-qa/sky-${i % 6}.jpg`;
  const fixed = new Date('2026-09-01T12:00:00+08:00');
  const published = { status: 'PUBLISHED', createdAt: fixed, updatedAt: fixed };
  const titles = ['月面的明暗之间', '从一颗恒星的颜色，读懂它的温度与一生', '秋夜认星', '为什么城市的夜空越来越亮：从校园出发理解光污染与暗夜保护', '第一次用双筒望远镜看星空', '银河并不是一条河', '木星与它的四颗大卫星', '深空摄影入门：从计划、对极轴到第一张叠加图像', '追踪流星雨', '当月亮走进地球的影子'];
  const summaries = ['沿着晨昏线，观察环形山与月海。', '星光穿过遥远的空间来到我们眼前，也带来了温度、成分与演化阶段的信息。本文从肉眼可见的星色出发，介绍如何把一次观星变成有记录、有问题的观察。', '带上一张星图，在熟悉的校园里寻找属于这个季节的星座。'];
  const markdown = '# 开始观测之前\n\n观星不需要昂贵的器材。先熟悉方向、天气和可见的星座，再选择适合自己的观测目标。\n\n## 选择时间与地点\n\n避开路灯直射，给眼睛二十分钟适应黑暗。记录云量、透明度和月相，并与同伴约定集合时间。\n\n> 观测太阳必须使用专用、安全的太阳滤镜，切勿直接通过望远镜看太阳。\n\n## 器材检查\n\n1. 检查脚架锁紧与平衡。\n2. 从低倍目镜开始寻找目标。\n3. 用笔记记录观测，不必急着拍照。\n\n| 目标 | 推荐工具 | 观察重点 |\n| --- | --- | --- |\n| 月亮 | 双筒或小型望远镜 | 晨昏线附近地形 |\n| 木星 | 小型望远镜 | 卫星位置变化 |\n\n## 放大倍率\n\n倍率由主镜和目镜焦距决定：$M = F / f$。更高的倍率需要更稳定的大气条件。\n\n## 留下一份观测记录\n\n记录日期、地点、器材与天气；画下看到的形状，再与下一次的观察比较。持续的记录，比一次完美的照片更能帮助我们理解天空。';
  await db.adminUser.create({ data: { username: 'design', displayName: '设计验收管理员', passwordHash: await bcrypt.hash('design-qa-only', 10) } });
  await db.siteSetting.create({ data: { id: 'site', logoImagePath: '/uploads/design-qa/logo.png', knowledgeIntroZh: '从身边的天象出发，理解更远的宇宙。', activitiesIntroZh: '一起观星、学习，也记录每一次相聚。', galleryIntroZh: '镜头里的星云、月面与漫长星夜。', manualIntroZh: '从认星到观测，社团共同整理的学习与实践记录。', internalIntroZh: '社团文件、宣传作品与共同记忆。', contactEmail: 'design-qa@example.invalid', wechatLabel: '天文社演示账号', qqLabel: '开发验收数据', joinFormUrl: '/contact', contactFormUrl: '/contact', contactImagePrimaryPath: image(0), contactImageSecondaryPath: image(1), aboutGalleryImagePaths: state === 'empty' ? '' : Array.from({length: state === 'sparse' ? 1 : 6}, (_,i)=>image(i)).join('\n'), alumniGroupsJson: JSON.stringify(state === 'empty' ? [] : [{ year: '2025', members: ['星禾','望舒','知远','云川','南星','清和','沐辰'].slice(0,state === 'sparse' ? 1 : 7).map((name,i)=>({ name, role: ['学术部','公关部 · 观测活动协调','宣传部'][i%3] })) }, {year:'2024',members:[{name:'山月',role:'学术部'}]}]) } });
  if (state !== 'empty') {
    for (let i=0;i<(state === 'sparse' ? 1 : 10);i++) await db.knowledgePost.create({data:{...published,slug:`sky-notes-${i}`,titleZh:titles[i],author:i%3===0?'天文课程与观测记录整理小组':'星禾',summaryZh:summaries[i%3],coverImagePath:i===8?null:image(i),markdownZh:markdown,isFeatured:i<5,sortOrder:i,publishedAt:new Date(fixed.getTime()-i*86400000*9)}});
    for (let i=0;i<(state === 'sparse' ? 1 : 18);i++) await db.astroPhoto.create({data:{...published,slug:`night-${i}`,titleZh:['月面','三角座星系','灵魂星云：冬夜里的恒星诞生地','猎户座大星云','玫瑰星云','月球南部高地'][i%6],photographer:i%2?'观测小组':'望舒',imagePath:image(i),descriptionZh:summaries[i%3],locationZh:i%2?'浙江杭州 · 校园观测点':'浙江省临安市天目山周边暗夜观测点',skyRegionZh:'秋冬星空',equipmentMainLens:'80 mm 折射望远镜',equipmentCamera:'制冷天文相机',equipmentMount:'赤道仪',equipmentFilter:i%2?'双窄带滤镜':null,equipmentSoftware:'图像校准、对齐与叠加'}});
    const activities=['秋夜观星','从校园走向暗夜：秋季天目山观测与星空摄影实践','望远镜入门工作坊','月面速写','英仙座流星雨观测记录','春季天文课程','校园科普开放夜'];
    for(let i=0;i<(state === 'sparse'?1:7);i++) await db.activityNotice.create({data:{...published,titleZh:activities[i],summaryZh:summaries[i%3],coverImagePath:i===0?'/uploads/design-qa/course.png':image(i),locationZh:i%2?'紫金港校区东四教学楼 502-1，雨天改为室内分享':'紫金港校区',startAt:i===2?null:new Date(i<2?`2026-10-${10+i}T19:00:00+08:00`:`2025-0${i+1}-12T19:00:00+08:00`),endAt:i===2?null:new Date(i<2?`2026-10-${10+i}T21:00:00+08:00`:`2025-0${i+1}-12T21:00:00+08:00`),isArchived:i>2}});
    for(let i=0;i<(state === 'sparse'?1:6);i++) {
      const category=await db.manualCategory.create({data:{id:`qa-category-${i}`,slug:`observing-${i}`,titleZh:['观测入门','望远镜与器材','天体摄影：计划与后期处理','天体物理基础','星图与观测记录','资料整理'][i],summaryZh:summaries[i%3],coverImagePath:i===5?null:'/uploads/design-qa/manual-'+i+'.png',sortOrder:i}});
      for(let j=0;j<(i===5?0:i===4?1:4);j++) await db.manualChapter.create({data:{...published,slug:`lesson-${i}-${j}`,categoryId:category.id,chapterNo:`${i+1}.${j+1}`,titleZh:titles[j],author:'天文课程小组',summaryZh:summaries[j%3],markdownZh:markdown,sortOrder:j}});
    }
    for(let i=0;i<(state === 'sparse'?1:4);i++) {
      await db.publicityWork.create({data:{...published,title:['秋季观星招募','月面观测手记','校园科普开放夜','星空摄影作品交流'][i],imagePath:image(i),author:'宣传小组',descriptionZh:summaries[i%3],workDate:fixed,sortOrder:i}});
      await db.internalStory.create({data:{...published,title:['等待云散','第一次找到土星','黎明前的观测','我们的星图'][i],content:summaries[i%3],source:'虚构观测日记',sortOrder:i}});
      const name=`observing-${i}.txt`;
      const content='设计验收用虚构资料：出发前检查天气、器材和集合安排。';
      await fs.writeFile(path.join(env.INTERNAL_FILE_DIR,name),content);
      await db.internalFile.create({data:{...published,title:['观测出行检查表','望远镜操作与归还记录','星空摄影课程笔记：曝光、校准与叠加','新成员观测指南'][i],description:summaries[i%3],category:'学习资料',originalName:name,storagePath:'internal-files/'+name,mimeType:'text/plain',fileSize:Buffer.byteLength(content),sortOrder:i}});
    }
  }
  await db.$disconnect();
  console.log(`Design QA ${state} restored: ${databaseUrl}`);
}
if (mode === 'build') {
  const buildEnv = {...env, NODE_ENV: 'production', DESIGN_QA_BUILD: '1'};
  for (const args of [['node_modules/prisma/build/index.js', 'generate'], ['node_modules/next/dist/bin/next', 'build']]) {
    const result = spawnSync(process.execPath, args, { cwd: root, env: buildEnv, stdio:'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
  }
  process.exit(0);
}
if (mode === 'test') {
  const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--config=playwright.design-qa.config.ts'], { cwd: root, env: {...env, ADMIN_USERNAME:'design', ADMIN_PASSWORD:'design-qa-only'}, stdio:'inherit' });
  process.exit(result.status || 0);
}
if(mode !== 'seed') {
  const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3200'],{cwd:root,env,stdio:'inherit'});
  child.on('exit',code=>process.exit(code || 0));
}
