-- Create enum type for plan
CREATE TYPE plan AS ENUM ('free', 'pro', 'free_trial_over');

-- Create enum type for AI provider
CREATE TYPE ai_provider AS ENUM ('openai', 'gemini');

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
