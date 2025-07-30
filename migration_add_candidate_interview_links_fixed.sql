-- Create enum type for link status (if not exists)
DO $$ BEGIN
    CREATE TYPE link_status AS ENUM ('active', 'expired', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create table for candidate interview links (if not exists)
CREATE TABLE IF NOT EXISTS candidate_interview_links (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    candidate_id TEXT REFERENCES candidates(id) ON DELETE CASCADE,
    interview_id TEXT REFERENCES interview(id) ON DELETE CASCADE,
    organization_id TEXT REFERENCES organization(id),
    unique_link_id TEXT UNIQUE NOT NULL,
    link_url TEXT NOT NULL,
    status link_status DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    response_id INTEGER REFERENCES response(id),
    created_by TEXT REFERENCES "user"(id),
    notes TEXT
);

-- Create indexes for better performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_candidate_interview_links_candidate ON candidate_interview_links(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_interview_links_interview ON candidate_interview_links(interview_id);
CREATE INDEX IF NOT EXISTS idx_candidate_interview_links_organization ON candidate_interview_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_candidate_interview_links_unique_link ON candidate_interview_links(unique_link_id);
CREATE INDEX IF NOT EXISTS idx_candidate_interview_links_status ON candidate_interview_links(status);

-- Enable Row Level Security
ALTER TABLE candidate_interview_links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view candidate interview links from their organization" ON candidate_interview_links;
DROP POLICY IF EXISTS "Users can insert candidate interview links to their organization" ON candidate_interview_links;
DROP POLICY IF EXISTS "Users can update candidate interview links from their organization" ON candidate_interview_links;
DROP POLICY IF EXISTS "Users can delete candidate interview links from their organization" ON candidate_interview_links;

-- Create RLS Policies for candidate_interview_links
CREATE POLICY "Users can view candidate interview links from their organization" ON candidate_interview_links
    FOR SELECT USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can insert candidate interview links to their organization" ON candidate_interview_links
    FOR INSERT WITH CHECK (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can update candidate interview links from their organization" ON candidate_interview_links
    FOR UPDATE USING (organization_id::text = auth.jwt() ->> 'org_id');

CREATE POLICY "Users can delete candidate interview links from their organization" ON candidate_interview_links
    FOR DELETE USING (organization_id::text = auth.jwt() ->> 'org_id');

-- Create function to automatically update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_candidate_interview_links_updated_at ON candidate_interview_links;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_candidate_interview_links_updated_at 
    BEFORE UPDATE ON candidate_interview_links 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
