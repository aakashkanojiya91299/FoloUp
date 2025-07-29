"use server";

import mammoth from "mammoth";

export async function parseDocx(formData: FormData) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      throw new Error("No file provided");
    }

    // Convert File to Buffer for mammoth
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await mammoth.extractRawText({ buffer });
    const fullText = result.value;

    return {
      success: true,
      text: fullText,
    };
  } catch (error) {
    console.error("Error parsing DOCX:", error);

    return {
      success: false,
      error: "Failed to parse DOCX",
    };
  }
} 
