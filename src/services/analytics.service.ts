"use server";

import { ResponseService } from "@/services/responses.service";
import { InterviewService } from "@/services/interviews.service";
import { Question } from "@/types/interview";
import { Analytics } from "@/types/response";
import {
  getInterviewAnalyticsPrompt,
  SYSTEM_PROMPT,
} from "@/lib/prompts/analytics";
import { aiService } from "@/services/ai.service";

export const generateInterviewAnalytics = async (payload: {
  callId: string;
  interviewId: string;
  transcript: string;
}) => {
  const { callId, interviewId, transcript } = payload;

  // Check environment variables for debugging
  console.log("Environment check:", {
    openaiKey: process.env.OPENAI_API_KEY ? "Set" : "Missing",
    geminiKey: process.env.GEMINI_API_KEY ? "Set" : "Missing",
    aiProvider: process.env.AI_PROVIDER || "openai"
  });

  try {
    const response = await ResponseService.getResponseByCallId(callId);
    const interview = await InterviewService.getInterviewById(interviewId);

    // Only return existing analytics if they are valid and complete
    if (response.analytics && response.analytics.overallScore !== undefined) {
      console.log("Returning existing valid analytics");

      return { analytics: response.analytics as Analytics, status: 200 };
    }

    console.log("Generating new analytics for call:", callId);
    const interviewTranscript = transcript || response.details?.transcript;
    const questions = interview?.questions || [];
    const mainInterviewQuestions = questions
      .map((q: Question, index: number) => `${index + 1}. ${q.question}`)
      .join("\n");

    console.log("Interview transcript length:", interviewTranscript?.length || 0);
    console.log("Number of questions:", questions.length);

    const prompt = getInterviewAnalyticsPrompt(
      interviewTranscript,
      mainInterviewQuestions,
    );

    console.log("Sending request to AI service...");
    const aiResponse = await aiService.createCompletion({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      responseFormat: { type: "json_object" },
    });

    console.log("AI response received, parsing...");
    const content = aiResponse.content;

    // Clean the content to handle markdown-formatted JSON responses
    let cleanedContent = content.trim();

    // Remove markdown code blocks if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '');
    }
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '');
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.replace(/\s*```$/, '');
    }

    // Try to extract JSON if the response contains markdown
    if (!cleanedContent.startsWith('{')) {
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedContent = jsonMatch[0];
        console.log("Extracted JSON from markdown response");
      }
    }

    console.log("Cleaned content:", cleanedContent.substring(0, 200) + "...");

    let analyticsResponse;
    try {
      analyticsResponse = JSON.parse(cleanedContent);
    } catch (parseError: any) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw content:", content);
      console.error("Cleaned content:", cleanedContent);

      // Try one more time with more aggressive cleaning
      const aggressiveClean = content.replace(/```json\s*|\s*```/g, '').trim();
      try {
        analyticsResponse = JSON.parse(aggressiveClean);
        console.log("Successfully parsed with aggressive cleaning");
      } catch (secondError: any) {
        console.error("Second parsing attempt also failed:", secondError);
        throw new Error(`Failed to parse AI response: ${parseError.message}. Raw content: ${content.substring(0, 500)}`);
      }
    }

    console.log("Analytics response keys:", Object.keys(analyticsResponse));
    console.log("Overall score:", analyticsResponse.overallScore);

    analyticsResponse.mainInterviewQuestions = questions.map(
      (q: Question) => q.question,
    );

    return { analytics: analyticsResponse, status: 200 };
  } catch (error: any) {
    console.error("Error in AI request:", error);
    console.error("Error details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      stack: error.stack
    });

    // Handle specific AI API errors
    if (error?.status === 429) {
      console.error("AI API quota exceeded");

      return {
        error:
          "API quota exceeded. Please check your AI provider billing and try again later.",
        details:
          "You have exceeded your current AI API quota. Please check your plan and billing details.",
        status: 429,
      };
    }

    if (error?.status === 401) {
      console.error("AI API authentication failed");

      return {
        error: "API authentication failed",
        details: "Invalid or missing API key. Please check your configuration.",
        status: 401,
      };
    }

    if (error?.status === 400) {
      console.error("AI API bad request");

      return {
        error: "Invalid request to AI service",
        details: error.message || "The request to AI service was malformed.",
        status: 400,
      };
    }

    if (error?.status === 503 || error?.status === 502) {
      console.error("AI API service unavailable");

      return {
        error: "AI service temporarily unavailable",
        details:
          "AI services are currently experiencing issues. Please try again later.",
        status: 503,
      };
    }

    // Generic error handling
    return {
      error: "AI analysis failed",
      details: error.message || "Unknown error occurred during AI analysis",
      status: 500
    };
  }
};
