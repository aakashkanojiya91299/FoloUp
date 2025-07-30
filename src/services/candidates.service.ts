import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

export interface Candidate {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  interview_id: string;
  organization_id: string;
  resume_filename: string;
  resume_file_url?: string;
  ats_score: number;
  ats_missing_skills: string[];
  ats_feedback: string;
  created_at?: string;
  updated_at?: string;
}

export const CandidateService = {
  /**
   * Create a new candidate with ATS results
   */
  async createCandidate(candidate: Candidate): Promise<Candidate | null> {
    try {
      const { data, error } = await supabase
        .from("candidates")
        .insert({
          name: candidate.name,
          email: candidate.email,
          phone: candidate.phone,
          interview_id: candidate.interview_id,
          organization_id: candidate.organization_id,
          resume_filename: candidate.resume_filename,
          resume_file_url: candidate.resume_file_url,
          ats_score: candidate.ats_score,
          ats_missing_skills: candidate.ats_missing_skills,
          ats_feedback: candidate.ats_feedback,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating candidate:", error);

        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating candidate:", error);

      return null;
    }
  },

  /**
   * Get all candidates for an interview
   */
  async getCandidatesByInterview(interviewId: string): Promise<Candidate[]> {
    try {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("interview_id", interviewId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching candidates:", error);

        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching candidates:", error);

      return [];
    }
  },

  /**
   * Get all candidates for an organization
   */
  async getCandidatesByOrganization(
    organizationId: string,
  ): Promise<Candidate[]> {
    try {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching candidates:", error);

        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching candidates:", error);

      return [];
    }
  },

  /**
   * Get a single candidate by ID
   */
  async getCandidateById(id: string): Promise<Candidate | null> {
    try {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching candidate:", error);

        return null;
      }

      return data;
    } catch (error) {
      console.error("Error fetching candidate:", error);

      return null;
    }
  },

  /**
   * Update a candidate
   */
  async updateCandidate(
    id: string,
    updates: Partial<Candidate>,
  ): Promise<Candidate | null> {
    try {
      const { data, error } = await supabase
        .from("candidates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating candidate:", error);

        return null;
      }

      return data;
    } catch (error) {
      console.error("Error updating candidate:", error);

      return null;
    }
  },

  /**
   * Delete a candidate
   */
  async deleteCandidate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("candidates").delete().eq("id", id);

      if (error) {
        console.error("Error deleting candidate:", error);

        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting candidate:", error);

      return false;
    }
  },
};
