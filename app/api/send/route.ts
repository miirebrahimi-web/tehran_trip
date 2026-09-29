import { getSnapshot } from "@/lib/data";
import { planText, resultsText } from "@/lib/plan";
import { db, handle, HttpError, json, requireParticipant, TRIP_ID } from "@/lib/server";
import { sendMessage } from "@/lib/telegram";

export const runtime = "nodejs";

export const POST = handle(async (req) => {
  const { user } = await requireParticipant(req);
  const body = await req.json().catch(() => ({}));
  const type = body.type === "plan" ? "plan" : "results";

  const { data: trip } = await db().from("trips").select("group_chat_id").eq("id", TRIP_ID).single();
  if (!trip?.group_chat_id) {
    throw new HttpError(400, "هنوز گروهی ثبت نشده. داخل گروه دستور /start رو بفرست.");
  }

  const snap = await getSnapshot(user.id);
  const r = await sendMessage(trip.group_chat_id, type === "plan" ? planText(snap) : resultsText(snap));
  if (!r?.ok) throw new HttpError(502, "ارسال به گروه انجام نشد. مطمئن شو ربات هنوز توی گروه هست.");
  return json({ ok: true });
});
