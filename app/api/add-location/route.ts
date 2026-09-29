import { findWikiImage } from "@/lib/images";
import { broadcast, cleanName, db, handle, HttpError, json, requireParticipant, TRIP_ID } from "@/lib/server";

export const runtime = "nodejs";
export const maxDuration = 20;

export const POST = handle(async (req) => {
  const { user } = await requireParticipant(req);
  const body = await req.json().catch(() => ({}));
  const name = cleanName(body.name, 60);
  const category = String(body.category || "");
  if (!name) throw new HttpError(400, "اسم مکان رو بنویس.");
  if (!["free", "cheap", "expensive"].includes(category)) throw new HttpError(400, "دسته‌بندی رو انتخاب کن.");

  const { data, error } = await db()
    .from("location_options")
    .insert({ trip_id: TRIP_ID, name, category, is_user_added: true, created_by: user.id, sort_order: 500 })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new HttpError(409, "این مکان قبلاً اضافه شده.");
    throw error;
  }

  // Try to attach a real photo, but never block on it.
  const img = await findWikiImage(name, 4000);
  if (img) await db().from("location_options").update({ image_url: img }).eq("id", data.id);

  await broadcast();
  return json({ ok: true, id: data.id });
});
