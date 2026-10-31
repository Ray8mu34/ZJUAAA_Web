/** Stable identifiers: saved selections must survive future artwork revisions. */
export const HOME_ARTWORKS = [
  { value: "day-night", number: "01", label: "昼夜交界", mobilePosition: "76% 50%" },
  { value: "study-02", number: "02", label: "倒悬的地平线", mobilePosition: "48% 50%" },
  { value: "study-03", number: "03", label: "横越光带的长桥", mobilePosition: "68% 50%" },
  { value: "study-04", number: "04", label: "一半天空一半倒影", mobilePosition: "59% 50%" },
  { value: "study-05", number: "05", label: "光与暗的裂谷", mobilePosition: "50% 50%" },
  { value: "study-06", number: "06", label: "沉静的单一路径", mobilePosition: "25% 50%" },
  { value: "study-07", number: "07", label: "几何月光留白", mobilePosition: "78% 50%" },
  { value: "study-08", number: "08", label: "反常色彩的天顶走廊", mobilePosition: "50% 50%" },
  { value: "study-09", number: "09", label: "无重力的远行路径", mobilePosition: "57% 50%" },
  { value: "study-10", number: "10", label: "展开成世界的一页", mobilePosition: "61% 50%" },
  { value: "study-11", number: "11", label: "不属于地球的彩色聚落", mobilePosition: "57% 50%" },
  { value: "study-12", number: "12", label: "圆形开口后的另一个天空", mobilePosition: "68% 50%" },
  { value: "study-13", number: "13", label: "非具象的星空色块", mobilePosition: "58% 50%" },
  { value: "study-14", number: "14", label: "柔软的陌生地貌", mobilePosition: "61% 50%" },
  { value: "study-15", number: "15", label: "负空间里的两重宇宙", mobilePosition: "66% 50%" },
  { value: "study-16", number: "16", label: "一整个形状就是夜空", mobilePosition: "44% 50%" },
  { value: "study-17", number: "17", label: "被剪开的天空", mobilePosition: "58% 50%" },
  { value: "study-18", number: "18", label: "透明色域的天体穿行", mobilePosition: "57% 50%" },
  { value: "study-19", number: "19", label: "会呼吸的几何形态", mobilePosition: "50% 50%" },
  { value: "study-20", number: "20", label: "几何自然与静谧星野", mobilePosition: "70% 50%" }
] as const;

export function getHomeArtwork(value: unknown) {
  return HOME_ARTWORKS.find((artwork) => artwork.value === value);
}
