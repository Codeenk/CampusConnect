-- TPC Portal Database Migration
-- This migration adds tables needed for the TPC (Training and Placement Cell) portal
-- These tables are separate from student data and only store TPC-specific operations

-- Create TPC export jobs table for tracking batch resume exports
CREATE TABLE IF NOT EXISTS public.tpc_export_jobs (
  id text PRIMARY KEY,
  created_by uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  total integer DEFAULT 0,
  processed integer DEFAULT 0,
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  artifact_url text DEFAULT NULL,
  error_message text DEFAULT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz DEFAULT NULL
);

-- Create TPC export artifacts table for storing download history
CREATE TABLE IF NOT EXISTS public.tpc_export_artifacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id text REFERENCES public.tpc_export_jobs(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  file_size bigint DEFAULT 0,
  download_url text NOT NULL,
  expires_at timestamptz NOT NULL,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tpc_export_jobs_created_by ON public.tpc_export_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_tpc_export_jobs_status ON public.tpc_export_jobs(status);
CREATE INDEX IF NOT EXISTS idx_tpc_export_jobs_created_at ON public.tpc_export_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tpc_export_artifacts_job_id ON public.tpc_export_artifacts(job_id);
CREATE INDEX IF NOT EXISTS idx_tpc_export_artifacts_created_by ON public.tpc_export_artifacts(created_by);
CREATE INDEX IF NOT EXISTS idx_tpc_export_artifacts_expires_at ON public.tpc_export_artifacts(expires_at);

-- Add RLS policies for TPC tables
ALTER TABLE public.tpc_export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tpc_export_artifacts ENABLE ROW LEVEL SECURITY;

-- Policy: TPC admins can manage their own export jobs
CREATE POLICY "TPC admins can manage export jobs" ON public.tpc_export_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'tpc_admin')
    )
  );

-- Policy: TPC admins can manage their own export artifacts
CREATE POLICY "TPC admins can manage export artifacts" ON public.tpc_export_artifacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'tpc_admin')
    )
  );

-- Add TPC admin role to user_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('student', 'faculty', 'admin');
  END IF;
  
  -- Add tpc_admin if it doesn't exist
  BEGIN
    ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'tpc_admin';
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Create recommended indexes for student search performance
-- These indexes improve search performance without breaking existing functionality

-- Index for student search by name and email
CREATE INDEX IF NOT EXISTS idx_profiles_student_search 
ON public.profiles USING gin (to_tsvector('english', name || ' ' || email))
WHERE role = 'student';

-- Index for filtering by department and year
CREATE INDEX IF NOT EXISTS idx_profiles_dept_year 
ON public.profiles(department, year) 
WHERE role = 'student';

-- Index for graduation year filtering
CREATE INDEX IF NOT EXISTS idx_profiles_graduation_year 
ON public.profiles(graduation_year) 
WHERE role = 'student' AND graduation_year IS NOT NULL;

-- Index for skills search (JSONB GIN index)
CREATE INDEX IF NOT EXISTS idx_profiles_skills_gin 
ON public.profiles USING gin (skills)
WHERE role = 'student';

-- Index for student role filtering (if not exists)
CREATE INDEX IF NOT EXISTS idx_profiles_role_student 
ON public.profiles(role) 
WHERE role = 'student';

-- Function to clean up expired export artifacts
CREATE OR REPLACE FUNCTION cleanup_expired_tpc_artifacts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.tpc_export_artifacts 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment the migration
COMMENT ON TABLE public.tpc_export_jobs IS 'TPC portal batch export job tracking';
COMMENT ON TABLE public.tpc_export_artifacts IS 'TPC portal export file download history';
COMMENT ON FUNCTION cleanup_expired_tpc_artifacts() IS 'Cleanup function for expired TPC export artifacts';

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.tpc_export_jobs TO authenticated;
GRANT ALL ON public.tpc_export_artifacts TO authenticated;