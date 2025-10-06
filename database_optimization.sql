-- Database Performance Optimization SQL
-- Run these queries in your Supabase SQL Editor

-- 📊 CREATE INDEXES for better query performance

-- Profile queries optimization
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING gin (to_tsvector('english', name || ' ' || COALESCE(bio, '') || ' ' || COALESCE(department, '')));

-- Messages optimization
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_created ON messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read, created_at);

-- Posts optimization
CREATE INDEX IF NOT EXISTS idx_posts_author_created ON posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status_created ON posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_likes_count ON posts(likes_count DESC);

-- Comments optimization
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON post_comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_comments_author ON post_comments(author_id);

-- Likes optimization
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user ON post_likes(post_id, user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

-- Notifications optimization
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- 🔧 OPTIMIZE TABLE STATISTICS
ANALYZE profiles;
ANALYZE messages;
ANALYZE posts;
ANALYZE post_comments;
ANALYZE post_likes;
ANALYZE notifications;

-- 📈 CREATE MATERIALIZED VIEWS for complex queries
CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats AS
SELECT 
    p.user_id,
    p.name,
    p.role,
    COUNT(DISTINCT posts.id) as post_count,
    COUNT(DISTINCT post_likes.id) as likes_received,
    COUNT(DISTINCT endorsements.id) as endorsements_count,
    MAX(posts.created_at) as last_post_date
FROM profiles p
LEFT JOIN posts ON p.user_id = posts.author_id AND posts.status = 'published'
LEFT JOIN post_likes ON posts.id = post_likes.post_id
LEFT JOIN endorsements ON p.user_id = endorsements.endorsee_id
GROUP BY p.user_id, p.name, p.role;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);

-- 💬 CREATE VIEW for conversation summaries
CREATE OR REPLACE VIEW conversation_summaries AS
SELECT DISTINCT
    CASE 
        WHEN m1.sender_id < m1.receiver_id 
        THEN m1.sender_id 
        ELSE m1.receiver_id 
    END as user1_id,
    CASE 
        WHEN m1.sender_id < m1.receiver_id 
        THEN m1.receiver_id 
        ELSE m1.sender_id 
    END as user2_id,
    (
        SELECT m2.content
        FROM messages m2 
        WHERE (
            (m2.sender_id = CASE WHEN m1.sender_id < m1.receiver_id THEN m1.sender_id ELSE m1.receiver_id END
             AND m2.receiver_id = CASE WHEN m1.sender_id < m1.receiver_id THEN m1.receiver_id ELSE m1.sender_id END)
            OR 
            (m2.receiver_id = CASE WHEN m1.sender_id < m1.receiver_id THEN m1.sender_id ELSE m1.receiver_id END
             AND m2.sender_id = CASE WHEN m1.sender_id < m1.receiver_id THEN m1.receiver_id ELSE m1.sender_id END)
        )
        ORDER BY m2.created_at DESC 
        LIMIT 1
    ) as last_message,
    (
        SELECT m2.created_at
        FROM messages m2 
        WHERE (
            (m2.sender_id = CASE WHEN m1.sender_id < m1.receiver_id THEN m1.sender_id ELSE m1.receiver_id END
             AND m2.receiver_id = CASE WHEN m1.sender_id < m1.receiver_id THEN m1.receiver_id ELSE m1.sender_id END)
            OR 
            (m2.receiver_id = CASE WHEN m1.sender_id < m1.receiver_id THEN m1.sender_id ELSE m1.receiver_id END
             AND m2.sender_id = CASE WHEN m1.sender_id < m1.receiver_id THEN m1.receiver_id ELSE m1.sender_id END)
        )
        ORDER BY m2.created_at DESC 
        LIMIT 1
    ) as last_message_time,
    (
        SELECT COUNT(*)
        FROM messages m2 
        WHERE m2.receiver_id = CASE WHEN m1.sender_id < m1.receiver_id THEN m1.sender_id ELSE m1.receiver_id END
        AND m2.sender_id = CASE WHEN m1.sender_id < m1.receiver_id THEN m1.receiver_id ELSE m1.sender_id END
        AND m2.is_read = false
    ) as unread_count_user1,
    (
        SELECT COUNT(*)
        FROM messages m2 
        WHERE m2.receiver_id = CASE WHEN m1.sender_id < m1.receiver_id THEN m1.receiver_id ELSE m1.sender_id END
        AND m2.sender_id = CASE WHEN m1.sender_id < m1.receiver_id THEN m1.sender_id ELSE m1.receiver_id END
        AND m2.is_read = false
    ) as unread_count_user2
FROM messages m1;

-- 🔄 Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW user_stats;
END;
$$ LANGUAGE plpgsql;

-- 📅 Schedule materialized view refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-user-stats', '0 * * * *', 'SELECT refresh_materialized_views();');

-- 🧹 VACUUM and ANALYZE for better performance
VACUUM ANALYZE profiles;
VACUUM ANALYZE messages;
VACUUM ANALYZE posts;

-- 📊 Check index usage stats
-- Run this query to see which indexes are being used:
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as "Times Used",
    pg_size_pretty(pg_relation_size(indexrelname::regclass)) as "Index Size"
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
*/