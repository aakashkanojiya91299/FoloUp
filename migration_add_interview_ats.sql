-- Migration script to add interview_id columns and new ATS tables
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

-- 7. Update existing RLS policies to include interview_id checks
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view interviewees from their organization" ON interviewees;
DROP POLICY IF EXISTS "Users can insert interviewees to their organization" ON interviewees;
DROP POLICY IF EXISTS "Users can update interviewees from their organization" ON interviewees;
DROP POLICY IF EXISTS "Users can delete interviewees from their organization" ON interviewees;

-- Recreate policies with proper organization_id checks
CREATE POLICY "Users can view interviewees from their organization" ON interviewees
    FOR SELECT USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can insert interviewees to their organization" ON interviewees
    FOR INSERT WITH CHECK (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can update interviewees from their organization" ON interviewees
    FOR UPDATE USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can delete interviewees from their organization" ON interviewees
    FOR DELETE USING (organization_id::text = auth.jwt() ->> 'org_id');

-- 8. Update resume policies
DROP POLICY IF EXISTS "Users can view resumes from their organization" ON resumes;
DROP POLICY IF EXISTS "Users can insert resumes to their organization" ON resumes;
DROP POLICY IF EXISTS "Users can update resumes from their organization" ON resumes;
DROP POLICY IF EXISTS "Users can delete resumes from their organization" ON resumes;

CREATE POLICY "Users can view resumes from their organization" ON resumes
    FOR SELECT USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can insert resumes to their organization" ON resumes
    FOR INSERT WITH CHECK (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can update resumes from their organization" ON resumes
    FOR UPDATE USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can delete resumes from their organization" ON resumes
    FOR DELETE USING (organization_id::text = auth.jwt() ->> 'org_id');

-- 9. Update resume_analyses policies
DROP POLICY IF EXISTS "Users can view resume analyses from their organization" ON resume_analyses;
DROP POLICY IF EXISTS "Users can insert resume analyses to their organization" ON resume_analyses;
DROP POLICY IF EXISTS "Users can update resume analyses from their organization" ON resume_analyses;
DROP POLICY IF EXISTS "Users can delete resume analyses from their organization" ON resume_analyses;

CREATE POLICY "Users can view resume analyses from their organization" ON resume_analyses
    FOR SELECT USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can insert resume analyses to their organization" ON resume_analyses
    FOR INSERT WITH CHECK (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can update resume analyses from their organization" ON resume_analyses
    FOR UPDATE USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can delete resume analyses from their organization" ON resume_analyses
    FOR DELETE USING (organization_id::text = auth.jwt() ->> 'org_id');

-- 10. Update ats_job_requirements policies
DROP POLICY IF EXISTS "Users can view job requirements from their organization" ON ats_job_requirements;
DROP POLICY IF EXISTS "Users can insert job requirements to their organization" ON ats_job_requirements;
DROP POLICY IF EXISTS "Users can update job requirements from their organization" ON ats_job_requirements;
DROP POLICY IF EXISTS "Users can delete job requirements from their organization" ON ats_job_requirements;

CREATE POLICY "Users can view job requirements from their organization" ON ats_job_requirements
    FOR SELECT USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can insert job requirements to their organization" ON ats_job_requirements
    FOR INSERT WITH CHECK (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can update job requirements from their organization" ON ats_job_requirements
    FOR UPDATE USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can delete job requirements from their organization" ON ats_job_requirements
    FOR DELETE USING (organization_id::text = auth.jwt() ->> 'org_id');

-- 11. Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('interviewees', 'resumes', 'resume_analyses', 'ats_job_requirements')
AND column_name = 'interview_id'
ORDER BY table_name, column_name; 
