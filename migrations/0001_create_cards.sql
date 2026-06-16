CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT,
  comment TEXT,
  sweetness INTEGER NOT NULL DEFAULT 3,
  heaviness INTEGER NOT NULL DEFAULT 3,
  numa INTEGER NOT NULL DEFAULT 3,
  crying INTEGER NOT NULL DEFAULT 3,
  spice INTEGER NOT NULL DEFAULT 3,
  tags TEXT NOT NULL DEFAULT '[]',
  delete_password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_public INTEGER NOT NULL DEFAULT 1,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_cards_public_created
ON cards (is_public, created_at DESC);
