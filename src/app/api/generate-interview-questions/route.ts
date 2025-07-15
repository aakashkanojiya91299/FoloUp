import { NextRequest, NextResponse } from "next/server";
import { aiService } from "@/services/ai.service";
import { getAIProviderPreference, getOrganizationAIProviderPreference } from "@/services/ai-provider-preferences.service";

export async function POST(request: NextRequest) {
  try {
    const { 
      jobTitle, 
      jobDescription, 
      questionCount = 10, 
      difficulty = "medium",
      organizationId,
      userId
    } = await request.json();

    if (!jobTitle || !jobDescription || !organizationId || !userId) {
      return NextResponse.json({ 
        error: "Job title, description, organization ID, and user ID are required" 
      }, { status: 400 });
    }

    // Get AI provider preference from database
    let preferredProvider = "openai"; // default fallback
    
    try {
      // Try user preference first
      const userPreference = await getAIProviderPreference(organizationId, userId);
      if (userPreference) {
        preferredProvider = userPreference.preferred_provider;
        console.log(`Generate Questions: Using user preference: ${preferredProvider}`);
      } else {
        // Fall back to organization preference
        const orgPreference = await getOrganizationAIProviderPreference(organizationId);
        if (orgPreference) {
          preferredProvider = orgPreference.preferred_provider;
          console.log(`Generate Questions: Using organization preference: ${preferredProvider}`);
        } else {
          console.log(`Generate Questions: No preference found, using default: ${preferredProvider}`);
        }
      }
    } catch (prefError) {
      console.error("Error fetching AI provider preference:", prefError);
      // Continue with default provider
    }

    // Set the preferred provider in the AI service
    aiService.setDefaultProvider(preferredProvider as "openai" | "gemini");
    console.log(`Generate Questions: AI service provider set to: ${aiService.getCurrentProvider()}`);

    // Generate questions using the AI service
    const questions = await aiService.generateInterviewQuestions({
      jobTitle,
      jobDescription,
      questionCount,
      difficulty,
    });

    if (!questions || questions.length === 0) {
      return NextResponse.json({ 
        error: "Failed to generate interview questions" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      questions,
      provider: aiService.getCurrentProvider(),
      count: questions.length 
    });
  } catch (error: any) {
    console.error("Error generating interview questions:", error);
    
    // Handle specific error types
    if (error.message?.includes("quota") || error.status === 429) {
      return NextResponse.json({ 
        error: "AI service quota exceeded. Please try again later or switch to a different AI provider." 
      }, { status: 429 });
    }
    
    if (error.status === 401) {
      return NextResponse.json({ 
        error: "AI service authentication failed. Please check your API keys." 
      }, { status: 401 });
    }
    
    if (error.status === 400) {
      console.error("Error generating interview questions:", error);
      return NextResponse.json({ 
        error: "Invalid request to AI service. Please check your input." 
      }, { status: 400 });
    }
    
    if (error.status === 503) {
      return NextResponse.json({ 
        error: "AI service is currently unavailable. Please try again later." 
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: "Failed to generate interview questions. Please try again." 
    }, { status: 500 });
  }
}
