import { NextResponse } from "next/server";
import { ResponseService } from "@/services/responses.service";
import { InterviewService } from "@/services/interviews.service";
import {
  SYSTEM_PROMPT,
  createUserPrompt,
} from "@/lib/prompts/generate-insights";
import { logger } from "@/lib/logger";
import { aiService } from "@/services/ai.service";

export async function POST(req: Request, res: Response) {
  logger.info("generate-insights request received");
  const body = await req.json();

  const responses = await ResponseService.getAllResponses(body.interviewId);
  const interview = await InterviewService.getInterviewById(body.interviewId);

  let callSummaries = "";
  if (responses) {
    responses.forEach((response) => {
      callSummaries += response.details?.call_analysis?.call_summary;
    });
  }

  try {
    const prompt = createUserPrompt(
      callSummaries,
      interview.name,
      interview.objective,
      interview.description,
    );

    const response = await aiService.createCompletion({
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

    const content = response.content;
    const insightsResponse = JSON.parse(content);

    await InterviewService.updateInterview(
      { insights: insightsResponse.insights },
      body.interviewId,
    );

    logger.info("Insights generated successfully");

    return NextResponse.json(
      {
        response: content,
      },
      { status: 200 },
    );
  } catch (error: any) {
    logger.error(error);

    // Handle specific AI API errors
    if (error?.status === 429) {
      logger.error("AI API quota exceeded");
      
return NextResponse.json(
        {
          error:
            "API quota exceeded. Please check your AI provider billing and try again later.",
          details:
            "You have exceeded your current AI API quota. Please check your plan and billing details.",
        },
        { status: 429 },
      );
    }

    if (error?.status === 401) {
      logger.error("AI API authentication failed");
      
return NextResponse.json(
        {
          error: "API authentication failed",
          details:
            "Invalid or missing API key. Please check your configuration.",
        },
        { status: 401 },
      );
    }

    if (error?.status === 400) {
      logger.error("AI API bad request");
      
return NextResponse.json(
        {
          error: "Invalid request to AI service",
          details: error.message || "The request to AI service was malformed.",
        },
        { status: 400 },
      );
    }

    if (error?.status === 503 || error?.status === 502) {
      logger.error("AI API service unavailable");
      
return NextResponse.json(
        {
          error: "AI service temporarily unavailable",
          details:
            "AI services are currently experiencing issues. Please try again later.",
        },
        { status: 503 },
      );
    }

    logger.error("Error generating insights");
    
return NextResponse.json(
      {
        error: "Internal server error",
        details: "An unexpected error occurred while generating insights.",
      },
      { status: 500 },
    );
  }
}
