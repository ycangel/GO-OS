-- Historical v0.3.1 authority-persistence prototype.
-- The active Sites/Drizzle migration chain lives in web/drizzle/. For the
-- canonical v0.5 table and seed grants, see 0002_talented_silk_fever.sql.

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
