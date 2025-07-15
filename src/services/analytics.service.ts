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

  try {
    const response = await ResponseService.getResponseByCallId(callId);
    const interview = await InterviewService.getInterviewById(interviewId);

    if (response.analytics) {
      return { analytics: response.analytics as Analytics, status: 200 };
    }

    const interviewTranscript = transcript || response.details?.transcript;
    const questions = interview?.questions || [];
    const mainInterviewQuestions = questions
      .map((q: Question, index: number) => `${index + 1}. ${q.question}`)
      .join("\n");

    const prompt = getInterviewAnalyticsPrompt(
      interviewTranscript,
      mainInterviewQuestions,
    );

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

    const content = aiResponse.content;
    const analyticsResponse = JSON.parse(content);

    analyticsResponse.mainInterviewQuestions = questions.map(
      (q: Question) => q.question,
    );

    return { analytics: analyticsResponse, status: 200 };
  } catch (error: any) {
    console.error("Error in AI request:", error);

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

    return { error: "internal server error", status: 500 };
  }
};
