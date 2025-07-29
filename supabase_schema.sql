-- Create enum type for plan
CREATE TYPE plan AS ENUM ('free', 'pro', 'free_trial_over');

-- Create enum type for AI provider
CREATE TYPE ai_provider AS ENUM ('openai', 'gemini');

-- Create enum type for interviewee status
CREATE TYPE interviewee_status AS ENUM ('active', 'inactive', 'archived');

-- Create enum type for resume status
CREATE TYPE resume_status AS ENUM ('pending', 'processed', 'failed');

-- Create tables
CREATE TABLE organization (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    name TEXT,
    image_url TEXT,
    allowed_responses_count INTEGER,
    plan plan
);

CREATE TABLE "user" (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    email TEXT,
    organization_id TEXT REFERENCES organization(id)
);

-- AI Provider Preferences table
CREATE TABLE ai_provider_preferences (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    organization_id TEXT REFERENCES organization(id),
    user_id TEXT REFERENCES "user"(id),
    preferred_provider ai_provider DEFAULT 'openai',
    is_active BOOLEAN DEFAULT true,
    UNIQUE(organization_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_ai_provider_preferences_org ON ai_provider_preferences(organization_id);
CREATE INDEX idx_ai_provider_preferences_user ON ai_provider_preferences(user_id);

CREATE TABLE interviewer (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    agent_id TEXT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    audio TEXT,
    empathy INTEGER NOT NULL,
    exploration INTEGER NOT NULL,
    rapport INTEGER NOT NULL,
    speed INTEGER NOT NULL
);

CREATE TABLE interview (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    name TEXT,
    description TEXT,
    objective TEXT,
    organization_id TEXT REFERENCES organization(id),
    user_id TEXT REFERENCES "user"(id),
    interviewer_id INTEGER REFERENCES interviewer(id),
    is_active BOOLEAN DEFAULT true,
    is_anonymous BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    logo_url TEXT,
    theme_color TEXT,
    url TEXT,
    readable_slug TEXT,
    questions JSONB,
    quotes JSONB[],
    insights TEXT[],
    respondents TEXT[],
    question_count INTEGER,
    response_count INTEGER,
    time_duration TEXT
);

-- Updated interviewees table with interview_id
CREATE TABLE interviewees (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    organization_id TEXT REFERENCES organization(id),
    interview_id TEXT REFERENCES interview(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    status interviewee_status DEFAULT 'active',
    notes TEXT
);

-- Updated resumes table with interview_id
CREATE TABLE resumes (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    interviewee_id TEXT REFERENCES interviewees(id) ON DELETE CASCADE,
    interview_id TEXT REFERENCES interview(id),
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    parsed_content TEXT,
    ats_score DECIMAL(5,2),
    skills TEXT[],
    experience_years INTEGER,
    education TEXT[],
    certifications TEXT[],
    languages TEXT[],
    status resume_status DEFAULT 'pending',
    processing_notes TEXT
);

-- Updated resume_analyses table with interview_id
CREATE TABLE resume_analyses (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id TEXT REFERENCES resumes(id) ON DELETE CASCADE,
    interview_id TEXT REFERENCES interview(id),
    overall_score DECIMAL(5,2) NOT NULL,
    skills_match DECIMAL(5,2) NOT NULL,
    experience_match DECIMAL(5,2) NOT NULL,
    education_match DECIMAL(5,2) NOT NULL,
    technical_skills TEXT[],
    soft_skills TEXT[],
    experience_summary TEXT,
    education_summary TEXT,
    recommendations TEXT[],
    ai_provider ai_provider,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ATS job requirements table with interview_id
CREATE TABLE ats_job_requirements (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id TEXT REFERENCES organization(id),
    interview_id TEXT REFERENCES interview(id),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT[],
    preferred_skills TEXT[],
    experience_required INTEGER,
    education_required TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE response (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    interview_id TEXT REFERENCES interview(id),
    name TEXT,
    email TEXT,
    call_id TEXT,
    candidate_status TEXT,
    duration INTEGER,
    details JSONB,
    analytics JSONB,
    is_analysed BOOLEAN DEFAULT false,
    is_ended BOOLEAN DEFAULT false,
    is_viewed BOOLEAN DEFAULT false,
    tab_switch_count INTEGER
);

CREATE TABLE feedback (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    interview_id TEXT REFERENCES interview(id),
    email TEXT,
    feedback TEXT,
    satisfaction INTEGER
);

-- Create indexes for better performance
CREATE INDEX idx_interviewees_organization ON interviewees(organization_id);
CREATE INDEX idx_interviewees_interview ON interviewees(interview_id);
CREATE INDEX idx_resumes_interviewee ON resumes(interviewee_id);
CREATE INDEX idx_resumes_interview ON resumes(interview_id);
CREATE INDEX idx_resume_analyses_resume ON resume_analyses(resume_id);
CREATE INDEX idx_resume_analyses_interview ON resume_analyses(interview_id);
CREATE INDEX idx_ats_job_requirements_organization ON ats_job_requirements(organization_id);
CREATE INDEX idx_ats_job_requirements_interview ON ats_job_requirements(interview_id);

-- Enable Row Level Security
ALTER TABLE interviewees ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_job_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interviewees
CREATE POLICY "Users can view interviewees from their organization" ON interviewees
    FOR SELECT USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can insert interviewees to their organization" ON interviewees
    FOR INSERT WITH CHECK (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can update interviewees from their organization" ON interviewees
    FOR UPDATE USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can delete interviewees from their organization" ON interviewees
    FOR DELETE USING (organization_id::text = auth.jwt() ->> 'org_id');

-- RLS Policies for resumes
CREATE POLICY "Users can view resumes from their organization" ON resumes
    FOR SELECT USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can insert resumes to their organization" ON resumes
    FOR INSERT WITH CHECK (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can update resumes from their organization" ON resumes
    FOR UPDATE USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can delete resumes from their organization" ON resumes
    FOR DELETE USING (organization_id::text = auth.jwt() ->> 'org_id');

-- RLS Policies for resume_analyses
CREATE POLICY "Users can view resume analyses from their organization" ON resume_analyses
    FOR SELECT USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can insert resume analyses to their organization" ON resume_analyses
    FOR INSERT WITH CHECK (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can update resume analyses from their organization" ON resume_analyses
    FOR UPDATE USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can delete resume analyses from their organization" ON resume_analyses
    FOR DELETE USING (organization_id::text = auth.jwt() ->> 'org_id');

-- RLS Policies for ats_job_requirements
CREATE POLICY "Users can view job requirements from their organization" ON ats_job_requirements
    FOR SELECT USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can insert job requirements to their organization" ON ats_job_requirements
    FOR INSERT WITH CHECK (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can update job requirements from their organization" ON ats_job_requirements
    FOR UPDATE USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can delete job requirements from their organization" ON ats_job_requirements
    FOR DELETE USING (organization_id::text = auth.jwt() ->> 'org_id');

-- Storage Configuration
-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Create storage policies for resumes bucket
CREATE POLICY "Users can upload resumes to their organization" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] IN (
            SELECT id FROM interviewees WHERE organization_id IN (
                SELECT organization_id FROM "user" WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can view resumes from their organization" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] IN (
            SELECT id FROM interviewees WHERE organization_id IN (
                SELECT organization_id FROM "user" WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update resumes from their organization" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] IN (
            SELECT id FROM interviewees WHERE organization_id IN (
                SELECT organization_id FROM "user" WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can delete resumes from their organization" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'resumes' AND
        (storage.foldername(name))[1] IN (
            SELECT id FROM interviewees WHERE organization_id IN (
                SELECT organization_id FROM "user" WHERE id = auth.uid()
            )
        )
);
