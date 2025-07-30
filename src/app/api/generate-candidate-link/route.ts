import { NextResponse } from "next/server";
import { CandidateInterviewLinkApiService } from "@/services/candidateInterviewLinks.api";
import { logger } from "@/lib/logger";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  logger.info("generate-candidate-link request received");

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { candidate_id, interview_id, expires_at, notes } = body;

    if (!candidate_id || !interview_id) {
      return NextResponse.json(
        { error: "Candidate ID and Interview ID are required" },
        { status: 400 },
      );
    }

    // Create the link
    const link =
      await CandidateInterviewLinkApiService.createCandidateInterviewLink({
        candidate_id,
        interview_id,
        organization_id: orgId,
        expires_at: expires_at ? new Date(expires_at) : undefined,
        notes,
      });

    if (!link) {
      return NextResponse.json(
        { error: "Failed to create interview link" },
        { status: 500 },
      );
    }

    logger.info("Candidate interview link created successfully");

    return NextResponse.json(
      {
        success: true,
        link,
        message: "Interview link generated successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    logger.error("Error generating candidate link:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  logger.info("get-candidate-links request received");

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const candidate_id = searchParams.get("candidate_id");
    const interview_id = searchParams.get("interview_id");

    let links = [];

    if (candidate_id) {
      links =
        await CandidateInterviewLinkApiService.getCandidateInterviewLinks(
          candidate_id,
        );
    } else if (interview_id) {
      links =
        await CandidateInterviewLinkApiService.getInterviewLinksByInterview(
          interview_id,
        );
    } else {
      return NextResponse.json(
        { error: "Either candidate_id or interview_id is required" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        links,
      },
      { status: 200 },
    );
  } catch (error: any) {
    logger.error("Error fetching candidate links:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  logger.info("delete-candidate-link request received");

  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get("id");

    if (!linkId) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 },
      );
    }

    const success = await CandidateInterviewLinkApiService.deleteLink(linkId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete link" },
        { status: 500 },
      );
    }

    logger.info("Candidate interview link deleted successfully");

    return NextResponse.json(
      {
        success: true,
        message: "Link deleted successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    logger.error("Error deleting candidate link:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
