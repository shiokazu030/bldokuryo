const NG_WORDS = ["死ね", "殺す", "バカ", "詐欺", "無料配布"];
const ALLOWED_TAGS = new Set([
  "BL", "商業BL", "二次創作", "執着攻め", "年下攻め", "オメガバース", "Dom/Sub", "泣ける", "甘々", "地雷注意",
  "重め", "両片想い", "すれ違い", "溺愛", "体格差", "年上受け", "幼なじみ", "ケンカップル", "主従", "共依存",
  "健気受け", "クール攻め", "重い愛", "ハピエン", "余韻強め", "青春", "同居", "ギャップ"
]);

export async function onRequestGet(context) {
  const db = getDb(context);
  if (!db) return json({ error: "D1 database is not configured." }, 500);

  const url = new URL(context.request.url);
  const limit = clampNumber(url.searchParams.get("limit"), 1, 50, 20);
  const offset = clampNumber(url.searchParams.get("offset"), 0, 5000, 0);
  const sort = String(url.searchParams.get("sort") || "new");
  const orderBy = sort === "popular"
    ? "(COALESCE(view_count, 0) + COALESCE(share_count, 0) * 3) DESC, view_count DESC, numa DESC, created_at DESC"
    : "created_at DESC";

  const result = await db.prepare(
    `SELECT id, title, author, comment, sweetness, heaviness, numa, crying, spice, tags, dlsite_work_id, work_key, source, view_count, share_count, created_at
     FROM cards
     WHERE is_public = 1
     ORDER BY ${orderBy}
     LIMIT ? OFFSET ?`
  ).bind(limit, offset).all();

  return json({ cards: (result.results || []).map(normalizeCardRow), next_offset: offset + limit });
}

export async function onRequestPost(context) {
  const db = getDb(context);
  if (!db) return json({ error: "D1 database is not configured." }, 500);

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const payload = sanitizePayload(body);
  const validation = validatePayload(payload);
  if (validation) return json({ error: validation }, 400);

  const ip = context.request.headers.get("cf-connecting-ip") || "";
  const recent = await db.prepare(
    `SELECT created_at FROM cards WHERE ip_hash = ? ORDER BY created_at DESC LIMIT 1`
  ).bind(await sha256(`ip:${ip}`)).first();

  if (recent && Date.now() - new Date(`${recent.created_at}Z`).getTime() < 30000) {
    return json({ error: "連続投稿を防ぐため、少し待ってから投稿してください。" }, 429);
  }

  const id = crypto.randomUUID().slice(0, 8);
  const deletePasswordHash = payload.delete_password ? await sha256(`delete:${payload.delete_password}`) : null;
  const ipHash = await sha256(`ip:${ip}`);
  const createdAt = new Date().toISOString();
  const workKey = normalizeWorkKey(payload.title);

  await db.prepare(
    `INSERT INTO cards
      (id, title, author, comment, sweetness, heaviness, numa, crying, spice, tags, dlsite_work_id, work_key, source, view_count, share_count, delete_password_hash, created_at, is_public, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'user', 0, 0, ?, ?, 1, ?)`
  ).bind(
    id,
    payload.title,
    payload.author,
    payload.comment,
    payload.sweetness,
    payload.heaviness,
    payload.numa,
    payload.crying,
    payload.spice,
    JSON.stringify(payload.tags),
    payload.dlsite_work_id,
    workKey,
    deletePasswordHash,
    createdAt,
    ipHash
  ).run();

  return json({
    card: normalizeCardRow({
      id,
      title: payload.title,
      author: payload.author,
      comment: payload.comment,
      sweetness: payload.sweetness,
      heaviness: payload.heaviness,
      numa: payload.numa,
      crying: payload.crying,
      spice: payload.spice,
      tags: JSON.stringify(payload.tags),
      dlsite_work_id: payload.dlsite_work_id,
      work_key: workKey,
      source: "user",
      view_count: 0,
      share_count: 0,
      created_at: createdAt
    })
  }, 201);
}

function getDb(context) {
  return context.env.DB || context.env.DOKURYO_DB || null;
}

function sanitizePayload(body) {
  return {
    title: String(body.title || "").trim().slice(0, 80),
    author: String(body.author || "").trim().slice(0, 60),
    comment: String(body.comment || "").trim().slice(0, 160),
    sweetness: rating(body.sweetness),
    heaviness: rating(body.heaviness),
    numa: rating(body.numa),
    crying: rating(body.crying),
    spice: rating(body.spice),
    tags: Array.isArray(body.tags)
      ? body.tags.map((tag) => String(tag || "").trim()).filter((tag) => tag && ALLOWED_TAGS.has(tag)).slice(0, 5)
      : [],
    dlsite_work_id: "",
    delete_password: String(body.delete_password || "").slice(0, 80)
  };
}

function validatePayload(payload) {
  if (!payload.title) return "作品名は必須です。";
  const combined = `${payload.title} ${payload.author} ${payload.comment} ${payload.tags.join(" ")}`;
  if (/https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|jp|dev|io|site|xyz)\b/i.test(combined)) return "外部URLは投稿できません。";
  if (NG_WORDS.some((word) => combined.includes(word))) return "投稿できない言葉が含まれています。";
  return "";
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

function clampNumber(value, min, max, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
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
