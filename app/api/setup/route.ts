import { findWikiImage } from "@/lib/images";
import { db, env, TRIP_ID } from "@/lib/server";
import { tg } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const html = (body: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>راه‌اندازی</title>
<style>body{font-family:system-ui,Tahoma,sans-serif;max-width:560px;margin:24px auto;padding:0 16px;line-height:1.9}code{background:#eee;padding:2px 6px;border-radius:6px}</style></head><body>${body}</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } }
  );

// Open once in the browser:  https://YOUR-SITE/api/setup?key=YOUR_TELEGRAM_WEBHOOK_SECRET
export async function GET(req: Request) {
  const url = new URL(req.url);
  let secret = "";
  try {
    secret = env("TELEGRAM_WEBHOOK_SECRET");
    env("TELEGRAM_BOT_TOKEN");
    env("NEXT_PUBLIC_SUPABASE_URL");
    env("SUPABASE_SERVICE_ROLE_KEY");
  } catch (e: any) {
    return html(`<h2>❌ ${e.message}</h2><p>متغیرهای محیطی رو توی Vercel اضافه کن و یک‌بار Redeploy بزن.</p>`, 500);
  }
  if (url.searchParams.get("key") !== secret) {
    return html(`<h2>❌ کلید اشتباهه</h2><p>آدرس باید این شکلی باشه:<br><code>/api/setup?key=مقدار TELEGRAM_WEBHOOK_SECRET</code></p>`, 403);
  }

  const origin = url.origin;
  const out: string[] = [];

  const wh = await tg("setWebhook", {
    url: `${origin}/api/telegram`,
    secret_token: secret,
    allowed_updates: ["message", "my_chat_member"],
    drop_pending_updates: true,
  });
  out.push(wh.ok ? "✅ وب‌هوک تلگرام تنظیم شد" : `❌ وب‌هوک: ${wh.description || "خطا"}`);

  const cmds = await tg("setMyCommands", {
    commands: [
      { command: "start", description: "باز کردن مینی‌اپ سفر تهران" },
      { command: "results", description: "ارسال نتایج فعلی" },
      { command: "plan", description: "ارسال برنامه نهایی سفر" },
      { command: "participants", description: "تعداد شرکت‌کننده‌ها" },
    ],
  });
  out.push(cmds.ok ? "✅ دستورات ربات ساخته شد" : `❌ دستورات: ${cmds.description || "خطا"}`);

  const menu = await tg("setChatMenuButton", {
    menu_button: { type: "web_app", text: "🧳 سفر تهران", web_app: { url: origin } },
  });
  out.push(menu.ok ? "✅ دکمه منوی ربات تنظیم شد" : `❌ دکمه منو: ${menu.description || "خطا"}`);

  // Fetch real photos for places that don't have one yet
  const { data: rows } = await db().from("location_options").select("id,name").eq("trip_id", TRIP_ID).is("image_url", null);
  let found = 0;
  await Promise.allSettled(
    (rows || []).map(async (r) => {
      const img = await findWikiImage(r.name);
      if (img) {
        await db().from("location_options").update({ image_url: img }).eq("id", r.id);
        found++;
      }
    })
  );
  out.push(`🖼 عکس برای ${found} از ${(rows || []).length} مکان پیدا شد (بقیه عکس جایگزین می‌گیرن)`);

  return html(`<h2>راه‌اندازی انجام شد</h2>${out.map((l) => `<div>${l}</div>`).join("")}<p>حالا داخل گروه بنویس <code>/start</code></p>`);
}
