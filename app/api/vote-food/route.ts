import { broadcast, db, handle, HttpError, json, requireParticipant, TRIP_ID } from "@/lib/server";

export const runtime = "nodejs";

export const POST = handle(async (req) => {
  const { participant } = await requireParticipant(req);
  const { optionId } = await req.json().catch(() => ({}));

  const { data: opt } = await db()
    .from("food_options")
    .select("id,meal")
    .eq("id", String(optionId || ""))
    .eq("trip_id", TRIP_ID)
    .maybeSingle();
  if (!opt) throw new HttpError(404, "این گزینه پیدا نشد.");

  // one vote per (participant, meal): changing the vote just replaces it
  const { error } = await db()
    .from("food_votes")
    .upsert(
      { participant_id: participant.id, trip_id: TRIP_ID, meal: opt.meal, option_id: opt.id, updated_at: new Date().toISOString() },
      { onConflict: "participant_id,meal" }
    );
  if (error) throw error;

  await broadcast();
  return json({ ok: true });
});
