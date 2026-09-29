import { getSnapshot } from "@/lib/data";
import { getUser, handle, json } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const user = getUser(req);
  return json(await getSnapshot(user.id));
});
