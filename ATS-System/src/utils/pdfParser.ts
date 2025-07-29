import fs from "fs";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import path from "path";

export async function parsePdfOrDoc(filePath: string): Promise<string> {
  try {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    }

    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }

    throw new Error(`Unsupported file type: ${ext}`);
  } catch (error: any) {
    console.error(`Error parsing file ${filePath}:`, error.message);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}
