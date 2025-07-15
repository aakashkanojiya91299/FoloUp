import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
  SYSTEM_PROMPT,
  getCommunicationAnalysisPrompt,
} from "@/lib/prompts/communication-analysis";
import { aiService } from "@/services/ai.service";

export async function POST(req: Request) {
  logger.info("analyze-communication request received");

  try {
    const body = await req.json();
    const { transcript } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: "Transcript is required" },
        { status: 400 },
      );
    }

    const response = await aiService.createCompletion({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: getCommunicationAnalysisPrompt(transcript),
        },
      ],
      responseFormat: { type: "json_object" },
    });

    const analysis = response.content;

    logger.info("Communication analysis completed successfully");

    return NextResponse.json(
      { analysis: JSON.parse(analysis || "{}") },
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

    logger.error("Error analyzing communication skills");
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          "An unexpected error occurred while analyzing communication skills.",
      },
      { status: 500 },
    );
  }
}
