// ── Dreamlo Leaderboard ──────────────────────────────────────────────────────
// 1. Register at https://dreamlo.com (free tier: 25 scores, $9.99 for unlimited)
// 2. Replace the two placeholder strings below with your actual keys.
const PUBLIC_KEY = "6a3624188f40bb1318e77d9a";
const PRIVATE_KEY = "xEEkD7dQJEScqmdvNiTCzArcUbDF20U0OPztemGcsnWg";
const BASE = "https://dreamlo.com/lb";

// Score = enemies × 100  +  seconds survived × 5  +  total XP
export function calcScore(player, entities, playTime) {
  return Math.round(
    entities.enemiesDefeated * 100 +
      Math.floor(playTime) * 5 +
      player.totalXpCollected,
  );
}

export async function submitScore(name, score) {
  const safeName = encodeURIComponent(
    (name || "Anonymous").trim().slice(0, 20),
  );
  const res = await fetch(`${BASE}/${PRIVATE_KEY}/add/${safeName}/${score}`);
  if (!res.ok) throw new Error(`Submit failed: ${res.status}`);
}

export async function fetchScores(count = 10) {
  const res = await fetch(`${BASE}/${PUBLIC_KEY}/json-top/${count}`);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const data = await res.json();
  const raw = data?.dreamlo?.leaderboard?.entry;
  if (!raw) return [];
  return (Array.isArray(raw) ? raw : [raw]).map((e) => ({
    name: String(e.name),
    score: Number(e.score),
  }));
}
