import axios from "axios";

export async function extractContactInfo(
  resumeText: string
): Promise<
  { name: string; email: string; phone: string } | { error: string }
> {
  try {
    console.log("Extracting contact information from resume");

    const apiKey = process.env.GEMINI_API_KEY ?? "your-api-key-here";

    if (!apiKey) {
      throw new Error("Gemini API key not found in environment");
    }

    const prompt = `
  Act as a resume parser. Extract the candidate's contact information from the resume text below.
  
  Extract the following information:
  1. Full Name (first and last name)
  2. Email address
  3. Phone number (if available)

  Here is the Resume text:
  ${resumeText}

  Respond strictly in the following JSON format:
  {
    "name": "John Doe",
    "email": "john.doe@email.com",
    "phone": "+1-555-123-4567"
  }

  If any information is missing or unclear, use "not found" for that field.
  Only extract information that is clearly present in the resume.
    `.trim();

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
      }
    );

    let text: string =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) throw new Error("No content returned from Gemini API");
    text = text
      .replace(/^```json\n/, "")
      .replace(/^```\n?/, "")
      .replace(/```$/, "");

    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini API error:", error?.response?.data || error.message);
    return {
      error:
        error?.response?.data?.error?.message ||
        error.message ||
        "Unknown Gemini API error",
    };
  }
}

export async function matchResumeToJD(
  jd: string,
  resumeText: string
): Promise<
  { match_score: number; missing_skills: string[]; feedback: string } | { error: string }
> {
  try {
    console.log("Matching resume to JD");
    console.log("JD:", jd);
    console.log("Resume Text:", resumeText);

    const apiKey = process.env.GEMINI_API_KEY ?? "your-api-key-here";

    if (!apiKey) {
      throw new Error("Gemini API key not found in environment");
    }

    const prompt = `
  Act as an Applicant Tracking System (ATS).
  Compare the candidate resume provided below against the job description.
  Perform the following steps:

  1. Identify and list the key skills required from the job description.
  2. From the candidate's resume, check which of those key skills are missing.
  3. Provide a list of only the missing skills.
  4. Give a 1-2 line feedback summary highlighting the strengths and weaknesses of the resume.
  5. Assign a match score out of 100 based on how well the resume fits the job description.

  Here is the Resume text:
  ${resumeText}

  Here is the Job Description:
  ${jd}

  Respond strictly in the following JSON format:
  {
    "missing_skills": ["skill1", "skill2"],
    "match_score": 85,
    "feedback": "The candidate has a strong foundation but is missing expertise in cloud technologies."
  }
    `.trim();

    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey,
        },
      }
    );

    let text: string =
      response.data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) throw new Error("No content returned from Gemini API");
    text = text
      .replace(/^```json\n/, "")
      .replace(/^```\n?/, "")
      .replace(/```$/, "");

    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini API error:", error?.response?.data || error.message);
    return {
      error:
        error?.response?.data?.error?.message ||
        error.message ||
        "Unknown Gemini API error",
    };
  }
}
