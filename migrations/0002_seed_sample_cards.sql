INSERT OR REPLACE INTO cards
  (id, title, author, comment, sweetness, heaviness, numa, crying, spice, tags, delete_password_hash, created_at, is_public, ip_hash)
VALUES
  (
    'sample-001',
    '恋の温度は夜にほどける',
    '浅月めぐ',
    '甘さの奥にある重さが刺さって、最後の余韻まで大好き。',
    4, 4, 5, 2, 3,
    '["両片想い","重い愛","余韻強め","商業BL"]',
    NULL,
    '2026-06-16T11:00:00.000Z',
    1,
    'sample'
  ),
  (
    'sample-002',
    'まばたきの先で君を抱く',
    '瀬戸ひより',
    'すれ違いが長くてしんどいのに、最後の回収で全部報われるタイプ。',
    3, 5, 5, 4, 2,
    '["すれ違い","泣ける","執着攻め","重め"]',
    NULL,
    '2026-06-15T09:30:00.000Z',
    1,
    'sample'
  ),
  (
    'sample-003',
    'きみの熱だけで眠れない',
    '梓井いろは',
    '軽やかに読めるのに沼度が高い。ケンカップル好きにかなり効く。',
    4, 2, 4, 1, 4,
    '["ケンカップル","甘々","商業BL"]',
    NULL,
    '2026-06-14T13:15:00.000Z',
    1,
    'sample'
  );
