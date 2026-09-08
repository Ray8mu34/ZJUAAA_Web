export type AlumniGroup = {
  year: string;
  members: Array<{
    name: string;
    role: string;
    photoPath?: string;
  }>;
};

export function parseAboutGalleryPaths(raw?: string | null) {
  return (raw || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseAlumniGroups(raw?: string | null): AlumniGroup[] {
  if (!raw?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((group) => {
        const year = typeof group?.year === "string" ? group.year.trim() : "";
        const members = Array.isArray(group?.members)
          ? group.members
              .map((member: unknown) => {
                const item = member as { name?: unknown; role?: unknown; photoPath?: unknown };

                return {
                  name: typeof item?.name === "string" ? item.name.trim() : "",
                  role: typeof item?.role === "string" ? item.role.trim() : "",
                  photoPath: typeof item?.photoPath === "string" ? item.photoPath.trim() : ""
                };
              })
              .filter((member: { name: string }) => member.name)
          : [];

        return { year, members };
      })
      .filter((group) => group.year && group.members.length > 0);
  } catch {
    return [];
  }
}

function getYearSortValue(year: string) {
  const match = year.match(/\d{4}/);
  return match ? Number(match[0]) : Number.NEGATIVE_INFINITY;
}

export function sortAlumniGroups(groups: AlumniGroup[]) {
  return [...groups].sort((a, b) => {
    const yearDiff = getYearSortValue(b.year) - getYearSortValue(a.year);
    return yearDiff || b.year.localeCompare(a.year, "zh-CN", { numeric: true });
  });
}
