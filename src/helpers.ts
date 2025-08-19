import { ContractFormData } from "./types";

export const toTwo = (n: number) =>
  Number.isFinite(n) ? Number(n).toFixed(2) : "0.00";

export function parseYMD(d: string): Date | null {
  if (!d) return null;
  const [y, m, day] = d.split("-").map(Number);
  if (!y || !m || !day) return null;
  return new Date(y, m - 1, day);
}

export function diffDays(from: string, to: string): number {
  const a = parseYMD(from);
  const b = parseYMD(to);
  if (!a || !b) return 0;
  // strip time
  a.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24))) || 1;
}

export function computeTotalAmount(d: ContractFormData): number {
  if (typeof d.amount === "number" && !Number.isNaN(d.amount)) return d.amount;
  const days = d.noOfDays || diffDays(d.dateOut, d.dateDue) || 1;
  const daily = Number(d.carDailyRate) || 0;
  return Math.max(0, days * daily);
}
