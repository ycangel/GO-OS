-- GO OS v0.3.1 Authority Runtime
-- Constitutional persistence layer

CREATE TABLE IF NOT EXISTS authority_grants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grantor TEXT NOT NULL,
  grantee TEXT NOT NULL,
  allowed_actions TEXT NOT NULL,
  prohibited_actions TEXT NOT NULL,
  limits TEXT NOT NULL,
  reversibility_ceiling TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  self_expansion_allowed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
