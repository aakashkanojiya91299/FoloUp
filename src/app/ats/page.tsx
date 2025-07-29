import ATSResumeMatcher from "@/components/ATSResumeMatcher";

export default function ATSPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ATS Resume Matching System
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Upload resumes and job descriptions to get AI-powered analysis, matching scores, 
            and detailed feedback on candidate suitability for positions.
          </p>
        </div>
        
        <ATSResumeMatcher />
      </div>
    </div>
  );
} 
