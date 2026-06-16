export async function onRequestGet(context) {
  const db = getDb(context);
  if (!db) return json({ error: "D1 database is not configured." }, 500);

  const tag = String(context.params.tag || "").trim().slice(0, 40);
  const url = new URL(context.request.url);
  const limit = clampNumber(url.searchParams.get("limit"), 1, 50, 20);
  const offset = clampNumber(url.searchParams.get("offset"), 0, 5000, 0);

  if (!tag) return json({ error: "タグが指定されていません。" }, 400);

  const result = await db.prepare(
    `SELECT id, title, author, comment, sweetness, heaviness, numa, crying, spice, tags, created_at
     FROM cards
     WHERE is_public = 1 AND tags LIKE ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(`%"${escapeLike(tag)}"%`, limit, offset).all();

  return json({ cards: (result.results || []).map(normalizeCardRow), next_offset: offset + limit });
}

function getDb(context) {
  return context.env.DB || context.env.DOKURYO_DB || null;
}

function escapeLike(value) {
  return value.replace(/[%_]/g, "");
}

function clampNumber(value, min, max, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

function rating(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 3;
  return Math.min(5, Math.max(1, Math.round(number)));
}

function normalizeCardRow(row) {
  let tags = [];
  try {
    tags = JSON.parse(row.tags || "[]");
  } catch {
    tags = [];
  }
  return {
    ...row,
    tags,
    sweetness: rating(row.sweetness),
    heaviness: rating(row.heaviness),
    numa: rating(row.numa),
    crying: rating(row.crying),
    spice: rating(row.spice)
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
