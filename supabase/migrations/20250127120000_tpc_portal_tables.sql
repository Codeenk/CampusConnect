-- TPC Portal Database Migration
-- This migration adds tables for TPC-specific functionality

-- TPC Export Jobs table
CREATE TABLE IF NOT EXISTS tpc_export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_ids UUID[] NOT NULL,
    student_count INTEGER NOT NULL DEFAULT 0,
    export_format TEXT NOT NULL DEFAULT 'pdf',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    filters JSONB DEFAULT '{}',
    download_url TEXT,
    file_size BIGINT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- Create indexes for tpc_export_jobs
CREATE INDEX IF NOT EXISTS idx_tpc_export_jobs_user_id ON tpc_export_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_tpc_export_jobs_status ON tpc_export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_tpc_export_jobs_created_at ON tpc_export_jobs(created_at DESC);

-- TPC Search History table
CREATE TABLE IF NOT EXISTS tpc_search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT,
    filters JSONB DEFAULT '{}',
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for tpc_search_history
CREATE INDEX IF NOT EXISTS idx_tpc_search_history_user_id ON tpc_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_tpc_search_history_created_at ON tpc_search_history(created_at DESC);

-- TPC Access Logs table (for audit trail)
CREATE TABLE IF NOT EXISTS tpc_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for tpc_access_logs
CREATE INDEX IF NOT EXISTS idx_tpc_access_logs_user_id ON tpc_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tpc_access_logs_student_id ON tpc_access_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_tpc_access_logs_action ON tpc_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_tpc_access_logs_created_at ON tpc_access_logs(created_at DESC);

-- Project Profiles table (for student projects)
CREATE TABLE IF NOT EXISTS project_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    technologies TEXT[],
    start_date DATE,
    end_date DATE,
    url TEXT,
    github_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for project_profiles
CREATE INDEX IF NOT EXISTS idx_project_profiles_user_id ON project_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_project_profiles_is_featured ON project_profiles(is_featured);

-- Experience Profiles table (for work experience)
CREATE TABLE IF NOT EXISTS experience_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    location TEXT,
    employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'internship', 'contract', 'freelance')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for experience_profiles
CREATE INDEX IF NOT EXISTS idx_experience_profiles_user_id ON experience_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_profiles_is_current ON experience_profiles(is_current);

-- Education Profiles table (for educational background)
CREATE TABLE IF NOT EXISTS education_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    field_of_study TEXT,
    start_year INTEGER,
    end_year INTEGER,
    gpa DECIMAL(3,2),
    description TEXT,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for education_profiles
CREATE INDEX IF NOT EXISTS idx_education_profiles_user_id ON education_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_education_profiles_is_current ON education_profiles(is_current);

-- Add RLS (Row Level Security) policies
ALTER TABLE tpc_export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpc_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tpc_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tpc_export_jobs
CREATE POLICY "Users can view their own export jobs" ON tpc_export_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own export jobs" ON tpc_export_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own export jobs" ON tpc_export_jobs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own export jobs" ON tpc_export_jobs
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for tpc_search_history
CREATE POLICY "Users can view their own search history" ON tpc_search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search history" ON tpc_search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for tpc_access_logs
CREATE POLICY "TPC admins can view access logs" ON tpc_access_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'tpc_admin'
        )
    );

CREATE POLICY "System can create access logs" ON tpc_access_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for project_profiles
CREATE POLICY "Users can view their own projects" ON project_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON project_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON project_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON project_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- TPC admins can view all projects
CREATE POLICY "TPC admins can view all projects" ON project_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'tpc_admin'
        )
    );

-- RLS Policies for experience_profiles
CREATE POLICY "Users can view their own experience" ON experience_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own experience" ON experience_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experience" ON experience_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experience" ON experience_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- TPC admins can view all experience
CREATE POLICY "TPC admins can view all experience" ON experience_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'tpc_admin'
        )
    );

-- RLS Policies for education_profiles
CREATE POLICY "Users can view their own education" ON education_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own education" ON education_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own education" ON education_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education" ON education_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- TPC admins can view all education
CREATE POLICY "TPC admins can view all education" ON education_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'tpc_admin'
        )
    );

-- Add triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_profiles_updated_at BEFORE UPDATE ON project_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experience_profiles_updated_at BEFORE UPDATE ON experience_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_profiles_updated_at BEFORE UPDATE ON education_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add function to clean up expired export jobs
CREATE OR REPLACE FUNCTION cleanup_expired_export_jobs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM tpc_export_jobs 
    WHERE status = 'completed' 
    AND expires_at < NOW() - INTERVAL '1 day';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to calculate profile completeness
CREATE OR REPLACE FUNCTION calculate_profile_completeness(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    profile_record profiles%ROWTYPE;
    project_count INTEGER;
    experience_count INTEGER;
    education_count INTEGER;
    completeness INTEGER := 0;
BEGIN
    -- Get profile data
    SELECT * INTO profile_record FROM profiles WHERE id = user_uuid;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Get related counts
    SELECT COUNT(*) INTO project_count FROM project_profiles WHERE user_id = user_uuid;
    SELECT COUNT(*) INTO experience_count FROM experience_profiles WHERE user_id = user_uuid;
    SELECT COUNT(*) INTO education_count FROM education_profiles WHERE user_id = user_uuid;
    
    -- Calculate completeness based on filled fields
    -- Basic info (40%)
    IF profile_record.full_name IS NOT NULL AND profile_record.full_name != '' THEN completeness := completeness + 10; END IF;
    IF profile_record.email IS NOT NULL AND profile_record.email != '' THEN completeness := completeness + 5; END IF;
    IF profile_record.phone IS NOT NULL AND profile_record.phone != '' THEN completeness := completeness + 5; END IF;
    IF profile_record.bio IS NOT NULL AND profile_record.bio != '' THEN completeness := completeness + 10; END IF;
    IF profile_record.location IS NOT NULL AND profile_record.location != '' THEN completeness := completeness + 5; END IF;
    IF profile_record.avatar_url IS NOT NULL AND profile_record.avatar_url != '' THEN completeness := completeness + 5; END IF;
    
    -- Academic info (30%)
    IF profile_record.department IS NOT NULL AND profile_record.department != '' THEN completeness := completeness + 10; END IF;
    IF profile_record.graduation_year IS NOT NULL THEN completeness := completeness + 5; END IF;
    IF profile_record.student_id IS NOT NULL AND profile_record.student_id != '' THEN completeness := completeness + 5; END IF;
    IF profile_record.gpa IS NOT NULL THEN completeness := completeness + 5; END IF;
    IF education_count > 0 THEN completeness := completeness + 5; END IF;
    
    -- Skills and projects (20%)
    IF profile_record.skills IS NOT NULL AND array_length(profile_record.skills, 1) > 0 THEN completeness := completeness + 10; END IF;
    IF project_count > 0 THEN completeness := completeness + 10; END IF;
    
    -- Experience and links (10%)
    IF experience_count > 0 THEN completeness := completeness + 5; END IF;
    IF profile_record.linkedin_url IS NOT NULL OR profile_record.github_url IS NOT NULL OR profile_record.portfolio_url IS NOT NULL THEN 
        completeness := completeness + 5; 
    END IF;
    
    RETURN LEAST(completeness, 100);
END;
$$ LANGUAGE plpgsql;

-- Add profile_completeness column to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completeness INTEGER DEFAULT 0;

-- Create trigger to update profile completeness
CREATE OR REPLACE FUNCTION update_profile_completeness()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles 
    SET profile_completeness = calculate_profile_completeness(NEW.user_id)
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for profile completeness updates
CREATE TRIGGER trigger_update_profile_completeness_projects
    AFTER INSERT OR UPDATE OR DELETE ON project_profiles
    FOR EACH ROW EXECUTE FUNCTION update_profile_completeness();

CREATE TRIGGER trigger_update_profile_completeness_experience
    AFTER INSERT OR UPDATE OR DELETE ON experience_profiles
    FOR EACH ROW EXECUTE FUNCTION update_profile_completeness();

CREATE TRIGGER trigger_update_profile_completeness_education
    AFTER INSERT OR UPDATE OR DELETE ON education_profiles
    FOR EACH ROW EXECUTE FUNCTION update_profile_completeness();

-- Update existing profiles completeness
UPDATE profiles SET profile_completeness = calculate_profile_completeness(id) WHERE role != 'tpc_admin';