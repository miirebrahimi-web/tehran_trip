"use client";
import { useState } from "react";

export function Bar({ pct, done }: { pct: number; done?: boolean }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-soft">
      <div className={`bar-w h-full rounded-full ${done ? "fill-done" : "fill-bar"}`} style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }} />
    </div>
  );
}

const TONES = ["#e8384f", "#7a2bd6", "#12b5a6", "#ff7a1a", "#2f6bff", "#d6338a"];

export function Avatar({ name, src, size = 44 }: { name: string; src?: string | null; size?: number }) {
  const [bad, setBad] = useState(false);
  const tone = TONES[(name.codePointAt(0) || 0) % TONES.length];
  if (src && !bad) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" width={size} height={size} loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)} className="rounded-full object-cover" style={{ width: size, height: size }} />
    );
  }
  return (
    <div className="grid shrink-0 place-items-center rounded-full font-extrabold text-white" style={{ width: size, height: size, background: tone }}>
      {name.trim().slice(0, 1)}
    </div>
  );
}

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="anim-fade fixed inset-0 z-50 flex items-end bg-black/55" onClick={onClose}>
      <div className="anim-sheet safe-bottom mx-auto w-full max-w-md rounded-t-[28px] bg-card p-5 shadow-lift" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line" />
        <h3 className="mb-3 text-lg font-extrabold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-full bg-soft px-2 py-0.5 text-[11px] font-bold text-mute">{children}</span>;
}

export function PageTitle({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <div className="px-4 pb-3 pt-5">
      <h1 className="text-2xl font-extrabold">{emoji} {title}</h1>
      {sub && <p className="text-sm text-mute">{sub}</p>}
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { key: T; label: string }[] }) {
  return (
    <div className="mx-4 mb-3 flex gap-1 rounded-2xl bg-soft p-1">
      {items.map((i) => (
        <button key={i.key} onClick={() => onChange(i.key)} className={`min-h-[44px] flex-1 rounded-xl text-sm font-bold transition ${value === i.key ? "bg-card text-ink shadow-sm" : "text-mute"}`}>
          {i.label}
        </button>
      ))}
    </div>
  );
}
