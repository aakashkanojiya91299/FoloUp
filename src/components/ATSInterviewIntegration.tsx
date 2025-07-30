"use client";

import React, { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { atsService, ATSMatchResult } from "@/services/atsService";
import { CandidateService, Candidate as DBCandidate } from "@/services/candidates.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";

import { 
  Loader2, 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  User, 
  Mail, 
  Phone,
  Star,
  Users
} from "lucide-react";
import { useOrganization } from "@clerk/nextjs";

interface FileWithPreview extends File {
  preview?: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resumeFile: File;
  atsResult: ATSMatchResult;
  createdAt: Date;
}

interface Interview {
  id: string;
  name: string;
  objective: string;
  job_description?: string;
}

interface ATSInterviewIntegrationProps {
  interview: Interview;
  onCandidateCreated?: (candidate: Candidate) => void;
}

export default function ATSInterviewIntegration({ 
  interview, 
  onCandidateCreated 
}: ATSInterviewIntegrationProps) {
  const { organization } = useOrganization();
  const [resumeFiles, setResumeFiles] = useState<FileWithPreview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<boolean | null>(null);


  const onResumeDrop = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
    onDrop: (acceptedFiles) => {
      const filesWithPreview = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );
      setResumeFiles((prev) => [...prev, ...filesWithPreview]);
    },
  });

  const checkServerStatus = async () => {
    try {
      const status = await atsService.getHealthStatus();
      setServerStatus(status);
    } catch (error) {
      setServerStatus(false);
    }
  };

  const handleAnalyzeResume = async (resumeFile: File, candidateInfo: any) => {
    if (!interview.job_description) {
      setError("No job description found for this interview. Please add a job description first.");
      
return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First extract contact information from resume
      const contactInfo = await atsService.extractContactInfo(resumeFile);

      // Use extracted contact info with fallback to filename
      const finalCandidateInfo = {
        name: (contactInfo.name && contactInfo.name !== "not found") ? contactInfo.name : getCleanFileName(resumeFile.name),
        email: (contactInfo.email && contactInfo.email !== "not found") ? contactInfo.email : `candidate-${Date.now()}@example.com`,
        phone: (contactInfo.phone && contactInfo.phone !== "not found") ? contactInfo.phone : (candidateInfo.phone || ""),
      };

      // Check if we have at least a name (either extracted or from filename)
      if (!finalCandidateInfo.name) {
        throw new Error("Could not extract name from resume and filename is not available.");
      }

      const result = await atsService.matchResumeToJDText(resumeFile, interview.job_description);
      
      if ('error' in result) {
        throw new Error(result.error as string);
      }

      // Save candidate to database
      const dbCandidate: DBCandidate = {
        name: finalCandidateInfo.name,
        email: finalCandidateInfo.email,
        phone: finalCandidateInfo.phone,
        interview_id: interview.id,
        organization_id: organization?.id || "",
        resume_filename: resumeFile.name,
        ats_score: result.match_score,
        ats_missing_skills: result.missing_skills,
        ats_feedback: result.feedback,
      };

      const savedCandidate = await CandidateService.createCandidate(dbCandidate);
      
      if (savedCandidate) {
        // Add to local state for UI
        const candidate: Candidate = {
          id: savedCandidate.id || `candidate_${Date.now()}`,
          name: finalCandidateInfo.name,
          email: finalCandidateInfo.email,
          phone: finalCandidateInfo.phone,
          resumeFile: resumeFile,
          atsResult: result,
          createdAt: new Date(),
        };

        setCandidates(prev => [...prev, candidate]);
        onCandidateCreated?.(candidate);

        // Reload candidates to ensure data consistency
        await loadCandidates();
      } else {
        throw new Error("Failed to save candidate to database");
      }
      
      // Remove the processed file
      setResumeFiles(prev => prev.filter(f => f !== resumeFile));

    } catch (err: any) {
      setError(err.message || "Failed to analyze resume");
    } finally {
      setIsLoading(false);
    }
  };



  const clearFiles = () => {
    setResumeFiles([]);
    setError(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) {return "text-green-600";}
    if (score >= 60) {return "text-yellow-600";}
    
return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) {return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;}
    if (score >= 60) {return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;}
    
return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const getCleanFileName = (filename: string) => {
    return filename.replace(/\.[^/.]+$/, "");
  };

  const getDisplayName = (candidateName: string | undefined, filename: string) => {
    if (candidateName && candidateName !== "not found") {
      return candidateName;
    }
    return getCleanFileName(filename);
  };

  // Load existing candidates from database
  const loadCandidates = async () => {
    if (!organization?.id) {return;}
    
    try {
      const dbCandidates = await CandidateService.getCandidatesByInterview(interview.id);
      
      // Convert database candidates to UI format
      const uiCandidates: Candidate[] = dbCandidates.map(dbCandidate => ({
        id: dbCandidate.id || `candidate_${Date.now()}`,
        name: dbCandidate.name,
        email: dbCandidate.email,
        phone: dbCandidate.phone,
        resumeFile: new File([], dbCandidate.resume_filename), // Placeholder file
        atsResult: {
          match_score: dbCandidate.ats_score,
          missing_skills: dbCandidate.ats_missing_skills,
          feedback: dbCandidate.ats_feedback,
        },
        createdAt: new Date(dbCandidate.created_at || Date.now()),
      }));
      
      setCandidates(uiCandidates);
    } catch (error) {
      console.error("Error loading candidates:", error);
    }
  };

  React.useEffect(() => {
    checkServerStatus();
    loadCandidates();
  }, [organization?.id, interview.id]);

  return (
    <div className="space-y-6">
      {/* Interview Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Interview: {interview.name}
          </CardTitle>
          <CardDescription>
            {interview.objective}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {interview.job_description ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Job Description</Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                {interview.job_description}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No job description found for this interview. Please add a job description to enable ATS matching.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Server Status */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">ATS Server Status:</span>
        {serverStatus === null ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : serverStatus ? (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="h-4 w-4" />
            <span className="text-sm">Disconnected</span>
          </div>
        )}
      </div>

      {/* Resume Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Resume
          </CardTitle>
          <CardDescription>
            Upload a resume to automatically extract contact information and analyze against the job description
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!interview.job_description ? (
            <Alert>
              <AlertDescription>
                Please add a job description to this interview to enable ATS matching.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
                <div
                  {...onResumeDrop.getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${onResumeDrop.isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                    }`}
                >
                  <input {...onResumeDrop.getInputProps()} />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Drop resume here, or click to select
                    </p>
                    <p className="text-xs text-gray-500">PDF, DOC, or DOCX</p>
                  </div>
                </div>

                {resumeFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Selected Files:</h4>
                    <div className="space-y-2">
                      {resumeFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isLoading}
                            className="flex items-center gap-2"
                            onClick={() => handleAnalyzeResume(file, { name: "", email: "", phone: "" })}
                          >
                            {isLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Star className="h-3 w-3" />
                            )}
                            Analyze
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Candidates List */}
      {candidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Candidates ({candidates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <Card key={candidate.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-gray-500" />
                        <div>
                          <h4 className="font-semibold">
                            {candidate.name}
                            {candidate.name === getCleanFileName(candidate.resumeFile.name) && (
                              <span className="text-xs text-gray-500 ml-2">(from filename)</span>
                            )}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {candidate.email === "not found" ? (
                                <span className="text-red-500">Email: Not Found</span>
                              ) : candidate.email.includes("candidate-") ? (
                                <span className="text-yellow-600">Email: Generated</span>
                              ) : (
                                candidate.email
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {candidate.phone && candidate.phone !== "not found" ? (
                                candidate.phone
                              ) : (
                                <span className="text-red-500">Phone: Not Found</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* ATS Results */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Match Score:</span>
                          <div className="flex items-center gap-2">
                            <Progress value={candidate.atsResult.match_score} className="w-20" />
                            <span className={`text-lg font-bold ${getScoreColor(candidate.atsResult.match_score)}`}>
                              {candidate.atsResult.match_score}%
                            </span>
                            {getScoreBadge(candidate.atsResult.match_score)}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-sm font-medium">Feedback:</span>
                          <p className="text-sm text-gray-600 mt-1">{candidate.atsResult.feedback}</p>
                        </div>

                        {candidate.atsResult.missing_skills.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">Missing Skills:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {candidate.atsResult.missing_skills.map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
} 
