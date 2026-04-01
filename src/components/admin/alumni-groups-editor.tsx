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

  return (
    <div className="admin-alumni-editor">
      <input name="alumniGroupsJson" type="hidden" value={serialized} />

      <div className="admin-alumni-head">
        <div>
          <span>历届成员名单</span>
          <p className="muted">按年份维护成员信息。每位成员可填写姓名、职务，并从媒体库选择单独照片。</p>
        </div>
        <button className="button-ghost" type="button" onClick={addGroup}>
          新增年份
        </button>
      </div>

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
