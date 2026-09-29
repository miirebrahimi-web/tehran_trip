import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { verifyInitData, TgUser } from "./telegram";

export const TRIP_ID = "00000000-0000-4000-8000-000000000001";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new HttpError(500, `متغیر محیطی ${name} تنظیم نشده است.`);
  return v;
}

let _db: SupabaseClient | null = null;
export function db(): SupabaseClient {
  if (!_db) {
    _db = createClient(env("NEXT_PUBLIC_SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _db;
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function handle(fn: (req: Request) => Promise<Response>) {
  return async (req: Request) => {
    try {
      return await fn(req);
    } catch (e: any) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      console.error(e);
      return json({ error: "خطای سرور. دوباره تلاش کن." }, 500);
    }
  };
}

/** Tells every open Mini App to refresh (Supabase Realtime Broadcast, no votes are sent). */
export async function broadcast() {
  try {
    const url = env("NEXT_PUBLIC_SUPABASE_URL");
    const key = env("SUPABASE_SERVICE_ROLE_KEY");
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({
        messages: [{ topic: "trip-live", event: "changed", payload: { t: Date.now() }, private: false }],
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) {
    console.error("broadcast failed", e);
  }
}

/** Verified Telegram user from the request header. Never trusts the ID sent by the browser. */
export function getUser(req: Request): TgUser {
  const initData = req.headers.get("x-telegram-init-data") || "";
  const user = verifyInitData(initData, env("TELEGRAM_BOT_TOKEN"));
  if (!user) throw new HttpError(401, "ورود معتبر نیست. مینی‌اپ رو ببند و دوباره از تلگرام باز کن.");
  return user;
}

export async function requireParticipant(req: Request) {
  const user = getUser(req);
  const { data, error } = await db()
    .from("participants")
    .select("id,name")
    .eq("trip_id", TRIP_ID)
    .eq("telegram_user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(403, "اول باید اسمت رو ثبت کنی.");
  return { user, participant: data as { id: string; name: string } };
}

export function cleanName(v: unknown, max = 40): string {
  return String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}
