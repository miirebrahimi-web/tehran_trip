"use client";
import { useState } from "react";
import { buildPlan, ranked } from "@/lib/plan";
import type { Slot } from "@/lib/plan";
import { CATEGORIES, MEALS } from "@/lib/types";
import type { Category, LocOpt, Meal, Opt, Runoff, Snapshot } from "@/lib/types";
import { Avatar, Bar, Modal, PageTitle, Segmented, Tag } from "./ui";

export type Tab = "home" | "food" | "places" | "people" | "results";

export interface Ctx {
  snap: Snapshot;
  meal: Meal;
  setMeal: (m: Meal) => void;
  runoff: Runoff | null;
  setRunoff: (r: Runoff | null) => void;
  go: (t: Tab) => void;
  voteFood: (id: string) => Promise<void>;
  addFood: (meal: Meal, name: string) => Promise<boolean>;
  voteLoc: (id: string, selected: boolean) => Promise<void>;
  addLoc: (name: string, category: Category) => Promise<boolean>;
  send: (type: "results" | "plan") => Promise<void>;
}

/* ------------------------------------------------------------------ */
/* The one memorable element: Alborz range + Milad Tower at dusk       */
/* ------------------------------------------------------------------ */
function Skyline() {
  return (
    <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-24 w-full" aria-hidden="true">
      <polygon fill="#14122b" fillOpacity=".38" points="0,120 0,78 38,52 66,68 118,26 170,66 214,42 262,74 312,46 356,70 400,52 400,120" />
      <polygon fill="#14122b" fillOpacity=".55" points="0,120 0,98 52,80 96,94 150,70 210,96 268,84 330,98 400,82 400,120" />
      <g fill="#14122b" fillOpacity=".8">
        <path d="M296 120 L299 64 L300.4 40 L301.6 40 L303 64 L306 120 Z" />
        <ellipse cx="301" cy="38" rx="11" ry="5.5" />
        <rect x="300.5" y="6" width="1" height="30" />
      </g>
    </svg>
  );
}

function Hero({ children, tall }: { children: React.ReactNode; tall?: boolean }) {
  return (
    <div className={`sunset relative mx-4 mt-4 overflow-hidden rounded-[28px] p-5 text-white shadow-lift ${tall ? "min-h-[300px]" : "min-h-[210px]"}`}>
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[#ffb020] opacity-40 blur-2xl" />
      <div className="relative">{children}</div>
      <Skyline />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Entry                                                                */
/* ------------------------------------------------------------------ */
export function Entry({ suggest, onSubmit }: { suggest: string; onSubmit: (name: string) => Promise<string | null> }) {
  const [name, setName] = useState(suggest);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ok = name.trim().length > 0 && !busy;

  const submit = async () => {
    if (!ok) return;
    setBusy(true);
    setErr("");
    const e = await onSubmit(name.trim());
    if (e) setErr(e);
    setBusy(false);
  };

  return (
    <div className="mx-auto min-h-screen max-w-md pb-10">
      <Hero tall>
        <p className="text-sm font-bold opacity-90">تهران | ۲ شب و ۳ روز</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight">سفر تهران ✈️</h1>
        <p className="mt-1 text-lg font-bold opacity-95">۲ شب | ۳ روز</p>
      </Hero>
      <div className="px-4 pt-6">
        <label htmlFor="name" className="mb-2 block text-xl font-extrabold">اسمت چیه؟</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          maxLength={40}
          placeholder="نام شما"
          className="min-h-[56px] w-full rounded-2xl border-2 border-line bg-card px-4 text-lg font-bold outline-none focus:border-[var(--tile)]"
        />
        {err && <p className="mt-2 text-sm font-bold text-brand">{err}</p>}
        <button
          onClick={submit}
          disabled={!ok}
          className="sunset mt-4 min-h-[56px] w-full rounded-2xl text-lg font-extrabold text-white shadow-lift transition active:scale-[0.98] disabled:opacity-40"
        >
          {busy ? "در حال ثبت…" : "ورود به سفر"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Home                                                                 */
/* ------------------------------------------------------------------ */
function StatusCard({ emoji, title, line, sub, done, onClick }: { emoji: string; title: string; line: string; sub?: string; done?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="min-h-[112px] rounded-[20px] border border-line bg-card p-4 text-right shadow-sm transition active:scale-[0.97]">
      <div className="text-2xl">{emoji}</div>
      <div className="mt-1 font-extrabold">{title}</div>
      <div className={`text-sm font-bold ${done ? "text-tile" : "text-mute"}`}>{line}</div>
      {sub && <div className="truncate text-xs text-mute">{sub}</div>}
    </button>
  );
}

export function Home({ c }: { c: Ctx }) {
  const { snap } = c;
  const me = snap.me!;
  const mine = snap.people.find((p) => p.isMe);
  const doneCount = mine?.done ?? 0;

  return (
    <div>
      <Hero>
        <p className="text-sm font-bold opacity-90">سلام {me.name} 👋</p>
        <h1 className="mt-1 text-3xl font-extrabold">سفر تهران</h1>
        <p className="font-bold opacity-95">۲ شب | ۳ روز</p>
        <span className="mt-3 inline-block rounded-full bg-white/25 px-3 py-1 text-sm font-bold">👥 {snap.count} نفر توی سفرن</span>
      </Hero>

      <div className="mx-4 mt-4 rounded-[20px] border border-line bg-card p-4">
        <div className="mb-2 flex items-center justify-between text-sm font-bold">
          <span>رأی‌های تو</span>
          <span className={doneCount === 4 ? "text-tile" : "text-mute"}>{doneCount} از ۴</span>
        </div>
        <Bar pct={(doneCount / 4) * 100} done={doneCount === 4} />
      </div>

      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        {MEALS.map((m) => {
          const chosen = snap.meals[m.key].find((o) => o.id === me.food[m.key]);
          return (
            <StatusCard
              key={m.key}
              emoji={m.emoji}
              title={m.label}
              line={chosen ? "✓ انتخاب شده" : "○ انتخاب نشده"}
              sub={chosen?.name}
              done={!!chosen}
              onClick={() => {
                c.setMeal(m.key);
                c.go("food");
              }}
            />
          );
        })}
        <StatusCard emoji="📍" title="مکان‌ها" line={me.places.length ? `${me.places.length} انتخاب` : "○ انتخاب نشده"} done={me.places.length > 0} onClick={() => c.go("places")} />
        <StatusCard emoji="👥" title="شرکت‌کنندگان" line={`${snap.count} نفر`} onClick={() => c.go("people")} />
        <StatusCard emoji="📊" title="نتایج" line="مشاهده نتایج و برنامه" onClick={() => c.go("results")} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Food                                                                 */
/* ------------------------------------------------------------------ */
function FoodRow({ o, selected, onPick }: { o: Opt; selected: boolean; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      className={`relative w-full overflow-hidden rounded-[20px] border-2 bg-card p-3 text-right transition active:scale-[0.98] ${selected ? "border-[var(--tile)]" : "border-line"}`}
    >
      <div className="flex items-center gap-3">
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-sm font-extrabold ${selected ? "anim-pop border-[var(--tile)] bg-tile text-white" : "border-line text-transparent"}`}>✓</span>
        <div className="min-w-0 flex-1">
          <div className="font-extrabold leading-snug">{o.name}</div>
          {o.user_added && <Tag>✨ پیشنهاد کاربران</Tag>}
        </div>
        <div className="shrink-0 text-left leading-tight">
          <div className="text-sm font-extrabold">{o.votes} رأی</div>
          <div className="text-xs font-bold text-mute">{o.percent}%</div>
        </div>
      </div>
      <div className="mt-2">
        <Bar pct={o.percent} done={selected} />
      </div>
      {o.joke && <div className="pointer-events-none absolute inset-0 grid place-items-center text-7xl opacity-70">❌</div>}
    </button>
  );
}

export function Food({ c }: { c: Ctx }) {
  const { snap, meal } = c;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const me = snap.me!;

  const run = c.runoff && c.runoff.scope === meal ? c.runoff : null;
  const list = run ? snap.meals[meal].filter((o) => run.ids.includes(o.id)) : snap.meals[meal];
  const label = MEALS.find((m) => m.key === meal)!;

  const add = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const ok = await c.addFood(meal, text.trim());
    setBusy(false);
    if (ok) {
      setText("");
      setOpen(false);
    }
  };

  return (
    <div className="pb-4">
      <PageTitle emoji={label.emoji} title={label.label} sub="یکی رو انتخاب کن، هر وقت خواستی عوضش کن" />
      <Segmented value={meal} onChange={c.setMeal} items={MEALS.map((m) => ({ key: m.key, label: `${m.emoji} ${m.label}` }))} />

      {meal === "lunch" && (
        <div className="mx-4 mb-3 rounded-[20px] border-2 border-dashed border-line p-3">
          <div className="text-sm font-extrabold">💡 نظر شخصی امیر</div>
          <p className="text-sm text-mute">میتونیم برنج دم کنیم و از کیترینگ‌ها خورشت بگیریم</p>
        </div>
      )}

      {run && (
        <div className="mx-4 mb-3 rounded-[20px] bg-soft p-3 text-sm">
          <div className="font-extrabold">⚖️ رأی‌گیری دوباره</div>
          <p className="text-mute">فقط بین گزینه‌های مساوی. رأیت رو عوض کن.</p>
          <button onClick={() => c.setRunoff(null)} className="mt-1 min-h-[40px] font-bold text-brand">نمایش همه گزینه‌ها</button>
        </div>
      )}

      <div className="mx-4 flex flex-col gap-2.5">
        {list.map((o) => (
          <FoodRow key={o.id} o={o} selected={me.food[meal] === o.id} onPick={() => c.voteFood(o.id)} />
        ))}
      </div>

      <div className="mx-4 mt-4">
        <button onClick={() => setOpen(true)} className="min-h-[56px] w-full rounded-2xl border-2 border-dashed border-line font-extrabold text-brand transition active:scale-[0.98]">
          ➕ پیشنهاد غذای جدید
        </button>
      </div>

      <Modal open={open} title="غذای پیشنهادی خودت رو بنویس" onClose={() => setOpen(false)}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          maxLength={60}
          placeholder="مثلاً: کباب ترکی"
          className="min-h-[52px] w-full rounded-2xl border-2 border-line bg-bg px-4 font-bold outline-none focus:border-[var(--tile)]"
        />
        <button onClick={add} disabled={!text.trim() || busy} className="sunset mt-3 min-h-[52px] w-full rounded-2xl font-extrabold text-white disabled:opacity-40">
          {busy ? "در حال افزودن…" : "اضافه کردن"}
        </button>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Places                                                               */
/* ------------------------------------------------------------------ */
const GRAD: Record<Category, string> = {
  free: "linear-gradient(135deg,#12b5a6,#2f6bff)",
  cheap: "linear-gradient(135deg,#ffb020,#ff5a3d)",
  expensive: "linear-gradient(135deg,#e8384f,#7a2bd6)",
};

function PlaceImg({ l }: { l: LocOpt }) {
  const [bad, setBad] = useState(false);
  if (l.image_url && !bad) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={l.image_url} alt={l.name} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBad(true)} className="h-full w-full object-cover" />
    );
  }
  return (
    <div className="grid h-full w-full place-items-center text-white" style={{ background: GRAD[l.category] }}>
      <span className="text-5xl opacity-90">📍</span>
    </div>
  );
}

function PlaceCard({ l, selected, onToggle }: { l: LocOpt; selected: boolean; onToggle: () => void }) {
  const cat = CATEGORIES.find((x) => x.key === l.category)!;
  return (
    <div className="overflow-hidden rounded-[20px] border border-line bg-card shadow-sm">
      <div className="relative h-36 w-full bg-soft">
        <PlaceImg l={l} />
        <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-bold text-white">{cat.dot} {cat.label}</span>
        {l.user_added && <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-bold text-white">✨ پیشنهاد کاربران</span>}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-extrabold leading-snug">{l.name}</h3>
          <div className="shrink-0 text-left text-xs font-bold leading-tight text-mute">
            <div>{l.votes} رأی</div>
            <div>{l.percent}%</div>
          </div>
        </div>
        <div className="mt-2"><Bar pct={l.percent} done={selected} /></div>
        <button
          onClick={onToggle}
          className={`mt-3 min-h-[48px] w-full rounded-2xl font-extrabold transition active:scale-[0.98] ${selected ? "bg-tile text-white" : "bg-soft text-ink"}`}
        >
          {selected ? "✓ انتخاب شد" : "انتخاب"}
        </button>
      </div>
    </div>
  );
}

export function Places({ c }: { c: Ctx }) {
  const { snap } = c;
  const me = snap.me!;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cat, setCat] = useState<Category | "">("");
  const [busy, setBusy] = useState(false);

  const run = c.runoff && c.runoff.scope === "places" ? c.runoff : null;
  const all = run ? snap.locations.filter((l) => run.ids.includes(l.id)) : snap.locations;

  const add = async () => {
    if (!name.trim() || !cat || busy) return;
    setBusy(true);
    const ok = await c.addLoc(name.trim(), cat);
    setBusy(false);
    if (ok) {
      setName("");
      setCat("");
      setOpen(false);
    }
  };

  return (
    <div className="pb-4">
      <PageTitle emoji="📍" title="مکان‌ها" sub={`هرچندتا که دوست داری انتخاب کن • ${me.places.length} انتخاب`} />

      {run && (
        <div className="mx-4 mb-3 rounded-[20px] bg-soft p-3 text-sm">
          <div className="font-extrabold">⚖️ رأی‌گیری دوباره</div>
          <p className="text-mute">فقط بین مکان‌های مساوی. انتخاب‌هات رو مرور کن.</p>
          <button onClick={() => c.setRunoff(null)} className="mt-1 min-h-[40px] font-bold text-brand">نمایش همه مکان‌ها</button>
        </div>
      )}

      {CATEGORIES.map((k) => {
        const items = all.filter((l) => l.category === k.key);
        if (!items.length) return null;
        return (
          <section key={k.key} className="mb-5">
            <h2 className="mx-4 mb-2 font-extrabold">{k.dot} {k.label}</h2>
            <div className="mx-4 flex flex-col gap-3">
              {items.map((l) => {
                const selected = me.places.includes(l.id);
                return <PlaceCard key={l.id} l={l} selected={selected} onToggle={() => c.voteLoc(l.id, !selected)} />;
              })}
            </div>
          </section>
        );
      })}

      <div className="mx-4">
        <button onClick={() => setOpen(true)} className="min-h-[56px] w-full rounded-2xl border-2 border-dashed border-line font-extrabold text-brand transition active:scale-[0.98]">
          ➕ پیشنهاد مکان جدید
        </button>
      </div>

      <Modal open={open} title="پیشنهاد مکان جدید" onClose={() => setOpen(false)}>
        <label className="mb-1 block text-sm font-bold text-mute">اسم مکان</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="مثلاً: برج میلاد"
          className="min-h-[52px] w-full rounded-2xl border-2 border-line bg-bg px-4 font-bold outline-none focus:border-[var(--tile)]"
        />
        <div className="mb-1 mt-3 text-sm font-bold text-mute">دسته‌بندی</div>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((k) => (
            <button
              key={k.key}
              onClick={() => setCat(k.key)}
              className={`min-h-[52px] rounded-2xl border-2 text-sm font-extrabold ${cat === k.key ? "border-[var(--tile)] bg-soft" : "border-line"}`}
            >
              {cat === k.key ? "◉" : "○"} {k.label}
            </button>
          ))}
        </div>
        <button onClick={add} disabled={!name.trim() || !cat || busy} className="sunset mt-4 min-h-[52px] w-full rounded-2xl font-extrabold text-white disabled:opacity-40">
          {busy ? "در حال افزودن…" : "اضافه کردن"}
        </button>
      </Modal>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* People                                                               */
/* ------------------------------------------------------------------ */
export function People({ c }: { c: Ctx }) {
  const { snap } = c;
  return (
    <div className="pb-4">
      <PageTitle emoji="👥" title="شرکت‌کنندگان" sub={`${snap.count} نفر`} />
      <div className="mx-4 flex flex-col gap-2.5">
        {snap.people.map((p) => {
          const status = p.done === 4 ? { dot: "🟢", text: "کامل" } : p.done > 0 ? { dot: "🟡", text: `${p.done} از ۴` } : { dot: "⚪", text: "هنوز رأی نداده" };
          return (
            <div key={p.id} className="flex items-center gap-3 rounded-[20px] border border-line bg-card p-3">
              <Avatar name={p.name} src={p.photo_url} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-extrabold">{p.name}{p.isMe && <span className="mr-1 text-xs font-bold text-mute"> (تو)</span>}</div>
                <div className="text-sm font-bold text-mute">{status.dot} {status.text}</div>
              </div>
              <div className="flex gap-1 text-sm" aria-hidden="true">
                <span className={p.progress.breakfast ? "" : "opacity-25"}>🍳</span>
                <span className={p.progress.lunch ? "" : "opacity-25"}>🍗</span>
                <span className={p.progress.dinner ? "" : "opacity-25"}>🌙</span>
                <span className={p.progress.places ? "" : "opacity-25"}>📍</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Results + Plan                                                       */
/* ------------------------------------------------------------------ */
function RankList({ title, items, limit }: { title: string; items: Opt[]; limit: number }) {
  const top = ranked(items).slice(0, limit);
  return (
    <div className="mx-4 mb-3 rounded-[20px] border border-line bg-card p-4">
      <h3 className="mb-2 font-extrabold">{title}</h3>
      {!top.length && <p className="text-sm text-mute">هنوز رأیی ثبت نشده</p>}
      <div className="flex flex-col gap-3">
        {top.map((o, i) => (
          <div key={o.id}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="font-bold">{i + 1}. {o.name}</span>
              <span className="shrink-0 font-extrabold">{o.percent}%</span>
            </div>
            <Bar pct={o.percent} />
          </div>
        ))}
      </div>
    </div>
  );
}

function slotView(s: Slot) {
  if (s.kind === "pick") return <span className="font-extrabold">{s.item.name}</span>;
  if (s.kind === "tie") return <span className="font-extrabold text-[#c77800]">⚖️ مساوی شده</span>;
  return <span className="text-mute">— هنوز مشخص نشده</span>;
}

function PlanView({ c }: { c: Ctx }) {
  const plan = buildPlan(c.snap);
  return (
    <div>
      <div className="mx-4 mb-3">
        <h2 className="text-xl font-extrabold">✈️ برنامه سفر تهران</h2>
        <p className="text-sm text-mute">بر اساس رأی‌ها ساخته میشه، بدون انتخاب تصادفی.</p>
      </div>
      {plan.days.map((d) => (
        <div key={d.title} className="mx-4 mb-3 overflow-hidden rounded-[20px] border border-line bg-card">
          <div className="sunset px-4 py-2 font-extrabold text-white">{d.title}</div>
          <div className="divide-y divide-[var(--line)]">
            {d.rows.map((r, i) => (
              <div key={i} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="shrink-0 font-bold text-mute">{r.icon} {r.label}</span>
                <span className="text-left">{slotView(r.slot)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {plan.ties.map((t) => (
        <div key={t.scope} className="mx-4 mb-3 rounded-[20px] border-2 border-[var(--saffron)] bg-card p-4">
          <div className="font-extrabold">⚖️ {t.label}: بین این گزینه‌ها مساوی شده</div>
          <p className="my-1 text-sm text-mute">{t.options.map((o) => o.name).join(" / ")}</p>
          <button
            onClick={() => {
              c.setRunoff({ scope: t.scope, ids: t.options.map((o) => o.id) });
              if (t.scope === "places") c.go("places");
              else {
                c.setMeal(t.scope);
                c.go("food");
              }
            }}
            className="mt-1 min-h-[48px] w-full rounded-2xl bg-saffron font-extrabold text-[#14122b]"
          >
            🔁 رأی‌گیری دوباره
          </button>
        </div>
      ))}
    </div>
  );
}

export function Results({ c }: { c: Ctx }) {
  const { snap } = c;
  const [view, setView] = useState<"results" | "plan">("results");
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    await c.send(view);
    setSending(false);
  };

  return (
    <div className="pb-4">
      <PageTitle emoji="📊" title="نتایج" sub={`${snap.count} نفر • فقط درصدها نمایش داده میشه`} />
      <Segmented value={view} onChange={setView} items={[{ key: "results", label: "نتایج زنده" }, { key: "plan", label: "برنامه سفر" }]} />

      {view === "results" ? (
        <>
          {MEALS.map((m) => (
            <RankList key={m.key} title={`${m.emoji} ${m.label}`} items={snap.meals[m.key]} limit={5} />
          ))}
          <RankList title="📍 مکان‌ها" items={snap.locations} limit={8} />
        </>
      ) : (
        <PlanView c={c} />
      )}

      <div className="mx-4 mt-4">
        <button onClick={send} disabled={sending} className="sunset min-h-[56px] w-full rounded-2xl font-extrabold text-white shadow-lift transition active:scale-[0.98] disabled:opacity-50">
          {sending ? "در حال ارسال…" : view === "plan" ? "📤 ارسال برنامه به گروه" : "📤 ارسال نتایج به گروه"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bottom navigation                                                    */
/* ------------------------------------------------------------------ */
const NAV: { key: Tab; emoji: string; label: string }[] = [
  { key: "home", emoji: "🏠", label: "خانه" },
  { key: "food", emoji: "🍽", label: "غذا" },
  { key: "places", emoji: "📍", label: "مکان‌ها" },
  { key: "people", emoji: "👥", label: "افراد" },
  { key: "results", emoji: "📊", label: "نتایج" },
];

export function Nav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line" style={{ background: "color-mix(in srgb, var(--card) 90%, transparent)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" }}>
      <div className="mx-auto flex max-w-md px-2 pt-1.5">
        {NAV.map((n) => {
          const active = tab === n.key;
          return (
            <button key={n.key} onClick={() => onChange(n.key)} className="flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl" aria-current={active ? "page" : undefined}>
              <span className={`grid h-8 w-12 place-items-center rounded-full text-lg transition ${active ? "sunset" : ""}`}>{n.emoji}</span>
              <span className={`text-[11px] font-bold ${active ? "text-ink" : "text-mute"}`}>{n.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
