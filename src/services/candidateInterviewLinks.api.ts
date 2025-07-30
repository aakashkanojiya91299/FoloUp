import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

export interface CandidateInterviewLink {
  id: string;
  created_at: Date;
  updated_at: Date;
  candidate_id: string;
  interview_id: string;
  organization_id: string;
  unique_link_id: string;
  link_url: string;
  status: "active" | "expired" | "completed";
  expires_at?: Date;
  completed_at?: Date;
  response_id?: number;
  created_by?: string;
  notes?: string;
}

export interface CreateLinkRequest {
  candidate_id: string;
  interview_id: string;
  organization_id: string;
  expires_at?: Date;
  notes?: string;
}

const createCandidateInterviewLink = async (
  request: CreateLinkRequest,
): Promise<CandidateInterviewLink | null> => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const uniqueLinkId = nanoid(16); // Generate unique 16-character ID
    const baseUrl = process.env.NEXT_PUBLIC_LIVE_URL || "http://localhost:3000";
    const linkUrl = `${baseUrl}/interview/${uniqueLinkId}`;

    console.log("Creating link with organization_id:", request.organization_id);

    const { data, error } = await supabase
      .from("candidate_interview_links")
      .insert({
        candidate_id: request.candidate_id,
        interview_id: request.interview_id,
        organization_id: request.organization_id,
        unique_link_id: uniqueLinkId,
        link_url: linkUrl,
        expires_at: request.expires_at,
        notes: request.notes,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating candidate interview link:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating candidate interview link:", error);

    return null;
  }
};

const getCandidateInterviewLinks = async (
  candidateId: string,
): Promise<CandidateInterviewLink[]> => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase
      .from("candidate_interview_links")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching candidate interview links:", error);

      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching candidate interview links:", error);

    return [];
  }
};

const getInterviewLinksByInterview = async (
  interviewId: string,
): Promise<CandidateInterviewLink[]> => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase
      .from("candidate_interview_links")
      .select("*")
      .eq("interview_id", interviewId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching interview links:", error);

      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching interview links:", error);

    return [];
  }
};

const getLinkByUniqueId = async (
  uniqueLinkId: string,
): Promise<CandidateInterviewLink | null> => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase
      .from("candidate_interview_links")
      .select("*")
      .eq("unique_link_id", uniqueLinkId)
      .single();

    if (error) {
      console.error("Error fetching link by unique ID:", error);

      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching link by unique ID:", error);

    return null;
  }
};

const updateLinkStatus = async (
  linkId: string,
  status: "active" | "expired" | "completed",
  responseId?: number,
): Promise<boolean> => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const updateData: any = { status };

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    if (responseId) {
      updateData.response_id = responseId;
    }

    const { error } = await supabase
      .from("candidate_interview_links")
      .update(updateData)
      .eq("id", linkId);

    if (error) {
      console.error("Error updating link status:", error);

      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating link status:", error);

    return false;
  }
};

const expireExpiredLinks = async (): Promise<number> => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    // Only expire links that have a specific expiration date and are past that date
    const { data, error } = await supabase
      .from("candidate_interview_links")
      .update({ status: "expired" })
      .lt("expires_at", new Date().toISOString())
      .not("expires_at", "is", null)
      .eq("status", "active")
      .select();

    if (error) {
      console.error("Error expiring links:", error);

      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error("Error expiring links:", error);

    return 0;
  }
};

const deleteLink = async (linkId: string): Promise<boolean> => {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { error } = await supabase
      .from("candidate_interview_links")
      .delete()
      .eq("id", linkId);

    if (error) {
      console.error("Error deleting link:", error);

      return false;
    }

    return true;
  } catch (error) {
    console.error("Error deleting link:", error);

    return false;
  }
};

export const CandidateInterviewLinkApiService = {
  createCandidateInterviewLink,
  getCandidateInterviewLinks,
  getInterviewLinksByInterview,
  getLinkByUniqueId,
  updateLinkStatus,
  expireExpiredLinks,
  deleteLink,
};
