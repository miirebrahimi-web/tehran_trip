"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Category, Meal, Runoff, Snapshot } from "@/lib/types";
import { Entry, Food, Home, Nav, People, Places, Results } from "./screens";
import type { Ctx, Tab } from "./screens";

export default function MiniApp() {
  const initData = useRef("");
  const snapRef = useRef<Snapshot | null>(null);
  const toastTimer = useRef<any>(null);

  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState("");
  const [suggest, setSuggest] = useState("");
  const [snap, setSnapState] = useState<Snapshot | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [meal, setMeal] = useState<Meal>("breakfast");
  const [runoff, setRunoff] = useState<Runoff | null>(null);
  const [toast, setToast] = useState("");

  const setSnap = (updater: Snapshot | null | ((s: Snapshot | null) => Snapshot | null)) => {
    setSnapState((prev) => {
      const next = typeof updater === "function" ? (updater as any)(prev) : updater;
      snapRef.current = next;
      return next;
    });
  };

  const say = useCallback((m: string) => {
    setToast(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  }, []);

  const call = useCallback(async (path: string, body?: unknown) => {
    const res = await fetch(path, {
      method: body === undefined ? "GET" : "POST",
      headers: { "content-type": "application/json", "x-telegram-init-data": initData.current },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "مشکلی پیش اومد. دوباره تلاش کن.");
    return data;
  }, []);

  const refresh = useCallback(async () => {
    try {
      setSnap(await call("/api/state"));
    } catch (e: any) {
      if (!snapRef.current) setFatal(e.message || "اتصال برقرار نشد.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call]);

  /* 1) Wait for Telegram, read the signed initData */
  useEffect(() => {
    let tries = 0;
    const t = setInterval(() => {
      const tgApp = (window as any).Telegram?.WebApp;
      tries++;
      if (tgApp?.initData) {
        clearInterval(t);
        initData.current = tgApp.initData;
        try {
          tgApp.ready();
          tgApp.expand();
          tgApp.disableVerticalSwipes?.();
          document.documentElement.dataset.theme = tgApp.colorScheme === "dark" ? "dark" : "light";
          setSuggest(tgApp.initDataUnsafe?.user?.first_name || "");
        } catch {}
        setReady(true);
      } else if (tries > 25) {
        clearInterval(t);
        setFatal("این برنامه فقط داخل تلگرام کار می‌کنه. ربات رو توی تلگرام باز کن و دکمه ورود رو بزن.");
      }
    }, 100);
    return () => clearInterval(t);
  }, []);

  /* 2) Load data + live updates (Supabase Realtime) + safety-net polling */
  useEffect(() => {
    if (!ready) return;
    refresh();

    let timer: any;
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 250);
    };

    let cleanup = () => {};
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      try {
        const sb = createClient(url, key);
        const ch = sb.channel("trip-live").on("broadcast", { event: "changed" }, soon).subscribe();
        cleanup = () => {
          sb.removeChannel(ch);
        };
      } catch {}
    }

    const poll = setInterval(refresh, 15000);
    const vis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", vis);
    return () => {
      cleanup();
      clearInterval(poll);
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [ready, refresh]);

  /* ---------------- actions ---------------- */
  const register = async (name: string): Promise<string | null> => {
    try {
      await call("/api/register", { name });
      await refresh();
      return null;
    } catch (e: any) {
      return e.message;
    }
  };

  const voteFood = async (id: string) => {
    // optimistic highlight, the server is the source of truth
    setSnap((s) => {
      if (!s || !s.me) return s;
      const m = (Object.keys(s.meals) as Meal[]).find((k) => s.meals[k].some((o) => o.id === id));
      return m ? { ...s, me: { ...s.me, food: { ...s.me.food, [m]: id } } } : s;
    });
    try {
      await call("/api/vote-food", { optionId: id });
    } catch (e: any) {
      say(e.message);
    }
    refresh();
  };

  const voteLoc = async (id: string, selected: boolean) => {
    setSnap((s) => {
      if (!s || !s.me) return s;
      const places = selected ? [...s.me.places, id] : s.me.places.filter((p) => p !== id);
      return { ...s, me: { ...s.me, places } };
    });
    try {
      await call("/api/vote-location", { optionId: id, selected });
    } catch (e: any) {
      say(e.message);
    }
    refresh();
  };

  const addFood = async (m: Meal, name: string) => {
    try {
      await call("/api/add-food", { meal: m, name });
      await refresh();
      say("✨ اضافه شد");
      return true;
    } catch (e: any) {
      say(e.message);
      return false;
    }
  };

  const addLoc = async (name: string, category: Category) => {
    try {
      await call("/api/add-location", { name, category });
      await refresh();
      say("✨ اضافه شد");
      return true;
    } catch (e: any) {
      say(e.message);
      return false;
    }
  };

  const send = async (type: "results" | "plan") => {
    try {
      await call("/api/send", { type });
      say("📤 به گروه ارسال شد");
    } catch (e: any) {
      say(e.message);
    }
  };

  const go = (t: Tab) => {
    setTab(t);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  /* ---------------- render ---------------- */
  if (fatal) {
    return (
      <div className="grid min-h-screen place-items-center p-8 text-center">
        <div>
          <div className="mb-3 text-5xl">🧭</div>
          <p className="font-bold leading-8">{fatal}</p>
        </div>
      </div>
    );
  }
  if (!snap) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-center">
          <div className="anim-pop mb-2 text-5xl">✈️</div>
          <p className="font-bold text-mute">در حال آماده‌سازی…</p>
        </div>
      </div>
    );
  }
  if (!snap.me) {
    return <Entry suggest={suggest} onSubmit={register} />;
  }

  const c: Ctx = { snap, meal, setMeal, runoff, setRunoff, go, voteFood, addFood, voteLoc, addLoc, send };

  return (
    <div className="mx-auto min-h-screen max-w-md pb-32">
      {tab === "home" && <Home c={c} />}
      {tab === "food" && <Food c={c} />}
      {tab === "places" && <Places c={c} />}
      {tab === "people" && <People c={c} />}
      {tab === "results" && <Results c={c} />}
      <Nav tab={tab} onChange={go} />
      {toast && (
        <div className="anim-sheet fixed inset-x-0 bottom-28 z-[60] mx-auto w-fit max-w-[90%] rounded-2xl bg-[#14122b] px-4 py-3 text-sm font-bold text-white shadow-lift">
          {toast}
        </div>
      )}
    </div>
  );
}
