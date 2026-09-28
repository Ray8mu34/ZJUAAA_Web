export function shuffleItems<T>(items: T[]) {
  const shuffled = [...items];

  if (process.env.NODE_ENV === "development" && process.env.DESIGN_QA === "1") return shuffled;

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}
