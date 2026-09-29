import { MEALS } from "./types";
import type { Meal, Opt, Snapshot } from "./types";

export type Slot = { kind: "pick"; item: Opt } | { kind: "tie" } | { kind: "empty" };

export function ranked<T extends Opt>(list: T[]): T[] {
  return list.filter((o) => o.votes > 0).sort((a, b) => b.votes - a.votes || a.sort - b.sort);
}

/**
 * Picks the top `n` by votes. Never random.
 * If a tie sits exactly on the cut-off line, the unresolved slots are marked "tie"
 * and the tied options are returned so people can vote again (runoff).
 */
export function pickSlots(list: Opt[], n: number): { slots: Slot[]; tie: Opt[] | null } {
  const r = ranked(list);
  if (r.length > n && r[n - 1].votes === r[n].votes) {
    const boundary = r[n - 1].votes;
    const sure = r.filter((o) => o.votes > boundary);
    const tie = r.filter((o) => o.votes === boundary);
    const slots: Slot[] = Array.from({ length: n }, (_, i) =>
      i < sure.length ? { kind: "pick", item: sure[i] } : { kind: "tie" }
    );
    return { slots, tie };
  }
  const slots: Slot[] = Array.from({ length: n }, (_, i) => (r[i] ? { kind: "pick", item: r[i] } : { kind: "empty" }));
  return { slots, tie: null };
}

export interface PlanRow { icon: string; label: string; slot: Slot }
export interface PlanDay { title: string; rows: PlanRow[] }
export interface PlanTie { label: string; scope: Meal | "places"; options: Opt[] }
export interface Plan { days: PlanDay[]; ties: PlanTie[] }

export function buildPlan(s: Snapshot): Plan {
  const b = pickSlots(s.meals.breakfast, 3);
  const l = pickSlots(s.meals.lunch, 3);
  const d = pickSlots(s.meals.dinner, 2);
  const p = pickSlots(s.locations, 5);

  const row = (icon: string, label: string, slot: Slot): PlanRow => ({ icon, label, slot });
  const days: PlanDay[] = [
    {
      title: "روز اول",
      rows: [row("🍳", "صبحانه", b.slots[0]), row("📍", "مکان", p.slots[0]), row("🍗", "ناهار", l.slots[0]), row("📍", "برنامه عصر", p.slots[1]), row("🌙", "شام", d.slots[0])],
    },
    {
      title: "روز دوم",
      rows: [row("🍳", "صبحانه", b.slots[1]), row("📍", "مکان", p.slots[2]), row("🍗", "ناهار", l.slots[1]), row("📍", "برنامه عصر", p.slots[3]), row("🌙", "شام", d.slots[1])],
    },
    {
      title: "روز سوم",
      rows: [row("🍳", "صبحانه", b.slots[2]), row("📍", "مکان", p.slots[4]), row("🍗", "ناهار", l.slots[2])],
    },
  ];

  const ties: PlanTie[] = [];
  if (b.tie) ties.push({ label: "🍳 صبحانه", scope: "breakfast", options: b.tie });
  if (l.tie) ties.push({ label: "🍗 ناهار", scope: "lunch", options: l.tie });
  if (d.tie) ties.push({ label: "🌙 شام", scope: "dinner", options: d.tie });
  if (p.tie) ties.push({ label: "📍 مکان‌ها", scope: "places", options: p.tie });
  return { days, ties };
}

const slotText = (s: Slot) => (s.kind === "pick" ? s.item.name : s.kind === "tie" ? "⚖️ مساوی شده" : "— هنوز مشخص نشده");

export function resultsText(s: Snapshot): string {
  const lines: string[] = [`🗼 سفر تهران | نتایج`, ``, `👥 شرکت‌کنندگان: ${s.count} نفر`];
  for (const m of MEALS) {
    lines.push(``, `${m.emoji} ${m.label}`);
    const top = ranked(s.meals[m.key]).slice(0, 3);
    if (!top.length) lines.push("هنوز رأیی ثبت نشده");
    for (const o of top) lines.push(`${o.name} — ${o.percent}%`);
  }
  lines.push(``, `📍 مکان‌ها`);
  const places = ranked(s.locations).slice(0, 3);
  if (!places.length) lines.push("هنوز رأیی ثبت نشده");
  for (const o of places) lines.push(`${o.name} — ${o.percent}%`);
  return lines.join("\n");
}

export function planText(s: Snapshot): string {
  const plan = buildPlan(s);
  const lines: string[] = [`✈️ برنامه سفر تهران`];
  for (const day of plan.days) {
    lines.push(``, `📅 ${day.title}`);
    for (const r of day.rows) lines.push(`${r.icon} ${r.label}: ${slotText(r.slot)}`);
  }
  for (const t of plan.ties) {
    lines.push(``, `⚖️ ${t.label}: بین این گزینه‌ها مساوی شده`, t.options.map((o) => o.name).join(" / "));
  }
  return lines.join("\n");
}
