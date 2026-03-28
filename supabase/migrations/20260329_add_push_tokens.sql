-- Add push_tokens table for Expo push notifications

CREATE TABLE IF NOT EXISTS push_tokens (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid NOT NULL REFERENCES profiles(id),
  expo_push_token   text NOT NULL,
  platform          text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  UNIQUE (expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_profile ON push_tokens (profile_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON push_tokens (expo_push_token) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: users can manage their own tokens
CREATE POLICY "push_token_self" ON push_tokens
  FOR ALL USING (profile_id = auth.uid());

-- Policy: service role can manage all tokens (for edge functions)
CREATE POLICY "push_token_service" ON push_tokens
  FOR ALL USING (true);
