import { NextResponse } from "next/server";
import { aiService } from "@/services/ai.service";

export async function GET() {
    try {
        // Test basic AI service functionality
        const testResponse = await aiService.createCompletion({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant.",
                },
                {
                    role: "user",
                    content: "Respond with just the word 'OK'",
                },
            ],
            responseFormat: { type: "text" },
        });

        return NextResponse.json({
            success: true,
            message: "AI service is working",
            response: testResponse.content,
            provider: aiService.getCurrentProvider(),
        });
    } catch (error: any) {
        console.error("AI test failed:", error);

        return NextResponse.json({
            success: false,
            error: error.message,
            details: {
                status: error.status,
                code: error.code,
                provider: aiService.getCurrentProvider(),
            },
        }, { status: 500 });
    }
} 
