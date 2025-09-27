-- Campus Connect Database Schema v2.0
-- Scalable, Production-Ready Migration
-- Date: 2025-01-26

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for fresh start)
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.endorsements CASCADE;
DROP TABLE IF EXISTS public.post_comments CASCADE;
DROP TABLE IF EXISTS public.post_likes CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.post_status CASCADE;
DROP TYPE IF EXISTS public.message_status CASCADE;

-- Create custom types
CREATE TYPE public.user_role AS ENUM ('student', 'faculty', 'admin');
CREATE TYPE public.post_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE public.message_status AS ENUM ('sent', 'delivered', 'read');

-- ========================================
-- PROFILES TABLE (User Management)
-- ========================================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name text NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  email text UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  role user_role NOT NULL DEFAULT 'student',
  
  -- Academic Information
  department text DEFAULT '',
  year integer DEFAULT NULL CHECK (year IS NULL OR (year >= 1 AND year <= 10)),
  student_id text DEFAULT '',
  
  -- Profile Details
  bio text DEFAULT '' CHECK (char_length(bio) <= 1000),
  avatar_url text DEFAULT '',
  skills jsonb DEFAULT '[]'::jsonb,
  interests jsonb DEFAULT '[]'::jsonb,
  achievements jsonb DEFAULT '[]'::jsonb,
  
  -- Contact Information
  phone text DEFAULT '',
  github_url text DEFAULT '',
  linkedin_url text DEFAULT '',
  portfolio_url text DEFAULT '',
  
  -- System Fields
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  last_login timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ========================================
-- POSTS TABLE (Projects/Content)
-- ========================================
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL CHECK (char_length(title) >= 5 AND char_length(title) <= 200),
  description text NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 5000),
  content text DEFAULT '',
  
  -- Post Metadata
  tags jsonb DEFAULT '[]'::jsonb,
  category text DEFAULT '',
  status post_status DEFAULT 'published',
  
  -- Media and Links
  images jsonb DEFAULT '[]'::jsonb,
  videos jsonb DEFAULT '[]'::jsonb,
  documents jsonb DEFAULT '[]'::jsonb,
  github_repo text DEFAULT '',
  live_demo_url text DEFAULT '',
  
  -- Analytics
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  
  -- Relationships
  created_by uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  
  -- System Fields
  is_featured boolean DEFAULT false,
  is_trending boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ========================================
-- POST INTERACTIONS
-- ========================================

-- Post Likes
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Post Comments
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  parent_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE DEFAULT NULL,
  
  content text NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  
  -- Analytics
  likes_count integer DEFAULT 0,
  replies_count integer DEFAULT 0,
  
  -- System Fields
  is_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Post Views (for analytics)
CREATE TABLE public.post_views (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  ip_address inet,
  user_agent text DEFAULT '',
  viewed_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id, DATE(viewed_at))
);

-- ========================================
-- ENDORSEMENTS SYSTEM
-- ========================================
CREATE TABLE public.endorsements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  faculty_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  
  -- Endorsement Details
  endorsement_text text DEFAULT '' CHECK (char_length(endorsement_text) <= 2000),
  skills_endorsed jsonb DEFAULT '[]'::jsonb,
  rating integer DEFAULT NULL CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  
  -- System Fields
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  UNIQUE(student_id, faculty_id, post_id)
);

-- ========================================
-- MESSAGING SYSTEM
-- ========================================
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  
  -- Message Content
  message text NOT NULL CHECK (char_length(message) >= 1 AND char_length(message) <= 5000),
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'link')),
  attachments jsonb DEFAULT '[]'::jsonb,
  
  -- Message Status
  status message_status DEFAULT 'sent',
  is_read boolean DEFAULT false,
  read_at timestamptz DEFAULT NULL,
  
  -- System Fields
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ========================================
-- NOTIFICATIONS SYSTEM
-- ========================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  
  -- Notification Details
  type text NOT NULL CHECK (type IN ('like', 'comment', 'endorsement', 'message', 'mention', 'follow')),
  title text NOT NULL,
  content text NOT NULL,
  
  -- Related Data
  related_user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  related_post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  related_comment_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  
  -- Notification State
  is_read boolean DEFAULT false,
  read_at timestamptz DEFAULT NULL,
  
  -- System Fields
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ========================================
-- ANALYTICS TABLES
-- ========================================

-- User Activity Log
CREATE TABLE public.user_activity (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  resource_type text DEFAULT '',
  resource_id uuid DEFAULT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- System Metrics
CREATE TABLE public.system_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  metric_date date DEFAULT CURRENT_DATE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(metric_name, metric_date)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Profiles indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_department ON public.profiles(department);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Posts indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_created_by ON public.posts(created_by);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_likes_count ON public.posts(likes_count DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_tags ON public.posts USING GIN(tags);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_category ON public.posts(category);

-- Post interactions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);

-- Endorsements indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_endorsements_student_id ON public.endorsements(student_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_endorsements_faculty_id ON public.endorsements(faculty_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_endorsements_post_id ON public.endorsements(post_id);

-- Messages indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_receiver_unread ON public.messages(receiver_id, is_read, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Notifications indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read, created_at DESC);

-- ========================================
-- TRIGGERS AND FUNCTIONS
-- ========================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_endorsements_updated_at
  BEFORE UPDATE ON public.endorsements
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Post likes count trigger
CREATE OR REPLACE FUNCTION public.handle_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER handle_post_likes_count_trigger
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_likes_count();

-- Post comments count trigger
CREATE OR REPLACE FUNCTION public.handle_post_comments_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER handle_post_comments_count_trigger
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_comments_count();

-- Post views count trigger
CREATE OR REPLACE FUNCTION public.handle_post_views_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.posts SET views_count = views_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_post_views_count_trigger
  AFTER INSERT ON public.post_views
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_views_count();

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Posts policies
CREATE POLICY "Posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (status = 'published' OR created_by = auth.uid());

CREATE POLICY "Authenticated users can insert posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = created_by);

-- Post likes policies
CREATE POLICY "Post likes are viewable by everyone"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view their own messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Get user conversations with latest message
CREATE OR REPLACE FUNCTION public.get_user_conversations(user_id uuid)
RETURNS TABLE (
  partner_id uuid,
  partner_name text,
  partner_role user_role,
  partner_avatar_url text,
  last_message text,
  last_message_time timestamptz,
  unread_count bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH conversation_partners AS (
    SELECT 
      CASE 
        WHEN m.sender_id = user_id THEN m.receiver_id
        ELSE m.sender_id
      END as partner_id,
      MAX(m.created_at) as last_message_time
    FROM public.messages m
    WHERE m.sender_id = user_id OR m.receiver_id = user_id
    GROUP BY partner_id
  ),
  latest_messages AS (
    SELECT DISTINCT ON (cp.partner_id)
      cp.partner_id,
      cp.last_message_time,
      m.message as last_message
    FROM conversation_partners cp
    JOIN public.messages m ON (
      (m.sender_id = user_id AND m.receiver_id = cp.partner_id) OR
      (m.sender_id = cp.partner_id AND m.receiver_id = user_id)
    )
    WHERE m.created_at = cp.last_message_time
    ORDER BY cp.partner_id, m.created_at DESC
  )
  SELECT 
    lm.partner_id,
    p.name as partner_name,
    p.role as partner_role,
    p.avatar_url as partner_avatar_url,
    lm.last_message,
    lm.last_message_time,
    COALESCE(unread.unread_count, 0) as unread_count
  FROM latest_messages lm
  JOIN public.profiles p ON p.user_id = lm.partner_id
  LEFT JOIN (
    SELECT 
      sender_id,
      COUNT(*) as unread_count
    FROM public.messages
    WHERE receiver_id = user_id AND is_read = false
    GROUP BY sender_id
  ) unread ON unread.sender_id = lm.partner_id
  ORDER BY lm.last_message_time DESC;
END;
$$;

-- Search posts function
CREATE OR REPLACE FUNCTION public.search_posts(
  search_query text DEFAULT '',
  filter_role user_role DEFAULT NULL,
  filter_department text DEFAULT NULL,
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  tags jsonb,
  created_by uuid,
  creator_name text,
  creator_role user_role,
  creator_department text,
  likes_count integer,
  comments_count integer,
  created_at timestamptz
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.description,
    p.tags,
    p.created_by,
    pr.name as creator_name,
    pr.role as creator_role,
    pr.department as creator_department,
    p.likes_count,
    p.comments_count,
    p.created_at
  FROM public.posts p
  JOIN public.profiles pr ON pr.user_id = p.created_by
  WHERE 
    p.status = 'published'
    AND (
      search_query = '' OR
      p.title ILIKE '%' || search_query || '%' OR
      p.description ILIKE '%' || search_query || '%' OR
      EXISTS (
        SELECT 1 FROM jsonb_array_elements_text(p.tags) tag 
        WHERE tag ILIKE '%' || search_query || '%'
      )
    )
    AND (filter_role IS NULL OR pr.role = filter_role)
    AND (filter_department IS NULL OR pr.department = filter_department)
  ORDER BY p.created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$;

-- ========================================
-- SAMPLE DATA INSERTION
-- ========================================

-- Insert sample admin user (you should update this with real data)
INSERT INTO public.profiles (
  user_id,
  name,
  email,
  role,
  department,
  bio
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin User',
  'admin@campusconnect.com',
  'admin',
  'Administration',
  'System Administrator'
) ON CONFLICT (user_id) DO NOTHING;

-- ========================================
-- FINAL GRANTS AND PERMISSIONS
-- ========================================

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.posts TO authenticated;
GRANT ALL ON public.post_likes TO authenticated;
GRANT ALL ON public.post_comments TO authenticated;
GRANT ALL ON public.post_views TO authenticated;
GRANT ALL ON public.endorsements TO authenticated;
GRANT ALL ON public.messages TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.user_activity TO authenticated;
GRANT ALL ON public.system_metrics TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_user_conversations(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_posts(text, user_role, text, integer, integer) TO authenticated;

-- Enable real-time subscriptions for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;