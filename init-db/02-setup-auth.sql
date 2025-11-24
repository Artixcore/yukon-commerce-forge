-- Auth Setup for Local PostgreSQL
-- Creates simplified auth schema compatible with Supabase RLS policies
-- Note: This is a simplified version for local development

-- ============================================================================
-- AUTH SCHEMA
-- ============================================================================

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create simplified users table (mimics Supabase auth.users)
-- In production with Supabase, this table is managed by Supabase Auth
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  encrypted_password TEXT,
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  is_super_admin BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'authenticated'
);

-- Create function to get current user ID (auth.uid())
-- This function returns the current user ID from the session
-- For local development, we'll use a simple approach with a session variable
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
BEGIN
  -- In Supabase, this reads from the JWT token
  -- For local development, we'll return NULL (public access)
  -- Applications can set this via: SET LOCAL request.jwt.claim.sub = 'user-uuid';
  RETURN current_setting('request.jwt.claim.sub', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to get current user role (auth.role())
CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT AS $$
BEGIN
  RETURN current_setting('request.jwt.claim.role', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'anon';
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- UPDATE IS_ADMIN FUNCTION
-- ============================================================================

-- Update is_admin function to work with local auth
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- If no user ID, return false
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has admin role
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = current_user_id
    AND role = 'admin'::app_role
  );
END;
$$;

-- ============================================================================
-- HELPER FUNCTIONS FOR ADMIN SETUP
-- ============================================================================

-- Function to create an admin user
-- Usage: SELECT create_admin_user('user-uuid-here');
CREATE OR REPLACE FUNCTION public.create_admin_user(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update user role to admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_uuid, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Function to set current user context (for testing/admin operations)
-- Usage: SELECT set_user_context('user-uuid-here');
CREATE OR REPLACE FUNCTION public.set_user_context(user_uuid UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', user_uuid::TEXT, true);
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions for RLS to work
GRANT USAGE ON SCHEMA auth TO anon, authenticated, public;
GRANT SELECT ON auth.users TO anon, authenticated, public;

-- Grant execute on auth functions
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, public;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, public;

-- ============================================================================
-- NOTES
-- ============================================================================

-- For local development:
-- 1. RLS policies will work but auth.uid() will return NULL by default
-- 2. To test admin functions, you can:
--    - Create a user in auth.users
--    - Create a role in user_roles
--    - Use set_user_context() to set the current user
-- 3. For production with Supabase, this file should NOT be run
--    as Supabase manages the auth schema

