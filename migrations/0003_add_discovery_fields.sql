ALTER TABLE cards ADD COLUMN work_key TEXT;
ALTER TABLE cards ADD COLUMN source TEXT NOT NULL DEFAULT 'user';
ALTER TABLE cards ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cards ADD COLUMN share_count INTEGER NOT NULL DEFAULT 0;

UPDATE cards
SET work_key = lower(trim(title))
WHERE work_key IS NULL OR work_key = '';

UPDATE cards SET work_key = '恋の温度は夜にほどける' WHERE id = 'sample-001';
UPDATE cards SET work_key = 'まばたきの先で君を抱く' WHERE id = 'sample-002';
UPDATE cards SET work_key = 'きみの熱だけで眠れない' WHERE id = 'sample-003';

UPDATE cards
SET source = 'sample'
WHERE ip_hash = 'sample';

CREATE INDEX IF NOT EXISTS idx_cards_work_key_created
ON cards (work_key, is_public, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cards_public_popular
ON cards (is_public, view_count DESC, numa DESC, created_at DESC);
