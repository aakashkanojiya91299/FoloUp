-- Applications Feature Database Schema (Debug Version)
-- Run this in your Supabase SQL Editor for testing

-- Create enum types for the new tables
CREATE TYPE interviewee_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE resume_status AS ENUM ('pending', 'processed', 'failed');

-- Create interviewees table
CREATE TABLE interviewees (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    organization_id TEXT REFERENCES organization(id),
    status interviewee_status DEFAULT 'active',
    notes TEXT
);

-- Create resumes table
CREATE TABLE resumes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    interviewee_id TEXT REFERENCES interviewees(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    parsed_content TEXT,
    ats_score INTEGER,
    skills TEXT[],
    experience_years INTEGER,
    education TEXT[],
    certifications TEXT[],
    languages TEXT[],
    status resume_status DEFAULT 'pending',
    processing_notes TEXT
);

-- Create resume_analyses table
CREATE TABLE resume_analyses (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    resume_id TEXT REFERENCES resumes(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL,
    skills_match INTEGER NOT NULL,
    experience_match INTEGER NOT NULL,
    education_match INTEGER NOT NULL,
    technical_skills TEXT[],
    soft_skills TEXT[],
    experience_summary TEXT,
    education_summary TEXT,
    recommendations TEXT[]
);

-- Create ats_job_requirements table
CREATE TABLE ats_job_requirements (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    organization_id TEXT REFERENCES organization(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT[],
    preferred_skills TEXT[],
    experience_required INTEGER,
    education_required TEXT[]
);

-- Create indexes for better performance
CREATE INDEX idx_interviewees_organization ON interviewees(organization_id);
CREATE INDEX idx_interviewees_status ON interviewees(status);
CREATE INDEX idx_resumes_interviewee ON resumes(interviewee_id);
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_resume_analyses_resume ON resume_analyses(resume_id);
CREATE INDEX idx_ats_job_requirements_organization ON ats_job_requirements(organization_id);

-- Enable Row Level Security (RLS)
ALTER TABLE interviewees ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_job_requirements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view interviewees from their organization" ON interviewees;
DROP POLICY IF EXISTS "Users can insert interviewees to their organization" ON interviewees;
DROP POLICY IF EXISTS "Users can update interviewees from their organization" ON interviewees;
DROP POLICY IF EXISTS "Users can delete interviewees from their organization" ON interviewees;

-- Create DEBUG RLS policies for interviewees (more permissive for testing)
CREATE POLICY "Users can view interviewees from their organization" ON interviewees
    FOR SELECT USING (true);

CREATE POLICY "Users can insert interviewees to their organization" ON interviewees
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update interviewees from their organization" ON interviewees
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete interviewees from their organization" ON interviewees
    FOR DELETE USING (true);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view resumes from their organization" ON resumes;
DROP POLICY IF EXISTS "Users can insert resumes to their organization" ON resumes;
DROP POLICY IF EXISTS "Users can update resumes from their organization" ON resumes;
DROP POLICY IF EXISTS "Users can delete resumes from their organization" ON resumes;

-- Create DEBUG RLS policies for resumes (more permissive for testing)
CREATE POLICY "Users can view resumes from their organization" ON resumes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert resumes to their organization" ON resumes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update resumes from their organization" ON resumes
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete resumes from their organization" ON resumes
    FOR DELETE USING (true);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view resume analyses from their organization" ON resume_analyses;
DROP POLICY IF EXISTS "Users can insert resume analyses to their organization" ON resume_analyses;

-- Create DEBUG RLS policies for resume analyses (more permissive for testing)
CREATE POLICY "Users can view resume analyses from their organization" ON resume_analyses
    FOR SELECT USING (true);

CREATE POLICY "Users can insert resume analyses to their organization" ON resume_analyses
    FOR INSERT WITH CHECK (true);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view job requirements from their organization" ON ats_job_requirements;
DROP POLICY IF EXISTS "Users can insert job requirements to their organization" ON ats_job_requirements;
DROP POLICY IF EXISTS "Users can update job requirements from their organization" ON ats_job_requirements;
DROP POLICY IF EXISTS "Users can delete job requirements from their organization" ON ats_job_requirements;

-- Create DEBUG RLS policies for ATS job requirements (more permissive for testing)
CREATE POLICY "Users can view job requirements from their organization" ON ats_job_requirements
    FOR SELECT USING (true);

CREATE POLICY "Users can insert job requirements to their organization" ON ats_job_requirements
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update job requirements from their organization" ON ats_job_requirements
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete job requirements from their organization" ON ats_job_requirements
    FOR DELETE USING (true);

-- Create storage bucket for resumes (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload resumes to their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can view resumes from their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can update resumes from their organization" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete resumes from their organization" ON storage.objects;

-- Create DEBUG storage policies for resumes bucket (more permissive for testing)
CREATE POLICY "Users can upload resumes to their organization" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Users can view resumes from their organization" ON storage.objects
    FOR SELECT USING (bucket_id = 'resumes');

CREATE POLICY "Users can update resumes from their organization" ON storage.objects
    FOR UPDATE USING (bucket_id = 'resumes');

CREATE POLICY "Users can delete resumes from their organization" ON storage.objects
    FOR DELETE USING (bucket_id = 'resumes'); 
