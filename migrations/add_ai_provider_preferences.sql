-- Migration: Add AI Provider Preferences table
-- Run this in your Supabase SQL editor or database

-- Create enum type for AI provider if it doesn't exist
DO $$ BEGIN
    CREATE TYPE ai_provider AS ENUM ('openai', 'gemini');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create AI Provider Preferences table
CREATE TABLE IF NOT EXISTS ai_provider_preferences (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    organization_id TEXT REFERENCES organization(id),
    user_id TEXT REFERENCES "user"(id),
    preferred_provider ai_provider DEFAULT 'openai',
    is_active BOOLEAN DEFAULT true,
    UNIQUE(organization_id, user_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_provider_preferences_org ON ai_provider_preferences(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_provider_preferences_user ON ai_provider_preferences(user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_provider_preferences_updated_at 
    BEFORE UPDATE ON ai_provider_preferences 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 
