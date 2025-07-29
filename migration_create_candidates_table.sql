-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    interview_id TEXT NOT NULL REFERENCES interview(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL,
    resume_filename TEXT NOT NULL,
    resume_file_url TEXT,
    ats_score INTEGER NOT NULL CHECK (ats_score >= 0 AND ats_score <= 100),
    ats_missing_skills TEXT[] DEFAULT '{}',
    ats_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_candidates_interview_id ON candidates(interview_id);
CREATE INDEX IF NOT EXISTS idx_candidates_organization_id ON candidates(organization_id);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at DESC);

-- Add comments to explain the table structure
COMMENT ON TABLE candidates IS 'Stores candidate information and ATS analysis results';
COMMENT ON COLUMN candidates.ats_score IS 'ATS match score (0-100)';
COMMENT ON COLUMN candidates.ats_missing_skills IS 'Array of missing skills identified by ATS';
COMMENT ON COLUMN candidates.ats_feedback IS 'Detailed feedback from ATS analysis'; 
