"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type AlumniBrowserProps = {
  groups: Array<{
    year: string;
    members: Array<{
      name: string;
      role: string;
      photoPath?: string;
    }>;
  }>;
};

const TONES = ["tone-rose", "tone-blue", "tone-lime"] as const;

export function AlumniBrowser({ groups }: AlumniBrowserProps) {
  const [activeYear, setActiveYear] = useState(groups[0]?.year || "");
  const activeGroupIndex = useMemo(
    () => groups.findIndex((group) => group.year === activeYear),
    [activeYear, groups]
  );
  const activeGroup = groups[activeGroupIndex] || groups[0];
  const toneClass = TONES[(activeGroupIndex >= 0 ? activeGroupIndex : 0) % TONES.length];

  if (!activeGroup) {
    return null;
  }

  return (
    <div className="alumni-browser">
      <div className="alumni-year-tabs">
        {groups.map((group) => (
          <button
            key={group.year}
            className={group.year === activeGroup.year ? "alumni-year-button active" : "alumni-year-button"}
            type="button"
            onClick={() => setActiveYear(group.year)}
          >
            {group.year}
          </button>
        ))}
      </div>

      <div className="alumni-scroll-window">
        <div className="alumni-member-grid">
          {activeGroup.members.map((member) => (
            <article className="alumni-member-card" key={`${activeGroup.year}-${member.name}-${member.role}`}>
              {member.photoPath ? (
                <div className="alumni-member-photo">
                  <Image alt={member.name} fill sizes="240px" src={member.photoPath} />
                </div>
              ) : (
                <div className={`alumni-member-portrait ${toneClass}`} />
              )}
              <strong>{member.name}</strong>
              <p>{member.role}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
