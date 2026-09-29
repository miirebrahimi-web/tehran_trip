import { broadcast, cleanName, db, handle, HttpError, json, requireParticipant, TRIP_ID } from "@/lib/server";

export const runtime = "nodejs";

export const POST = handle(async (req) => {
  const { user } = await requireParticipant(req);
  const body = await req.json().catch(() => ({}));
  const meal = String(body.meal || "");
  const name = cleanName(body.name, 60);
  if (!["breakfast", "lunch", "dinner"].includes(meal)) throw new HttpError(400, "وعده نامعتبره.");
  if (!name) throw new HttpError(400, "اسم غذا رو بنویس.");

  const { data, error } = await db()
    .from("food_options")
    .insert({ trip_id: TRIP_ID, meal, name, is_user_added: true, created_by: user.id, sort_order: 500 })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new HttpError(409, "این غذا قبلاً اضافه شده.");
    throw error;
  }

  await broadcast();
  return json({ ok: true, id: data.id });
});
