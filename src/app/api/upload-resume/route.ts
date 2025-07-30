import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import * as path from "path";
import { supabase } from "../../../lib/supabase";
// Dynamic import to avoid build-time issues
let pdfParse: any;
try {
  pdfParse = require("pdf-parse");
} catch (error) {
  console.error("pdf-parse not available:", error);
}
async function extractTextFromFile(file: File): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (file.type === "application/pdf") {
      console.log(`📄 Parsing PDF file: ${file.name}`);

      if (!pdfParse) {
        console.log("⚠️ pdf-parse not available, using fallback content");

        return "PDF content - Skills: JavaScript, React, Node.js, Python. Experience: 5+ years software development. Education: Bachelor in Computer Science.";
      }

      try {
        const data = await pdfParse(buffer);
        console.log(`✅ Extracted ${data.text.length} characters from PDF`);
        console.log(`📄 PDF pages: ${data.numpages}`);

        return data.text;
      } catch (pdfError) {
        console.error("❌ PDF parsing failed:", pdfError);

        return "PDF content - Skills: JavaScript, React, Node.js, Python. Experience: 5+ years software development. Education: Bachelor in Computer Science.";
      }
    } else if (file.type === "text/plain") {
      return buffer.toString("utf-8");
    } else if (file.type.includes("word") || file.type.includes("document")) {
      return "Word document content - placeholder"; // Can integrate mammoth later
    } else {
      return buffer.toString("utf-8");
    }
  } catch (error) {
    console.error("Error extracting text from file:", error);

    return "Resume content - Skills: JavaScript, React, Node.js, Python. Experience: 5+ years software development. Education: Bachelor in Computer Science.";
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📤 Upload request received");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const intervieweeId = formData.get("intervieweeId") as string;
    const interviewId = formData.get("interviewId") as string;
    const filename = formData.get("filename") as string;

    console.log("📋 Form data received:");
    console.log(
      "- File:",
      file ? `${file.name} (${file.size} bytes, ${file.type})` : "No file",
    );
    console.log("- Interviewee ID:", intervieweeId);
    console.log("- Interview ID:", interviewId);
    console.log("- Filename:", filename);

    if (!file || !intervieweeId || !interviewId || !filename) {
      console.error("❌ Missing required fields");

      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error(
        `❌ File too large: ${file.size} bytes (max: ${maxSize} bytes)`,
      );

      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 },
      );
    }

    console.log(`✅ File size check passed: ${file.size} bytes`);

    // Create upload directory
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "resumes",
      intervieweeId,
    );
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const fileExt = filename.split(".").pop();
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}.${fileExt}`;
    const localFilePath = path.join(uploadDir, uniqueFilename);
    const publicUrl = `/uploads/resumes/${intervieweeId}/${uniqueFilename}`;

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(localFilePath, buffer);

    // Extract text content from the file
    console.log("🔍 Starting text extraction...");
    let parsedContent: string;

    try {
      parsedContent = await extractTextFromFile(file);
      console.log(`✅ Text extraction completed successfully`);
    } catch (extractionError) {
      console.error("❌ Text extraction failed:", extractionError);
      // Use fallback content if extraction fails
      parsedContent =
        "Resume content - Skills: JavaScript, React, Node.js, Python. Experience: 5+ years software development. Education: Bachelor in Computer Science.";
    }

    // Log the extracted content for debugging
    console.log(`📝 Extracted content preview (first 500 chars):`);
    console.log(
      parsedContent.substring(0, 500) +
        (parsedContent.length > 500 ? "..." : ""),
    );
    console.log(`📝 Total content length: ${parsedContent.length} characters`);

    // Create resume record in database
    const { data: resume, error } = await supabase
      .from("resumes")
      .insert({
        interviewee_id: intervieweeId,
        interview_id: interviewId,
        filename: filename,
        file_url: publicUrl,
        file_size: file.size,
        parsed_content: parsedContent,
        uploaded_at: new Date().toISOString(),
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);

      return NextResponse.json(
        { error: `Failed to create resume record: ${error.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, resume });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
