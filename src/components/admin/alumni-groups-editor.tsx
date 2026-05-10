"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { getImageVariantUrl } from "@/lib/image-variants";

type MediaOption = {
  id: string;
  title: string;
  filePath: string;
  category?: string;
};

type AlumniMember = {
  name: string;
  role: string;
  photoPath?: string;
};

type AlumniGroup = {
  year: string;
  members: AlumniMember[];
};

function parseInitialValue(initialValue?: string | null): AlumniGroup[] {
  if (!initialValue?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(initialValue);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((group) => ({
        year: typeof group?.year === "string" ? group.year : "",
        members: Array.isArray(group?.members)
          ? group.members.map((member: { name?: string; role?: string; photoPath?: string }) => ({
              name: typeof member?.name === "string" ? member.name : "",
              role: typeof member?.role === "string" ? member.role : "",
              photoPath: typeof member?.photoPath === "string" ? member.photoPath : ""
            }))
          : []
      }))
      .filter((group) => group.year || group.members.length > 0);
  } catch {
    return [];
  }
}

export function AlumniGroupsEditor({
  initialValue,
  options
}: {
  initialValue?: string | null;
  options: MediaOption[];
}) {
  const [groups, setGroups] = useState<AlumniGroup[]>(() => parseInitialValue(initialValue));

  const serialized = useMemo(() => JSON.stringify(groups), [groups]);

  const updateGroup = (index: number, nextGroup: AlumniGroup) => {
    setGroups((current) => current.map((group, groupIndex) => (groupIndex === index ? nextGroup : group)));
  };

  const removeGroup = (index: number) => {
    setGroups((current) => current.filter((_, groupIndex) => groupIndex !== index));
  };

  const addGroup = () => {
    setGroups((current) => [...current, { year: "", members: [{ name: "", role: "", photoPath: "" }] }]);
  };

  const addMember = (groupIndex: number) => {
    setGroups((current) =>
      current.map((group, index) =>
        index === groupIndex ? { ...group, members: [...group.members, { name: "", role: "", photoPath: "" }] } : group
      )
    );
  };

  const updateMember = (groupIndex: number, memberIndex: number, nextMember: AlumniMember) => {
    setGroups((current) =>
      current.map((group, index) =>
        index === groupIndex
          ? {
              ...group,
              members: group.members.map((member, idx) => (idx === memberIndex ? nextMember : member))
            }
          : group
      )
    );
  };

  const removeMember = (groupIndex: number, memberIndex: number) => {
    setGroups((current) =>
      current.map((group, index) =>
        index === groupIndex
          ? { ...group, members: group.members.filter((_, idx) => idx !== memberIndex) }
          : group
      )
    );
  };

  const [bulkText, setBulkText] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  const handleBulkImport = () => {
    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) return;

    const newGroups = new Map<string, AlumniMember[]>();

    for (const line of lines) {
      // 只按前两个逗号/制表符拆分，第三个之后的内容保留为职务（支持顿号等分隔符）
      const firstSep = line.search(/[,\t，]/);
      if (firstSep === -1) continue;

      const secondSep = line.slice(firstSep + 1).search(/[,\t，]/);
      if (secondSep === -1) continue;

      const year = line.slice(0, firstSep).trim();
      const name = line.slice(firstSep + 1, firstSep + 1 + secondSep).trim();
      const role = line.slice(firstSep + 1 + secondSep + 1).trim();

      if (!year || !name) continue;

      if (!newGroups.has(year)) {
        newGroups.set(year, []);
      }
      newGroups.get(year)!.push({ name, role, photoPath: "" });
    }

    if (newGroups.size === 0) {
      alert("未解析到有效数据。请检查格式：年份,姓名,职务");
      return;
    }

    setGroups((current) => {
      const merged = new Map(current.map((g) => [g.year, [...g.members]]));

      for (const [year, members] of newGroups) {
        const existing = merged.get(year) || [];
        merged.set(year, [...existing, ...members]);
      }

      return Array.from(merged.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([year, members]) => ({ year, members }));
    });

    setBulkText("");
    setShowBulk(false);
  };

  return (
    <div className="admin-alumni-editor">
      <input name="alumniGroupsJson" type="hidden" value={serialized} />

      <div className="admin-alumni-head">
        <div>
          <span>历届成员名单</span>
          <p className="muted">按年份维护成员信息。每位成员可填写姓名、职务，并从媒体库选择单独照片。</p>
        </div>
        <div className="admin-alumni-inline-actions">
          <button className="button-ghost" type="button" onClick={() => setShowBulk(!showBulk)}>
            {showBulk ? "收起批量导入" : "批量导入"}
          </button>
          <button className="button-ghost" type="button" onClick={addGroup}>
            新增年份
          </button>
        </div>
      </div>

      {showBulk ? (
        <div className="admin-alumni-bulk">
          <label>
            <span>批量粘贴成员</span>
            <small className="muted">每行一个成员，格式：年份,姓名,职务（年份和姓名之间用逗号分隔，职务里的顿号会保留）</small>
            <textarea
              rows={6}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"2024,张三,会长\n2024,李四,学术部部长、宣传部部长\n2023,王五,学术部部长"}
            />
          </label>
          <button className="button-ghost" type="button" onClick={handleBulkImport}>
            导入
          </button>
        </div>
      ) : null}

      {groups.length === 0 ? (
        <div className="empty-state">还没有录入年份，点击“新增年份”开始填写。</div>
      ) : (
        <div className="admin-alumni-groups">
          {groups.map((group, groupIndex) => (
            <section className="admin-alumni-group" key={`group-${groupIndex}`}>
              <div className="admin-alumni-group-head">
                <label>
                  <span>年份</span>
                  <input
                    value={group.year}
                    onChange={(event) =>
                      updateGroup(groupIndex, {
                        ...group,
                        year: event.target.value
                      })
                    }
                    placeholder="例如 2024"
                  />
                </label>

                <div className="admin-alumni-inline-actions">
                  <button className="button-ghost" type="button" onClick={() => addMember(groupIndex)}>
                    新增成员
                  </button>
                  <button className="button-ghost danger-text" type="button" onClick={() => removeGroup(groupIndex)}>
                    删除年份
                  </button>
                </div>
              </div>

              <div className="admin-alumni-members">
                {group.members.length === 0 ? (
                  <div className="empty-state">这一年还没有成员，点击“新增成员”开始填写。</div>
                ) : (
                  group.members.map((member, memberIndex) => (
                    <div className="admin-alumni-member-card" key={`member-${groupIndex}-${memberIndex}`}>
                      <div className="admin-alumni-member-top">
                        <div className="admin-alumni-photo-preview">
                          {member.photoPath ? (
                            <Image alt={member.name || "成员照片"} fill sizes="120px" src={getImageVariantUrl(member.photoPath, "thumb")} />
                          ) : (
                            <span className="muted">未选择照片</span>
                          )}
                        </div>

                        <div className="admin-alumni-member-fields">
                          <div className="admin-form-grid">
                            <label>
                              <span>姓名</span>
                              <input
                                value={member.name}
                                onChange={(event) =>
                                  updateMember(groupIndex, memberIndex, {
                                    ...member,
                                    name: event.target.value
                                  })
                                }
                                placeholder="姓名"
                              />
                            </label>

                            <label>
                              <span>职务</span>
                              <input
                                value={member.role}
                                onChange={(event) =>
                                  updateMember(groupIndex, memberIndex, {
                                    ...member,
                                    role: event.target.value
                                  })
                                }
                                placeholder="例如 会长 / 宣传部部长"
                              />
                            </label>
                          </div>

                          <label>
                            <span>成员照片</span>
                            <select
                              className="admin-select"
                              value={member.photoPath || ""}
                              onChange={(event) =>
                                updateMember(groupIndex, memberIndex, {
                                  ...member,
                                  photoPath: event.target.value
                                })
                              }
                            >
                              <option value="">不设置照片，使用纯色背景</option>
                              {options.map((option) => (
                                <option key={option.id} value={option.filePath}>
                                  {option.title}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>

                      <div className="admin-alumni-inline-actions">
                        {member.photoPath ? (
                          <button
                            className="button-ghost"
                            type="button"
                            onClick={() =>
                              updateMember(groupIndex, memberIndex, {
                                ...member,
                                photoPath: ""
                              })
                            }
                          >
                            清空照片
                          </button>
                        ) : null}
                        <button
                          className="button-ghost danger-text"
                          type="button"
                          onClick={() => removeMember(groupIndex, memberIndex)}
                        >
                          删除成员
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
