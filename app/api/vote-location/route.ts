import { broadcast, db, handle, HttpError, json, requireParticipant, TRIP_ID } from "@/lib/server";

export const runtime = "nodejs";

export const POST = handle(async (req) => {
  const { participant } = await requireParticipant(req);
  const body = await req.json().catch(() => ({}));
  const optionId = String(body.optionId || "");
  const selected = body.selected !== false;

  const { data: opt } = await db().from("location_options").select("id").eq("id", optionId).eq("trip_id", TRIP_ID).maybeSingle();
  if (!opt) throw new HttpError(404, "این مکان پیدا نشد.");

  if (selected) {
    const { error } = await db()
      .from("location_votes")
      .upsert({ participant_id: participant.id, option_id: opt.id, trip_id: TRIP_ID }, { onConflict: "participant_id,option_id", ignoreDuplicates: true });
    if (error) throw error;
  } else {
    const { error } = await db().from("location_votes").delete().eq("participant_id", participant.id).eq("option_id", opt.id);
    if (error) throw error;
  }

  await broadcast();
  return json({ ok: true });
});
