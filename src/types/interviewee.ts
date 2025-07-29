export interface Interviewee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization_id: string;
  interview_id: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'archived';
  notes?: string;
}

export interface Resume {
  id: string;
  interviewee_id: string;
  interview_id: string;
  filename: string;
  file_url: string;
  file_size: number;
  uploaded_at: string;
  parsed_content?: string;
  ats_score?: number;
  skills?: string[];
  experience_years?: number;
  education?: string[];
  certifications?: string[];
  languages?: string[];
  status: 'pending' | 'processed' | 'failed';
  processing_notes?: string;
}

export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  interview_id: string;
  overall_score: number;
  skills_match: number;
  experience_match: number;
  education_match: number;
  technical_skills: string[];
  soft_skills: string[];
  experience_summary: string;
  education_summary: string;
  recommendations: string[];
  ai_provider: 'openai' | 'gemini';
  created_at: string;
}

export interface ATSJobRequirements {
  id: string;
  organization_id: string;
  interview_id: string;
  title: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
  experience_required: number;
  education_required: string[];
  created_at: string;
  updated_at: string;
} 
