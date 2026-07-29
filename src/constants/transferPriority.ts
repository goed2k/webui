export const TRANSFER_PRIORITY_OPTIONS = [0, 1, 2, 3, 4].map((v) => ({
  value: v,
  label: `P${v}`,
}));

export function transferPriorityLabel(
  priority?: number,
  label?: string,
): string {
  if (label) return label;
  if (priority !== undefined && priority !== null) return `P${priority}`;
  return "—";
}
