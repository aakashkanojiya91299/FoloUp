import { logger } from "@/lib/logger";
import { generateInterviewAnalytics } from "@/services/analytics.service";
import { ResponseService } from "@/services/responses.service";
import { Response } from "@/types/response";
import { NextResponse } from "next/server";
import Retell from "retell-sdk";

const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(req: Request, res: Response) {
  logger.info("get-call request received");
  const body = await req.json();

  const callDetails: Response = await ResponseService.getResponseByCallId(
    body.id,
  );
  let callResponse = callDetails.details;

  // Check if already analysed and has valid analytics
  if (callDetails.is_analysed && callDetails.analytics && callDetails.analytics.overallScore !== undefined && !body.reset) {
    logger.info("Call already analysed with valid analytics");
    return NextResponse.json(
      {
        callResponse,
        analytics: callDetails.analytics,
      },
      { status: 200 },
    );
  }

  // If marked as analysed but no valid analytics, regenerate them
  if (callDetails.is_analysed && (!callDetails.analytics || callDetails.analytics.overallScore === undefined)) {
    logger.info("Call marked as analysed but analytics are invalid, regenerating...");
    // Reset the analytics so they can be regenerated
    await ResponseService.resetAnalytics(body.id);
  }

  // If reset parameter is provided, reset analytics
  if (body.reset) {
    logger.info("Manual reset requested, regenerating analytics...");
    await ResponseService.resetAnalytics(body.id);
  }

  const callOutput = await retell.call.retrieve(body.id);
  const interviewId = callDetails?.interview_id;
  callResponse = callOutput;
  const duration = Math.round(
    callResponse.end_timestamp / 1000 - callResponse.start_timestamp / 1000,
  );

  const payload = {
    callId: body.id,
    interviewId: interviewId,
    transcript: callResponse.transcript,
  };

  logger.info("Generating analytics for call:", body.id);
  const result = await generateInterviewAnalytics(payload);

  // Check if analytics generation failed
  if (result.error || result.status !== 200) {
    logger.error("Analytics generation failed:", result.error);

    // Return the call data without analytics, but don't mark as analysed
    return NextResponse.json(
      {
        callResponse,
        analytics: null,
        error: result.error || "Analytics generation failed",
      },
      { status: 200 },
    );
  }

  const analytics = result.analytics;

  // Validate that analytics has the required fields
  if (!analytics || analytics.overallScore === undefined) {
    logger.error("Analytics generated but missing required fields:", analytics);
    return NextResponse.json(
      {
        callResponse,
        analytics: null,
        error: "Analytics generated but missing required fields",
      },
      { status: 200 },
    );
  }

  await ResponseService.saveResponse(
    {
      details: callResponse,
      is_analysed: true,
      duration: duration,
      analytics: analytics,
    },
    body.id,
  );

  logger.info("Call analysed successfully");

  return NextResponse.json(
    {
      callResponse,
      analytics,
    },
    { status: 200 },
  );
}
