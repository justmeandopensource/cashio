/** Returns a Chakra color token based on how much of the budget is used. */
export function getBudgetStatusColor(spent: number | string, limit: number | string): string {
  const s = Number(spent);
  const l = Number(limit);
  if (l <= 0) return "green.400";
  if (s > l) return "red.400";
  const pct = (s / l) * 100;
  if (pct >= 90) return "red.400";
  if (pct >= 75) return "orange.400";
  return "green.400";
}
