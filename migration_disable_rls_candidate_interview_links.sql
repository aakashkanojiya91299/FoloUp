-- Disable Row Level Security for candidate_interview_links table
ALTER TABLE candidate_interview_links DISABLE ROW LEVEL SECURITY;

-- Drop all existing RLS policies for candidate_interview_links
DROP POLICY IF EXISTS "Users can view candidate interview links from their organization" ON candidate_interview_links;
DROP POLICY IF EXISTS "Users can insert candidate interview links to their organization" ON candidate_interview_links;
DROP POLICY IF EXISTS "Users can update candidate interview links from their organization" ON candidate_interview_links;
DROP POLICY IF EXISTS "Users can delete candidate interview links from their organization" ON candidate_interview_links; 
