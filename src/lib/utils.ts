import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToAscii(inputString: string) {
  // remove non ascii characters
  const asciiString = inputString.replace(/[^\x20-\x7F]+/g, "");

  return asciiString;
}

export function formatTimestampToDateHHMM(timestamp: string): string {
  const date = new Date(timestamp);

  // Format date to YYYY-MM-DD
  const datePart =
    date.getDate().toString().padStart(2, "0") +
    "-" +
    (date.getMonth() + 1).toString().padStart(2, "0") +
    "-" +
    date.getFullYear();

  // Format time to HH:MM
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const timePart = `${hours}:${minutes}`;

  return `${datePart} ${timePart}`;
}

export function testEmail(email: string) {
  const re = /\S+@\S+\.\S+/;

  return re.test(email);
}

export function convertSecondstoMMSS(seconds: number) {
  const minutes = Math.trunc(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
}

export function isLightColor(color: string) {
  const hex = color?.replace("#", "");
  const r = parseInt(hex?.substring(0, 2), 16);
  const g = parseInt(hex?.substring(2, 4), 16);
  const b = parseInt(hex?.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 155;
}

export const handleOpenAIError = (error: any) => {
  if (error?.status === 429) {
    return {
      error: "API quota exceeded. Please check your OpenAI billing and try again later.",
      details: "You have exceeded your current OpenAI API quota. Please check your plan and billing details.",
      status: 429
    };
  }
  
  if (error?.status === 401) {
    return {
      error: "API authentication failed",
      details: "Invalid or missing OpenAI API key. Please check your configuration.",
      status: 401
    };
  }
  
  if (error?.status === 400) {
    return {
      error: "Invalid request to AI service",
      details: error.message || "The request to OpenAI was malformed.",
      status: 400
    };
  }
  
  if (error?.status === 503 || error?.status === 502) {
    return {
      error: "AI service temporarily unavailable",
      details: "OpenAI services are currently experiencing issues. Please try again later.",
      status: 503
    };
  }

  return {
    error: "Internal server error",
    details: "An unexpected error occurred.",
    status: 500
  };
};
