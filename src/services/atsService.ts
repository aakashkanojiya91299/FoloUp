import axios from "axios";

export interface ATSMatchResult {
  missing_skills: string[];
  match_score: number;
  feedback: string;
}

export interface ATSMultipleMatchResult {
  jd: string;
  results: Array<{
    file: string;
    result?: ATSMatchResult;
    error?: string;
  }>;
}

export class ATSService {
  private baseUrl: string;

  constructor() {
    // Use environment variable or default to local ATS server
    this.baseUrl = process.env.ATS_SERVER_URL || "http://localhost:4000/api";
  }

  /**
   * Match a single resume against a job description
   */
  async matchResumeToJD(
    resumeFile: File,
    jdFile: File
  ): Promise<ATSMatchResult> {
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jd", jdFile);

    try {
      const response = await axios.post(`${this.baseUrl}/match`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("ATS Service Error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to match resume to JD"
      );
    }
  }

  /**
   * Match a single resume against job description text
   */
  async matchResumeToJDText(
    resumeFile: File,
    jobDescriptionText: string
  ): Promise<ATSMatchResult> {
    const formData = new FormData();
    formData.append("resume", resumeFile);
    formData.append("jobDescription", jobDescriptionText);

    try {
      const response = await axios.post(`${this.baseUrl}/match/text`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error: any) {
      console.error("ATS Service Error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to match resume to JD"
      );
    }
  }

  /**
   * Match multiple resumes against a single job description
   */
  async matchMultipleResumesToJD(
    resumeFiles: File[],
    jdFile: File
  ): Promise<ATSMultipleMatchResult> {
    const formData = new FormData();
    
    resumeFiles.forEach((file) => {
      formData.append("resume", file);
    });
    formData.append("jd", jdFile);

    try {
      const response = await axios.post(
        `${this.baseUrl}/match/multiple`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error("ATS Service Error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to match resumes to JD"
      );
    }
  }

  /**
   * Get ATS server health status
   */
  async getHealthStatus(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl.replace("/api", "")}/health`);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const atsService = new ATSService(); 
