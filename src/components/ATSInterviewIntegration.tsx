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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
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
  Plus,
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
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [currentCandidate, setCurrentCandidate] = useState({
    name: "",
    email: "",
    phone: "",
    resumeFile: null as File | null,
  });

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
      const result = await atsService.matchResumeToJDText(resumeFile, interview.job_description);
      
      if ('error' in result) {
        throw new Error(result.error as string);
      }

      // Save candidate to database
      const dbCandidate: DBCandidate = {
        name: candidateInfo.name,
        email: candidateInfo.email,
        phone: candidateInfo.phone,
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
          name: candidateInfo.name,
          email: candidateInfo.email,
          phone: candidateInfo.phone,
          resumeFile: resumeFile,
          atsResult: result,
          createdAt: new Date(),
        };

        setCandidates(prev => [...prev, candidate]);
        onCandidateCreated?.(candidate);
      } else {
        throw new Error("Failed to save candidate to database");
      }
      
      // Remove the processed file
      setResumeFiles(prev => prev.filter(f => f !== resumeFile));
      
      setIsAddCandidateOpen(false);
      setCurrentCandidate({ name: "", email: "", phone: "", resumeFile: null });

    } catch (err: any) {
      setError(err.message || "Failed to analyze resume");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCandidate = async () => {
    if (!currentCandidate.name || !currentCandidate.email || !currentCandidate.resumeFile) {
      setError("Please fill in all required fields and upload a resume.");
      return;
    }

    await handleAnalyzeResume(currentCandidate.resumeFile, currentCandidate);
  };

  const clearFiles = () => {
    setResumeFiles([]);
    setError(null);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  // Load existing candidates from database
  const loadCandidates = async () => {
    if (!organization?.id) return;
    
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

      {/* Add Candidate */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Add Candidate
            </CardTitle>
            <Dialog open={isAddCandidateOpen} onOpenChange={setIsAddCandidateOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Candidate
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Candidate</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={currentCandidate.name}
                      onChange={(e) => setCurrentCandidate({ ...currentCandidate, name: e.target.value })}
                      placeholder="Enter candidate name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={currentCandidate.email}
                      onChange={(e) => setCurrentCandidate({ ...currentCandidate, email: e.target.value })}
                      placeholder="Enter candidate email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      value={currentCandidate.phone}
                      onChange={(e) => setCurrentCandidate({ ...currentCandidate, phone: e.target.value })}
                      placeholder="Enter candidate phone"
                    />
                  </div>
                  <div>
                    <Label htmlFor="resume">Resume File *</Label>
                    <Input
                      id="resume"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setCurrentCandidate({ 
                        ...currentCandidate, 
                        resumeFile: e.target.files?.[0] || null 
                      })}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Supported formats: PDF, DOC, DOCX
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddCandidateOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddCandidate}
                      disabled={isLoading || !currentCandidate.name || !currentCandidate.email || !currentCandidate.resumeFile}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                      {isLoading ? "Analyzing..." : "Add & Analyze"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {!interview.job_description ? (
            <Alert>
              <AlertDescription>
                Please add a job description to this interview to enable ATS matching.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="text-sm text-gray-600">
              Upload candidate resumes to get AI-powered matching scores against the job description.
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
                          <h4 className="font-semibold">{candidate.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {candidate.email}
                            </span>
                            {candidate.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {candidate.phone}
                              </span>
                            )}
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

      {/* Resume Upload Area */}
      {interview.job_description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Resume Upload
            </CardTitle>
            <CardDescription>
              Upload multiple resumes to analyze against the job description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...onResumeDrop.getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                onResumeDrop.isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...onResumeDrop.getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Drop resumes here, or click to select
                </p>
                <p className="text-xs text-gray-500">PDF, DOC, or DOCX</p>
              </div>
            </div>
            
            {resumeFiles.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium">Uploaded Files:</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {resumeFiles.map((file, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {file.name}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <Button 
                    onClick={clearFiles}
                    variant="outline"
                    size="sm"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
