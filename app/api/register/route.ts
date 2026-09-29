import { broadcast, cleanName, db, getUser, handle, HttpError, json, TRIP_ID } from "@/lib/server";

export const runtime = "nodejs";

export const POST = handle(async (req) => {
  const user = getUser(req);
  const body = await req.json().catch(() => ({}));
  const name = cleanName(body.name);
  if (!name) throw new HttpError(400, "اسمت رو بنویس.");

  const row: Record<string, unknown> = {
    trip_id: TRIP_ID,
    telegram_user_id: user.id,
    name,
    updated_at: new Date().toISOString(),
  };
  if (user.username) row.username = user.username;
  if (user.photo_url) row.photo_url = user.photo_url;

  const { error } = await db().from("participants").upsert(row, { onConflict: "trip_id,telegram_user_id" });
  if (error) throw error;

  await broadcast();
  return json({ ok: true });
});
