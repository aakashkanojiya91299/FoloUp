import { supabase } from "@/lib/supabase";
import { Interviewee, Resume, ResumeAnalysis, ATSJobRequirements } from "@/types/interviewee";

export class IntervieweeService {
  // Interviewee Management
  static async createInterviewee(data: Omit<Interviewee, 'id' | 'created_at' | 'updated_at'>): Promise<Interviewee> {
    const { data: interviewee, error } = await supabase
      .from('interviewees')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {throw error;}
    
return interviewee;
  }

  static async getIntervieweesByOrganization(organizationId: string): Promise<Interviewee[]> {
    const { data: interviewees, error } = await supabase
      .from('interviewees')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {throw error;}
    
return interviewees;
  }

  static async getIntervieweesByInterview(interviewId: string): Promise<Interviewee[]> {
    const { data: interviewees, error } = await supabase
      .from('interviewees')
      .select('*')
      .eq('interview_id', interviewId)
      .order('created_at', { ascending: false });

    if (error) {throw error;}
    
return interviewees;
  }

  static async getIntervieweeById(id: string): Promise<Interviewee> {
    const { data: interviewee, error } = await supabase
      .from('interviewees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {throw error;}
    
return interviewee;
  }

  static async updateInterviewee(id: string, data: Partial<Interviewee>): Promise<Interviewee> {
    const { data: interviewee, error } = await supabase
      .from('interviewees')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {throw error;}
    
return interviewee;
  }

  static async deleteInterviewee(id: string): Promise<void> {
    const { error } = await supabase
      .from('interviewees')
      .delete()
      .eq('id', id);

    if (error) {throw error;}
  }

  // Resume Management with API Route
  static async uploadResume(
    intervieweeId: string,
    interviewId: string,
    file: File,
    filename: string
  ): Promise<Resume> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('intervieweeId', intervieweeId);
      formData.append('interviewId', interviewId);
      formData.append('filename', filename);

      const response = await fetch('/api/upload-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const result = await response.json();
      
return result.resume;
    } catch (error) {
      console.error('Resume upload error:', error);
      throw error;
    }
  }

  static async getResumesByInterviewee(intervieweeId: string): Promise<Resume[]> {
    const { data: resumes, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('interviewee_id', intervieweeId)
      .order('uploaded_at', { ascending: false });

    if (error) {throw error;}
    
return resumes;
  }

  static async getResumesByInterview(interviewId: string): Promise<Resume[]> {
    const { data: resumes, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('interview_id', interviewId)
      .order('uploaded_at', { ascending: false });

    if (error) {throw error;}
    
return resumes;
  }

  static async getResumeById(id: string): Promise<Resume> {
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {throw error;}
    
return resume;
  }

  static async updateResume(id: string, data: Partial<Resume>): Promise<Resume> {
    const { data: resume, error } = await supabase
      .from('resumes')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {throw error;}
    
return resume;
  }

  static async deleteResume(id: string): Promise<void> {
    // Get resume info before deleting
    const resume = await this.getResumeById(id);
    
    // Delete from database
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', id);

    if (error) {throw error;}

    // Note: File deletion would need to be handled by an API route
    // For now, we'll just delete from database
  }

  // ATS Analysis with AI Provider Integration
  static async analyzeResume(
    resumeId: string, 
    interviewId: string, 
    organizationId: string, 
    userId: string
  ): Promise<ResumeAnalysis> {
    try {
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId,
          interviewId,
          organizationId,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze resume');
      }

      const result = await response.json();
      
return result.analysis;
    } catch (error) {
      console.error('ATS Analysis error:', error);
      throw error;
    }
  }

  static async getResumeAnalysis(resumeId: string): Promise<ResumeAnalysis | null> {
    const { data: analysis, error } = await supabase
      .from('resume_analyses')
      .select('*')
      .eq('resume_id', resumeId)
      .single();

    if (error && error.code !== 'PGRST116') {throw error;} // PGRST116 is "not found"
    
return analysis;
  }

  static async getResumeAnalysesByInterview(interviewId: string): Promise<ResumeAnalysis[]> {
    const { data: analyses, error } = await supabase
      .from('resume_analyses')
      .select('*')
      .eq('interview_id', interviewId)
      .order('created_at', { ascending: false });

    if (error) {throw error;}
    
return analyses;
  }

  // Job Requirements Management
  static async createJobRequirements(data: Omit<ATSJobRequirements, 'id' | 'created_at' | 'updated_at'>): Promise<ATSJobRequirements> {
    const { data: requirements, error } = await supabase
      .from('ats_job_requirements')
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {throw error;}
    
return requirements;
  }

  static async getJobRequirementsByOrganization(organizationId: string): Promise<ATSJobRequirements[]> {
    const { data: requirements, error } = await supabase
      .from('ats_job_requirements')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {throw error;}
    
return requirements;
  }

  static async getJobRequirementsByInterview(interviewId: string): Promise<ATSJobRequirements[]> {
    const { data: requirements, error } = await supabase
      .from('ats_job_requirements')
      .select('*')
      .eq('interview_id', interviewId)
      .order('created_at', { ascending: false });

    if (error) {throw error;}
    
return requirements;
  }

  // Interview Management
  static async getInterviewsByOrganization(organizationId: string): Promise<any[]> {
    const { data: interviews, error } = await supabase
      .from('interview')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {throw error;}
    
return interviews;
  }

  static async getInterviewById(id: string): Promise<any> {
    const { data: interview, error } = await supabase
      .from('interview')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {throw error;}
    
return interview;
  }
} 
