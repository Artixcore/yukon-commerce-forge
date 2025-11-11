-- Create meta_settings table to store Meta API credentials
CREATE TABLE IF NOT EXISTS meta_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  pixel_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  test_event_code TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one row exists (singleton pattern)
  CONSTRAINT singleton_check CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- RLS Policies
ALTER TABLE meta_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can view meta settings"
  ON meta_settings FOR SELECT
  USING (is_admin());

-- Only admins can manage
CREATE POLICY "Admins can manage meta settings"
  ON meta_settings FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create index for faster lookups
CREATE UNIQUE INDEX idx_meta_settings_singleton ON meta_settings (id);

-- Add updated_at trigger
CREATE TRIGGER update_meta_settings_updated_at
  BEFORE UPDATE ON meta_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();