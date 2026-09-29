import { db, TRIP_ID } from "./server";
import type { LocOpt, Meal, Opt, Person, Snapshot } from "./types";

const pct = (v: number, total: number) => (total > 0 ? Math.round((v * 100) / total) : 0);

/** Builds everything the app needs. Only totals are returned, never who voted for what. */
export async function getSnapshot(tgUserId?: number | null): Promise<Snapshot> {
  const s = db();
  const [trip, parts, foods, fvotes, locs, lvotes] = await Promise.all([
    s.from("trips").select("title,nights,days,group_chat_id").eq("id", TRIP_ID).single(),
    s.from("participants").select("id,telegram_user_id,name,username,photo_url,created_at").eq("trip_id", TRIP_ID).order("created_at"),
    s.from("food_options").select("id,meal,name,is_user_added,is_joke,sort_order,created_at").eq("trip_id", TRIP_ID).order("sort_order").order("created_at"),
    s.from("food_votes").select("participant_id,meal,option_id").eq("trip_id", TRIP_ID),
    s.from("location_options").select("id,name,category,image_url,is_user_added,sort_order,created_at").eq("trip_id", TRIP_ID).order("sort_order").order("created_at"),
    s.from("location_votes").select("participant_id,option_id").eq("trip_id", TRIP_ID),
  ]);
  for (const r of [trip, parts, foods, fvotes, locs, lvotes]) if (r.error) throw r.error;

  const foodCount = new Map<string, number>();
  const votersByMeal: Record<Meal, Set<string>> = { breakfast: new Set(), lunch: new Set(), dinner: new Set() };
  for (const v of fvotes.data || []) {
    foodCount.set(v.option_id, (foodCount.get(v.option_id) || 0) + 1);
    votersByMeal[v.meal as Meal].add(v.participant_id);
  }
  const locCount = new Map<string, number>();
  const locVoters = new Set<string>();
  for (const v of lvotes.data || []) {
    locCount.set(v.option_id, (locCount.get(v.option_id) || 0) + 1);
    locVoters.add(v.participant_id);
  }

  const voters = {
    breakfast: votersByMeal.breakfast.size,
    lunch: votersByMeal.lunch.size,
    dinner: votersByMeal.dinner.size,
    places: locVoters.size,
  };

  const meals: Record<Meal, Opt[]> = { breakfast: [], lunch: [], dinner: [] };
  for (const f of foods.data || []) {
    const votes = foodCount.get(f.id) || 0;
    meals[f.meal as Meal].push({
      id: f.id,
      name: f.name,
      votes,
      percent: pct(votes, voters[f.meal as Meal]),
      user_added: f.is_user_added,
      joke: f.is_joke,
      sort: f.sort_order,
    });
  }

  const locations: LocOpt[] = (locs.data || []).map((l) => {
    const votes = locCount.get(l.id) || 0;
    return {
      id: l.id,
      name: l.name,
      votes,
      percent: pct(votes, voters.places),
      user_added: l.is_user_added,
      joke: false,
      sort: l.sort_order,
      category: l.category,
      image_url: l.image_url,
    };
  });

  const done = new Map<string, Person["progress"]>();
  const blank = () => ({ breakfast: false, lunch: false, dinner: false, places: false });
  for (const v of fvotes.data || []) {
    const p = done.get(v.participant_id) || blank();
    p[v.meal as Meal] = true;
    done.set(v.participant_id, p);
  }
  for (const v of lvotes.data || []) {
    const p = done.get(v.participant_id) || blank();
    p.places = true;
    done.set(v.participant_id, p);
  }

  let me: Snapshot["me"] = null;
  const people: Person[] = (parts.data || []).map((p) => {
    const progress = done.get(p.id) || blank();
    const isMe = tgUserId != null && Number(p.telegram_user_id) === Number(tgUserId);
    if (isMe) {
      const food: Partial<Record<Meal, string>> = {};
      for (const v of fvotes.data || []) if (v.participant_id === p.id) food[v.meal as Meal] = v.option_id;
      const places = (lvotes.data || []).filter((v) => v.participant_id === p.id).map((v) => v.option_id);
      me = { name: p.name, food, places };
    }
    return {
      id: p.id,
      name: p.name,
      username: p.username,
      photo_url: p.photo_url,
      isMe,
      progress,
      done: Number(progress.breakfast) + Number(progress.lunch) + Number(progress.dinner) + Number(progress.places),
    };
  });

  return {
    trip: { title: trip.data!.title, nights: trip.data!.nights, days: trip.data!.days, hasGroup: !!trip.data!.group_chat_id },
    count: people.length,
    people,
    meals,
    voters,
    locations,
    me,
  };
}
