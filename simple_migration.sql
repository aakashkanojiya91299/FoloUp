-- Simple migration to add interview_id columns
-- Run this in your Supabase SQL Editor

-- 1. Add interview_id column to existing interviewees table
ALTER TABLE interviewees 
ADD COLUMN IF NOT EXISTS interview_id TEXT REFERENCES interview(id);

-- 2. Add interview_id column to existing resumes table
ALTER TABLE resumes 
ADD COLUMN IF NOT EXISTS interview_id TEXT REFERENCES interview(id);

-- 3. Add interview_id column to existing resume_analyses table
ALTER TABLE resume_analyses 
ADD COLUMN IF NOT EXISTS interview_id TEXT REFERENCES interview(id);

-- 4. Add ai_provider column to existing resume_analyses table
ALTER TABLE resume_analyses 
ADD COLUMN IF NOT EXISTS ai_provider ai_provider;

-- 5. Add interview_id column to existing ats_job_requirements table
ALTER TABLE ats_job_requirements 
ADD COLUMN IF NOT EXISTS interview_id TEXT REFERENCES interview(id);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interviewees_interview ON interviewees(interview_id);
CREATE INDEX IF NOT EXISTS idx_resumes_interview ON resumes(interview_id);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_interview ON resume_analyses(interview_id);
CREATE INDEX IF NOT EXISTS idx_ats_job_requirements_interview ON ats_job_requirements(interview_id);

-- 7. Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('interviewees', 'resumes', 'resume_analyses', 'ats_job_requirements')
AND column_name = 'interview_id'
ORDER BY table_name, column_name; 
