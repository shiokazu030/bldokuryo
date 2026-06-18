ALTER TABLE cards ADD COLUMN dlsite_work_id TEXT;

CREATE INDEX IF NOT EXISTS idx_cards_dlsite_work_id
ON cards (dlsite_work_id);
