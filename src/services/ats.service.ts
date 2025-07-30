import {
  Resume,
  ResumeAnalysis,
  ATSJobRequirements,
} from "@/types/interviewee";

export class ATSService {
  // Parse resume content and extract information
  static async parseResume(file: File): Promise<Partial<Resume>> {
    try {
      const text = await this.extractTextFromFile(file);

      return {
        parsed_content: text,
        skills: this.extractSkills(text),
        experience_years: this.extractExperienceYears(text),
        education: this.extractEducation(text),
        certifications: this.extractCertifications(text),
        languages: this.extractLanguages(text),
      };
    } catch (error) {
      console.error("Error parsing resume:", error);
      throw new Error("Failed to parse resume");
    }
  }

  // Analyze resume against job requirements
  static async analyzeResume(
    resume: Resume,
    jobRequirements?: ATSJobRequirements,
    interviewId?: string,
    aiProvider: "openai" | "gemini" = "openai",
  ): Promise<ResumeAnalysis> {
    const analysis: ResumeAnalysis = {
      id: `analysis_${Date.now()}`,
      resume_id: resume.id,
      interview_id: interviewId || resume.interview_id || "",
      ai_provider: aiProvider,
      overall_score: 0,
      skills_match: 0,
      experience_match: 0,
      education_match: 0,
      technical_skills: resume.skills || [],
      soft_skills: this.extractSoftSkills(resume.parsed_content || ""),
      experience_summary: this.generateExperienceSummary(resume),
      education_summary: this.generateEducationSummary(resume),
      recommendations: [],
      created_at: new Date().toISOString(),
    };

    if (jobRequirements) {
      // Calculate scores based on job requirements
      analysis.skills_match = this.calculateSkillsMatch(
        resume,
        jobRequirements,
      );
      analysis.experience_match = this.calculateExperienceMatch(
        resume,
        jobRequirements,
      );
      analysis.education_match = this.calculateEducationMatch(
        resume,
        jobRequirements,
      );
      analysis.overall_score = Math.round(
        (analysis.skills_match +
          analysis.experience_match +
          analysis.education_match) /
          3,
      );
      analysis.recommendations = this.generateRecommendations(
        resume,
        jobRequirements,
      );
    } else {
      // Generate mock scores for demonstration
      analysis.skills_match = Math.floor(Math.random() * 30) + 70;
      analysis.experience_match = Math.floor(Math.random() * 30) + 70;
      analysis.education_match = Math.floor(Math.random() * 30) + 70;
      analysis.overall_score = Math.round(
        (analysis.skills_match +
          analysis.experience_match +
          analysis.education_match) /
          3,
      );
      analysis.recommendations = [
        "Highlight relevant project experience",
        "Add more specific technical skills",
        "Include certifications if available",
        "Quantify achievements with metrics",
      ];
    }

    return analysis;
  }

  // Extract text from various file formats
  private static async extractTextFromFile(file: File): Promise<string> {
    // This is a simplified version. In production, you'd use libraries like pdf-parse, mammoth, etc.
    if (file.type === "text/plain") {
      return await file.text();
    } else if (file.type === "application/pdf") {
      // For PDF files, you'd need a PDF parsing library
      // For now, return a placeholder
      return "PDF content would be extracted here";
    } else if (file.type.includes("word")) {
      // For Word documents, you'd need a DOC/DOCX parsing library
      return "Word document content would be extracted here";
    }

    throw new Error("Unsupported file format");
  }

  // Extract skills from resume text
  private static extractSkills(text: string): string[] {
    const commonSkills = [
      "JavaScript",
      "Python",
      "Java",
      "React",
      "Node.js",
      "Angular",
      "Vue.js",
      "SQL",
      "MongoDB",
      "PostgreSQL",
      "AWS",
      "Docker",
      "Kubernetes",
      "Git",
      "Agile",
      "Scrum",
      "Machine Learning",
      "AI",
      "Data Analysis",
      "Project Management",
      "Leadership",
      "Communication",
      "Problem Solving",
    ];

    const foundSkills = commonSkills.filter((skill) =>
      text.toLowerCase().includes(skill.toLowerCase()),
    );

    return foundSkills;
  }

  // Extract experience years from resume text
  private static extractExperienceYears(text: string): number {
    const experiencePatterns = [
      /(\d+)\+?\s*years?\s*of\s*experience/gi,
      /experience:\s*(\d+)\+?\s*years?/gi,
      /(\d+)\+?\s*years?\s*in\s*the\s*field/gi,
    ];

    for (const pattern of experiencePatterns) {
      const match = pattern.exec(text);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // Default to 3 years if no pattern found
    return 3;
  }

  // Extract education from resume text
  private static extractEducation(text: string): string[] {
    const educationKeywords = [
      "Bachelor",
      "Master",
      "PhD",
      "MBA",
      "BSc",
      "MSc",
      "PhD",
      "Computer Science",
      "Engineering",
      "Business",
      "Mathematics",
    ];

    const foundEducation = educationKeywords.filter((edu) =>
      text.toLowerCase().includes(edu.toLowerCase()),
    );

    return foundEducation;
  }

  // Extract certifications from resume text
  private static extractCertifications(text: string): string[] {
    const certificationKeywords = [
      "AWS",
      "Azure",
      "Google Cloud",
      "PMP",
      "Scrum Master",
      "Agile",
      "CISSP",
      "CompTIA",
      "Microsoft",
      "Oracle",
      "Cisco",
    ];

    const foundCertifications = certificationKeywords.filter((cert) =>
      text.toLowerCase().includes(cert.toLowerCase()),
    );

    return foundCertifications;
  }

  // Extract languages from resume text
  private static extractLanguages(text: string): string[] {
    const languageKeywords = [
      "English",
      "Spanish",
      "French",
      "German",
      "Chinese",
      "Japanese",
      "Korean",
      "Arabic",
      "Russian",
      "Portuguese",
      "Italian",
    ];

    const foundLanguages = languageKeywords.filter((lang) =>
      text.toLowerCase().includes(lang.toLowerCase()),
    );

    return foundLanguages;
  }

  // Extract soft skills from resume text
  private static extractSoftSkills(text: string): string[] {
    const softSkills = [
      "Communication",
      "Leadership",
      "Teamwork",
      "Problem Solving",
      "Critical Thinking",
      "Adaptability",
      "Time Management",
      "Creativity",
      "Collaboration",
      "Interpersonal Skills",
    ];

    const foundSoftSkills = softSkills.filter((skill) =>
      text.toLowerCase().includes(skill.toLowerCase()),
    );

    return foundSoftSkills;
  }

  // Calculate skills match percentage
  private static calculateSkillsMatch(
    resume: Resume,
    jobRequirements: ATSJobRequirements,
  ): number {
    const resumeSkills = resume.skills || [];
    const requiredSkills = jobRequirements.required_skills || [];
    const preferredSkills = jobRequirements.preferred_skills || [];

    let requiredMatch = 0;
    let preferredMatch = 0;

    // Calculate required skills match
    if (requiredSkills.length > 0) {
      const matchedRequired = requiredSkills.filter((skill) =>
        resumeSkills.some(
          (resumeSkill) =>
            resumeSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(resumeSkill.toLowerCase()),
        ),
      );
      requiredMatch = (matchedRequired.length / requiredSkills.length) * 100;
    }

    // Calculate preferred skills match
    if (preferredSkills.length > 0) {
      const matchedPreferred = preferredSkills.filter((skill) =>
        resumeSkills.some(
          (resumeSkill) =>
            resumeSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(resumeSkill.toLowerCase()),
        ),
      );
      preferredMatch = (matchedPreferred.length / preferredSkills.length) * 50;
    }

    return Math.round(requiredMatch + preferredMatch);
  }

  // Calculate experience match percentage
  private static calculateExperienceMatch(
    resume: Resume,
    jobRequirements: ATSJobRequirements,
  ): number {
    const resumeExperience = resume.experience_years || 0;
    const requiredExperience = jobRequirements.experience_required || 0;

    if (resumeExperience >= requiredExperience) {
      return 100;
    } else if (resumeExperience >= requiredExperience * 0.8) {
      return 80;
    } else if (resumeExperience >= requiredExperience * 0.6) {
      return 60;
    } else {
      return Math.round((resumeExperience / requiredExperience) * 100);
    }
  }

  // Calculate education match percentage
  private static calculateEducationMatch(
    resume: Resume,
    jobRequirements: ATSJobRequirements,
  ): number {
    const resumeEducation = resume.education || [];
    const requiredEducation = jobRequirements.education_required || [];

    if (requiredEducation.length === 0) {
      return 100; // No education requirements
    }

    const matchedEducation = requiredEducation.filter((edu) =>
      resumeEducation.some(
        (resumeEdu) =>
          resumeEdu.toLowerCase().includes(edu.toLowerCase()) ||
          edu.toLowerCase().includes(resumeEdu.toLowerCase()),
      ),
    );

    return Math.round(
      (matchedEducation.length / requiredEducation.length) * 100,
    );
  }

  // Generate experience summary
  private static generateExperienceSummary(resume: Resume): string {
    const years = resume.experience_years || 0;
    const skills = resume.skills || [];

    if (years > 0) {
      return `${years}+ years of experience in ${skills.slice(0, 3).join(", ")}`;
    }

    return "Experience details available in resume";
  }

  // Generate education summary
  private static generateEducationSummary(resume: Resume): string {
    const education = resume.education || [];

    if (education.length > 0) {
      return education.join(", ");
    }

    return "Education details available in resume";
  }

  // Generate recommendations based on job requirements
  private static generateRecommendations(
    resume: Resume,
    jobRequirements: ATSJobRequirements,
  ): string[] {
    const recommendations: string[] = [];
    const resumeSkills = resume.skills || [];
    const requiredSkills = jobRequirements.required_skills || [];
    const missingSkills = requiredSkills.filter(
      (skill) =>
        !resumeSkills.some(
          (resumeSkill) =>
            resumeSkill.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(resumeSkill.toLowerCase()),
        ),
    );

    if (missingSkills.length > 0) {
      recommendations.push(
        `Add missing required skills: ${missingSkills.join(", ")}`,
      );
    }

    if (resume.experience_years && jobRequirements.experience_required) {
      if (resume.experience_years < jobRequirements.experience_required) {
        recommendations.push(
          `Highlight relevant experience to meet ${jobRequirements.experience_required} years requirement`,
        );
      }
    }

    if (resume.education && jobRequirements.education_required) {
      const missingEducation = jobRequirements.education_required.filter(
        (edu) =>
          !resume?.education?.some(
            (resumeEdu) =>
              resumeEdu.toLowerCase().includes(edu.toLowerCase()) ||
              edu.toLowerCase().includes(resumeEdu.toLowerCase()),
          ),
      );

      if (missingEducation.length > 0) {
        recommendations.push(
          `Consider adding education requirements: ${missingEducation.join(", ")}`,
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push("Resume matches job requirements well");
      recommendations.push("Consider adding quantifiable achievements");
      recommendations.push("Highlight relevant project experience");
    }

    return recommendations;
  }
}
