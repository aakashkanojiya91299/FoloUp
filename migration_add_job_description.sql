-- Add job_description column to interview table
ALTER TABLE interview 
ADD COLUMN job_description TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN interview.job_description IS 'Job description extracted from uploaded documents'; 
