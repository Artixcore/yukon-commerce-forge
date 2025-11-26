-- Admin User Seed Script
-- Creates default admin user with specified credentials
-- This script runs after schema and auth setup

-- ============================================================================
-- ADMIN USER CREATION
-- ============================================================================

-- Generate a fixed UUID for the admin user (for consistency)
-- Using a deterministic UUID based on the email
DO $$
DECLARE
    admin_user_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; -- Fixed UUID for admin user
    -- Admin email domain can be customized via environment variable YUKON_DOMAIN
    -- Defaults to 'yukonlifestyle.com' if not set
    admin_email TEXT := 'admin@' || COALESCE(current_setting('app.yukon_domain', true), 'yukonlifestyle.com');
    admin_password TEXT := 'Admin@@11@@22@@33##';
    hashed_password TEXT;
BEGIN
    -- Hash the password using bcrypt
    -- gen_salt('bf') generates a bcrypt salt with default cost factor (10)
    hashed_password := crypt(admin_password, gen_salt('bf'));
    
    -- Insert or update admin user in auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        role
    ) VALUES (
        admin_user_id,
        admin_email,
        hashed_password,
        now(), -- Email confirmed immediately for admin
        now(),
        now(),
        'authenticated'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        encrypted_password = EXCLUDED.encrypted_password,
        email_confirmed_at = COALESCE(auth.users.email_confirmed_at, EXCLUDED.email_confirmed_at),
        updated_at = now(),
        role = EXCLUDED.role;
    
    -- Insert or update admin role in user_roles
    INSERT INTO public.user_roles (
        user_id,
        role,
        created_at
    ) VALUES (
        admin_user_id,
        'admin'::public.app_role,
        now()
    )
    ON CONFLICT (user_id, role) DO UPDATE
    SET
        created_at = COALESCE(public.user_roles.created_at, now());
    
    RAISE NOTICE 'Admin user created/updated successfully: %', admin_email;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify admin user was created
DO $$
DECLARE
    admin_count INTEGER;
    role_count INTEGER;
    -- Use the same email domain logic as above
    admin_email_check TEXT := 'admin@' || COALESCE(current_setting('app.yukon_domain', true), 'yukonlifestyle.com');
BEGIN
    SELECT COUNT(*) INTO admin_count
    FROM auth.users
    WHERE email = admin_email_check;
    
    SELECT COUNT(*) INTO role_count
    FROM public.user_roles ur
    JOIN auth.users u ON ur.user_id = u.id
    WHERE u.email = admin_email_check
    AND ur.role = 'admin'::public.app_role;
    
    IF admin_count > 0 AND role_count > 0 THEN
        RAISE NOTICE 'Admin user verification: SUCCESS (User: %, Admin Role: %)', admin_count, role_count;
    ELSE
        RAISE WARNING 'Admin user verification: FAILED (User: %, Admin Role: %)', admin_count, role_count;
    END IF;
END $$;

