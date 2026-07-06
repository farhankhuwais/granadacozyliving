-- Insert profiles matching auth.users
INSERT INTO profiles (id, email, full_name, role, property_id)
SELECT 
  id, 
  email,
  CASE 
    WHEN email = 'admin@cozyliving.com' THEN 'Super Admin'
    WHEN email = 'investor@cozyliving.com' THEN 'Budi Santoso'
    WHEN email = 'manager@cozyliving.com' THEN 'Siti Nurhaliza'
  END,
  CASE 
    WHEN email = 'admin@cozyliving.com' THEN 'super_admin'::user_role
    WHEN email = 'investor@cozyliving.com' THEN 'investor_only'::user_role
    WHEN email = 'manager@cozyliving.com' THEN 'manager_only'::user_role
  END,
  CASE 
    WHEN email = 'admin@cozyliving.com' THEN NULL
    ELSE (SELECT id FROM properties ORDER BY created_at ASC LIMIT 1)
  END
FROM auth.users
WHERE email IN ('admin@cozyliving.com', 'investor@cozyliving.com', 'manager@cozyliving.com');

-- Verify profiles created
SELECT id, email, full_name, role, property_id FROM profiles;
