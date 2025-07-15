import { NextRequest, NextResponse } from "next/server";
import {
  getAIProviderPreference,
  setAIProviderPreference,
  getOrganizationAIProviderPreference,
  deleteAIProviderPreference,
  type AIProvider,
} from "@/services/ai-provider-preferences.service";

export async function GET(request: NextRequest) {
  try {
    // Get organizationId and userId from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const userId = searchParams.get("userId");

    if (!organizationId || !userId) {
      return NextResponse.json(
        { error: "Organization ID and user ID are required" },
        { status: 400 },
      );
    }

    // Get user preference first, then fall back to organization preference
    let preference = await getAIProviderPreference(organizationId, userId);
    if (!preference) {
      preference = await getOrganizationAIProviderPreference(organizationId);
    }

    return NextResponse.json({
      provider: preference?.preferred_provider || "openai",
      preference,
    });
  } catch (error) {
    console.error("Error in GET /api/ai-provider:", error);
    
return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { provider, organizationId, userId } = await request.json();

    if (!provider || !organizationId || !userId) {
      return NextResponse.json(
        { error: "Provider, organization ID, and user ID are required" },
        { status: 400 },
      );
    }

    if (!["openai", "gemini"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const preference = await setAIProviderPreference(
      organizationId,
      userId,
      provider as AIProvider,
    );

    if (!preference) {
      return NextResponse.json(
        { error: "Failed to save preference" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      provider: preference.preferred_provider,
      preference,
    });
  } catch (error) {
    console.error("Error in POST /api/ai-provider:", error);
    
return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get organizationId and userId from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");
    const userId = searchParams.get("userId");

    if (!organizationId || !userId) {
      return NextResponse.json(
        { error: "Organization ID and user ID are required" },
        { status: 400 },
      );
    }

    const success = await deleteAIProviderPreference(organizationId, userId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete preference" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/ai-provider:", error);
    
return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
