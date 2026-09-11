"use client";

import Image from "next/image";
import { Plus, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { isGifImagePath } from "@/lib/image-format";
import { getImageVariantUrl } from "@/lib/image-variants";

type MediaOption = { id: string; title: string; filePath: string; category?: string };
type AlumniMember = { name: string; role: string; photoPath?: string };
type AlumniGroup = { year: string; members: AlumniMember[] };

function parseInitialValue(initialValue?: string | null): AlumniGroup[] {
  if (!initialValue?.trim()) return [];
  try {
    const parsed = JSON.parse(initialValue);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((group) => ({
      year: typeof group?.year === "string" ? group.year : "",
      members: Array.isArray(group?.members) ? group.members.map((member: AlumniMember) => ({
        name: typeof member?.name === "string" ? member.name : "",
        role: typeof member?.role === "string" ? member.role : "",
        photoPath: typeof member?.photoPath === "string" ? member.photoPath : ""
      })) : []
    })).filter((group) => group.year || group.members.length > 0);
  } catch { return []; }
}

export function AlumniGroupsEditor({ initialValue, options }: { initialValue?: string | null; options: MediaOption[] }) {
  const [groups, setGroups] = useState<AlumniGroup[]>(() => parseInitialValue(initialValue));
  const [activeIndex, setActiveIndex] = useState(0);
  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const activeGroup = groups[Math.min(activeIndex, Math.max(0, groups.length - 1))];
  const serialized = useMemo(() => JSON.stringify(groups), [groups]);

  function updateGroup(next: AlumniGroup) { setGroups((current) => current.map((group, index) => index === activeIndex ? next : group)); }
  function addGroup() { setGroups((current) => [...current, { year: "", members: [] }]); setActiveIndex(groups.length); }
  function removeGroup() { setGroups((current) => current.filter((_, index) => index !== activeIndex)); setActiveIndex((index) => Math.max(0, index - 1)); }
  function addMember() { if (activeGroup) updateGroup({ ...activeGroup, members: [...activeGroup.members, { name: "", role: "", photoPath: "" }] }); }
  function updateMember(memberIndex: number, next: AlumniMember) { if (activeGroup) updateGroup({ ...activeGroup, members: activeGroup.members.map((member, index) => index === memberIndex ? next : member) }); }
  function removeMember(memberIndex: number) { if (activeGroup) updateGroup({ ...activeGroup, members: activeGroup.members.filter((_, index) => index !== memberIndex) }); }

  function handleBulkImport() {
    const additions = new Map<string, AlumniMember[]>();
    for (const line of bulkText.split("\n").map((item) => item.trim()).filter(Boolean)) {
      const parts = line.split(/[,\t，]/); const year = parts.shift()?.trim(); const name = parts.shift()?.trim(); const role = parts.join("，").trim();
      if (!year || !name) continue;
      additions.set(year, [...(additions.get(year) || []), { name, role, photoPath: "" }]);
    }
    if (!additions.size) { alert("未解析到有效数据。请使用：年份,姓名,职务"); return; }
    setGroups((current) => {
      const merged = new Map(current.map((group) => [group.year, [...group.members]]));
      additions.forEach((members, year) => merged.set(year, [...(merged.get(year) || []), ...members]));
      return Array.from(merged, ([year, members]) => ({ year, members })).sort((a, b) => b.year.localeCompare(a.year));
    });
    setActiveIndex(0); setBulkText(""); setShowBulk(false);
  }

  return <div className="admin-alumni-workbench">
    <input name="alumniGroupsJson" type="hidden" value={serialized}/>
    <div className="admin-alumni-toolbar">
      <div className="admin-alumni-year-tabs" role="tablist" aria-label="历届成员年份">
        {groups.map((group, index) => <button className={index === activeIndex ? "active" : ""} key={`${group.year}-${index}`} type="button" role="tab" aria-selected={index === activeIndex} onClick={() => setActiveIndex(index)}>{group.year || "未命名届次"}<small>{group.members.length}</small></button>)}
      </div>
      <div className="admin-alumni-toolbar-actions">
        <button className="button-ghost" type="button" onClick={() => setShowBulk((value) => !value)}><Upload size={14}/> 批量导入</button>
        <button className="button-ghost" type="button" onClick={addGroup}><Plus size={14}/> 新增届次</button>
      </div>
    </div>

    {showBulk ? <div className="admin-alumni-bulk-panel"><label><span>批量粘贴</span><small className="muted">每行：年份,姓名,职务</small><textarea rows={5} value={bulkText} onChange={(event) => setBulkText(event.target.value)} placeholder={"2024,张三,会长\n2024,李四,学术部部长"}/></label><button className="button-ghost" type="button" onClick={handleBulkImport}>导入名单</button></div> : null}

    {!activeGroup ? <div className="empty-state">尚未创建届次。点击“新增届次”开始录入。</div> : <>
      <div className="admin-alumni-group-bar">
        <label><span>届次 / 年份</span><input value={activeGroup.year} onChange={(event) => updateGroup({ ...activeGroup, year: event.target.value })} placeholder="例如 2024"/></label>
        <span>{activeGroup.members.length} 位成员</span>
        <button className="button-ghost" type="button" onClick={addMember}><Plus size={14}/> 添加成员</button>
        <button className="button-ghost danger-text" type="button" onClick={removeGroup}><Trash2 size={14}/> 删除届次</button>
      </div>
      {activeGroup.members.length === 0 ? <div className="empty-state">本届暂无成员，点击“添加成员”开始录入。</div> : <div className="admin-alumni-wall">
        {activeGroup.members.map((member, memberIndex) => <article className="admin-alumni-tile" key={`${activeIndex}-${memberIndex}`}>
          <div className="admin-alumni-tile-photo">{member.photoPath ? <Image alt={member.name || "成员照片"} fill sizes="120px" src={isGifImagePath(member.photoPath) ? member.photoPath : getImageVariantUrl(member.photoPath, "thumb")} unoptimized={isGifImagePath(member.photoPath)}/> : <span>{member.name?.slice(0, 1) || "·"}</span>}</div>
          <div className="admin-alumni-tile-fields">
            <input aria-label="成员姓名" value={member.name} onChange={(event) => updateMember(memberIndex, { ...member, name: event.target.value })} placeholder="姓名"/>
            <input aria-label="成员职务" value={member.role} onChange={(event) => updateMember(memberIndex, { ...member, role: event.target.value })} placeholder="职务"/>
            <select className="admin-select" aria-label="成员照片" value={member.photoPath || ""} onChange={(event) => updateMember(memberIndex, { ...member, photoPath: event.target.value })}><option value="">无照片</option>{options.map((option) => <option key={option.id} value={option.filePath}>{option.title}</option>)}</select>
          </div>
          <button className="admin-alumni-remove" type="button" aria-label={`删除成员 ${member.name || memberIndex + 1}`} onClick={() => removeMember(memberIndex)}><Trash2 size={14}/></button>
        </article>)}
      </div>}
    </>}
  </div>;
}
