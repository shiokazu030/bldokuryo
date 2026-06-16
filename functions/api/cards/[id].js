export async function onRequestGet(context) {
  const db = getDb(context);
  if (!db) return json({ error: "D1 database is not configured." }, 500);

  const id = context.params.id;
  const row = await db.prepare(
    `SELECT id, title, author, comment, sweetness, heaviness, numa, crying, spice, tags, created_at
     FROM cards
     WHERE id = ? AND is_public = 1`
  ).bind(id).first();

  if (!row) return json({ error: "カードが見つかりません。" }, 404);
  return json({ card: normalizeCardRow(row) });
}

export async function onRequestDelete(context) {
  const db = getDb(context);
  if (!db) return json({ error: "D1 database is not configured." }, 500);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const id = context.params.id;
  const password = String(body.delete_password || "");
  if (!password) return json({ error: "削除用パスワードを入力してください。" }, 400);

  const row = await db.prepare(
    `SELECT delete_password_hash FROM cards WHERE id = ? AND is_public = 1`
  ).bind(id).first();

  if (!row) return json({ error: "カードが見つかりません。" }, 404);
  if (!row.delete_password_hash) return json({ error: "このカードには削除用パスワードが設定されていません。" }, 403);

  const hash = await sha256(`delete:${password}`);
  if (hash !== row.delete_password_hash) return json({ error: "削除用パスワードが違います。" }, 403);

  await db.prepare(`UPDATE cards SET is_public = 0 WHERE id = ?`).bind(id).run();
  return json({ ok: true });
}

function getDb(context) {
  return context.env.DB || context.env.DOKURYO_DB || null;
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

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
