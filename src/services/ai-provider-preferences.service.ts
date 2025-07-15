"use server";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export type AIProvider = "openai" | "gemini";

export interface AIProviderPreference {
  id: string;
  organization_id: string;
  user_id: string;
  preferred_provider: AIProvider;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAIProviderPreference(
  organizationId: string,
  userId: string
): Promise<AIProviderPreference | null> {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from("ai_provider_preferences")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (error) {
    console.log("Error fetching AI provider preference:", error);
    console.error("Error fetching AI provider preference:", error);
    return null;
  }

  return data;
}

export async function setAIProviderPreference(
  organizationId: string,
  userId: string,
  provider: AIProvider
): Promise<AIProviderPreference | null> {
  const supabase = createClientComponentClient();

  // Try to update existing preference
  const { data: updateData, error: updateError } = await supabase
    .from("ai_provider_preferences")
    .update({
      preferred_provider: provider,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("is_active", true)
    .select()
    .single();

  if (updateData) {
    return updateData;
  }

  // If no existing preference, create new one
  const { data: insertData, error: insertError } = await supabase
    .from("ai_provider_preferences")
    .insert({
      organization_id: organizationId,
      user_id: userId,
      preferred_provider: provider,
      is_active: true,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error creating AI provider preference:", insertError);
    return null;
  }

  return insertData;
}

export async function getOrganizationAIProviderPreference(
  organizationId: string
): Promise<AIProviderPreference | null> {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase
    .from("ai_provider_preferences")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching organization AI provider preference:", error);
    return null;
  }

  return data;
}

export async function deleteAIProviderPreference(
  organizationId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClientComponentClient();

  const { error } = await supabase
    .from("ai_provider_preferences")
    .update({ is_active: false })
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  if (error) {
    console.error("Error deleting AI provider preference:", error);
    return false;
  }

  return true;
} 
