export async function onRequestGet(context) {
  const db = getDb(context);
  if (!db) return json({ error: "D1 database is not configured." }, 500);

  const tag = decodeURIComponent(String(context.params.tag || "")).trim().slice(0, 40);
  const url = new URL(context.request.url);
  const limit = clampNumber(url.searchParams.get("limit"), 1, 50, 20);
  const offset = clampNumber(url.searchParams.get("offset"), 0, 5000, 0);

  if (!tag) return json({ error: "タグが指定されていません。" }, 400);

  const result = await db.prepare(
    `SELECT id, title, author, comment, sweetness, heaviness, numa, crying, spice, tags, dlsite_work_id, work_key, source, view_count, share_count, created_at
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

function normalizeWorkKey(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[『』「」【】\\[\\]（）()〈〉《》]/g, "")
    .replace(/第?[0-9０-９一二三四五六七八九十]+(巻|話|冊|上|下|前編|後編)/g, "")
    .replace(/[\s\u3000・･~〜ー―‐\-_,，、.。!！?？:：;；/／\\]+/g, "")
    .trim()
    .slice(0, 80);
}

function normalizeDlsiteWorkId(value) {
  const id = String(value || "").trim().toUpperCase();
  return /^RJ\d+$/i.test(id) ? id : "";
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
    dlsite_work_id: normalizeDlsiteWorkId(row.dlsite_work_id),
    dlsiteWorkId: normalizeDlsiteWorkId(row.dlsite_work_id),
    affiliate: {
      dmmKeyword: [row.title, row.author].filter(Boolean).join(" "),
      dlsiteWorkId: normalizeDlsiteWorkId(row.dlsite_work_id)
    },
    work_key: row.work_key || normalizeWorkKey(row.title),
    source: row.source || "user",
    view_count: Number(row.view_count || 0),
    share_count: Number(row.share_count || 0),
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
