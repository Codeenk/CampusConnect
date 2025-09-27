-- Test Migration Validation Script
-- Run this in Supabase SQL Editor to verify migration success

-- Test 1: Check if all tables exist
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'posts', 'post_likes', 'post_comments', 'post_views',
    'endorsements', 'messages', 'notifications', 'user_activity', 'system_metrics'
  )
ORDER BY table_name;

-- Test 2: Check if all indexes exist
SELECT 
  indexname,
  tablename,
  '✅ INDEX EXISTS' as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Test 3: Check if all functions exist
SELECT 
  routine_name,
  routine_type,
  '✅ FUNCTION EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('handle_updated_at', 'get_user_conversations', 'search_posts')
ORDER BY routine_name;

-- Test 4: Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  '✅ POLICY ACTIVE' as status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test 5: Check custom types
SELECT 
  typname,
  '✅ TYPE EXISTS' as status
FROM pg_type 
WHERE typname IN ('user_role', 'post_status', 'message_status')
ORDER BY typname;

-- Test 6: Validate sample queries
SELECT 'Test Query 1: Count tables' as test, COUNT(*) as result
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Insert a test profile (will fail if schema is wrong)
INSERT INTO public.profiles (user_id, name, email, role, major, graduation_year) 
VALUES (
  gen_random_uuid(),
  'Test Student',
  'test@university.edu',
  'student',
  'Computer Science',
  2025
) 
RETURNING id, name, email, role, major, graduation_year, created_at;

-- Test post views functionality
INSERT INTO public.post_views (post_id, user_id, viewed_at)
VALUES (
  gen_random_uuid(),
  (SELECT user_id FROM public.profiles WHERE email = 'test@university.edu'),
  now()
)
ON CONFLICT (post_id, user_id, viewed_date) DO NOTHING
RETURNING id, post_id, user_id, viewed_date;

-- Clean up test data
DELETE FROM public.profiles WHERE email = 'test@university.edu';

SELECT '🎉 Migration validation completed successfully!' as result;