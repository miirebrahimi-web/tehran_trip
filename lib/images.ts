// Finds a REAL photo for a place from Persian Wikipedia (free-licensed images).
// If nothing trustworthy is found we return null and the app shows a placeholder.

const GENERIC = new Set(["پارک", "باغ", "کاخ", "بازار", "دریاچه", "تهران", "موزه"]);

function norm(s: string) {
  return s
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\u200c/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export async function findWikiImage(name: string, timeoutMs = 6000): Promise<string | null> {
  try {
    const q = encodeURIComponent(`${name} تهران`);
    const url =
      "https://fa.wikipedia.org/w/api.php?action=query&format=json&generator=search" +
      `&gsrsearch=${q}&gsrlimit=6&prop=pageimages&piprop=thumbnail&pithumbsize=640`;
    const res = await fetch(url, {
      headers: { "user-agent": "TehranTripMiniApp/1.0 (telegram mini app)" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const pages: any[] = Object.values(data?.query?.pages || {});
    pages.sort((a, b) => (a.index || 99) - (b.index || 99));

    const tokens = norm(name).split(" ").filter((t) => t.length >= 2);
    const sig = tokens.filter((t) => !GENERIC.has(t));
    const need = sig.length ? sig : tokens;

    for (const p of pages) {
      const src = p?.thumbnail?.source;
      if (!src) continue;
      const title = norm(p.title || "");
      if (need.some((t) => title.includes(t))) return src as string;
    }
    return null;
  } catch {
    return null;
  }
}
