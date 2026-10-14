CREATE TABLE IF NOT EXISTS interventions (
  id uuid PRIMARY KEY,
  site text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('routine', 'urgent')),
  created_at timestamptz NOT NULL
);
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key uuid PRIMARY KEY,
  fingerprint text NOT NULL,
  request_id uuid REFERENCES interventions(id),
  status integer,
  response jsonb,
  completed_at timestamptz,
  CHECK ((request_id IS NULL AND status IS NULL AND response IS NULL AND completed_at IS NULL)
      OR (request_id IS NOT NULL AND status = 201 AND response IS NOT NULL AND completed_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS keys_retention ON idempotency_keys(completed_at);
