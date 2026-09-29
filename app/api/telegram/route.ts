import { getSnapshot } from "@/lib/data";
import { planText, resultsText } from "@/lib/plan";
import { db, json, TRIP_ID } from "@/lib/server";
import { botUsername, sendMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const maxDuration = 20;

const isGroup = (t?: string) => t === "group" || t === "supergroup";

async function rememberGroup(chatId: number) {
  await db().from("trips").update({ group_chat_id: chatId }).eq("id", TRIP_ID);
}

async function openButton(chatType: string, origin: string) {
  if (chatType === "private") {
    return { inline_keyboard: [[{ text: "🚀 ورود به سفر تهران", web_app: { url: origin } }]] };
  }
  // Buttons that open a Mini App directly only work in private chats; in groups we use the bot's link.
  const u = await botUsername();
  return { inline_keyboard: [[{ text: "🚀 ورود به سفر تهران", url: `https://t.me/${u}?startapp=trip` }]] };
}

async function handleUpdate(update: any, origin: string) {
  // Bot was added to a group
  const mcm = update.my_chat_member;
  if (mcm && isGroup(mcm.chat?.type)) {
    const status = mcm.new_chat_member?.status;
    if (status === "member" || status === "administrator") {
      await rememberGroup(mcm.chat.id);
      await sendMessage(mcm.chat.id, "سلام! 👋 من ربات سفر تهرانم.\nبرای رأی دادن به غذا و مکان‌ها دکمه زیر رو بزن.", {
        reply_markup: await openButton(mcm.chat.type, origin),
      });
    }
    return;
  }

  const msg = update.message;
  if (!msg?.text || !msg.chat) return;
  const m = /^\/(\w+)(?:@(\w+))?/.exec(msg.text.trim());
  if (!m) return;
  const cmd = m[1].toLowerCase();
  const target = m[2]?.toLowerCase();
  if (target && target !== (await botUsername()).toLowerCase()) return;

  const chatId = msg.chat.id as number;
  if (isGroup(msg.chat.type)) await rememberGroup(chatId);

  if (cmd === "start") {
    const text = isGroup(msg.chat.type)
      ? "🗼 سفر تهران | ۲ شب و ۳ روز\nهمه دکمه زیر رو بزنید و اسم و رأی‌هاتون رو ثبت کنید."
      : "🗼 سفر تهران | ۲ شب و ۳ روز\nبرای ورود و رأی دادن دکمه زیر رو بزن.";
    await sendMessage(chatId, text, { reply_markup: await openButton(msg.chat.type, origin) });
  } else if (cmd === "results") {
    await sendMessage(chatId, resultsText(await getSnapshot()));
  } else if (cmd === "plan") {
    await sendMessage(chatId, planText(await getSnapshot()));
  } else if (cmd === "participants") {
    const s = await getSnapshot();
    const names = s.people.map((p) => `• ${p.name}`).join("\n");
    await sendMessage(chatId, `👥 شرکت‌کنندگان: ${s.count} نفر${names ? "\n" + names : ""}`);
  }
}

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return json({ error: "forbidden" }, 403);
  }
  try {
    const update = await req.json();
    await handleUpdate(update, new URL(req.url).origin);
  } catch (e) {
    console.error("webhook error", e);
  }
  // Always answer 200 so Telegram doesn't retry the same update forever.
  return json({ ok: true });
}
