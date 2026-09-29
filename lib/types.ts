export type Meal = "breakfast" | "lunch" | "dinner";
export type Category = "free" | "cheap" | "expensive";

export const MEALS: { key: Meal; label: string; emoji: string }[] = [
  { key: "breakfast", label: "صبحانه", emoji: "🍳" },
  { key: "lunch", label: "ناهار", emoji: "🍗" },
  { key: "dinner", label: "شام", emoji: "🌙" },
];

export const CATEGORIES: { key: Category; label: string; dot: string }[] = [
  { key: "free", label: "رایگان", dot: "🟢" },
  { key: "cheap", label: "ارزان", dot: "🟡" },
  { key: "expensive", label: "گران", dot: "🔴" },
];

export interface Opt {
  id: string;
  name: string;
  votes: number;
  percent: number;
  user_added: boolean;
  joke: boolean;
  sort: number;
}

export interface LocOpt extends Opt {
  category: Category;
  image_url: string | null;
}

export interface Person {
  id: string;
  name: string;
  username: string | null;
  photo_url: string | null;
  isMe: boolean;
  done: number; // out of 4: breakfast, lunch, dinner, places
  progress: { breakfast: boolean; lunch: boolean; dinner: boolean; places: boolean };
}

export interface Snapshot {
  trip: { title: string; nights: number; days: number; hasGroup: boolean };
  count: number;
  people: Person[];
  meals: Record<Meal, Opt[]>;
  voters: Record<Meal | "places", number>;
  locations: LocOpt[];
  me: null | { name: string; food: Partial<Record<Meal, string>>; places: string[] };
}

export type Runoff = { scope: Meal | "places"; ids: string[] };
