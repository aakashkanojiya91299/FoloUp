import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { atsService, ATSBulkMatchResult } from "@/services/atsService";
import {
  CandidateService,
  Candidate as DBCandidate,
} from "@/services/candidates.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Users,
  Star,
  AlertCircle,
} from "lucide-react";
import { useOrganization } from "@clerk/nextjs";

interface FileWithPreview {
  file: File; // Store the original File object
  preview?: string;
}

interface BulkUploadResult {
  file: string;
  candidateName?: string; // Add candidate name field
  result?: {
    match_score: number;
    missing_skills: string[];
    feedback: string;
  };
  error?: string;
  noContactInfo?: boolean; // Flag to indicate no contact info was found
}

interface Interview {
  id: string;
  name: string;
  objective: string;
  job_description?: string;
}

interface ATSBulkUploadProps {
  interview: Interview;
  onCandidatesCreated?: (candidates: any[]) => void;
}

export default function ATSBulkUpload({
  interview,
  onCandidatesCreated,
}: ATSBulkUploadProps) {
  const { organization } = useOrganization();
  const [resumeFiles, setResumeFiles] = useState<FileWithPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<boolean | null>(null);
  const [results, setResults] = useState<BulkUploadResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Handle hydration mismatch
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log("🎯 onDrop called with files:", acceptedFiles);
    console.log(
      "Files dropped details:",
      acceptedFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        lastModified: f.lastModified,
      })),
    );

    if (!acceptedFiles || acceptedFiles.length === 0) {
      console.log("No files accepted");

      return;
    }

    const filesWithPreview = acceptedFiles.map((file) => {
      const fileWithPreview: FileWithPreview = {
        file: file,
        preview: URL.createObjectURL(file),
      };
      console.log("Created file with preview:", fileWithPreview.file.name);

      return fileWithPreview;
    });

    setResumeFiles((prev) => {
      const newFiles = [...prev, ...filesWithPreview];
      console.log("Updated resume files count:", newFiles.length);
      console.log(
        "Updated resume files names:",
        newFiles.map((f) => f?.file?.name || "undefined"),
      );

      return newFiles;
    });
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "application/msword": [".doc"],
    },
    multiple: true,
    onDropRejected: (rejectedFiles) => {
      console.log("❌ Files rejected:", rejectedFiles);
      setError(
        "Some files were rejected. Please ensure they are PDF, DOC, or DOCX files.",
      );
    },
    onDragEnter: () => console.log("🎯 Drag enter"),
    onDragLeave: () => console.log("🎯 Drag leave"),
    onDragOver: () => console.log("🎯 Drag over"),
  });

  const checkServerStatus = async () => {
    try {
      const status = await atsService.getHealthStatus();
      setServerStatus(status);
    } catch (error) {
      setServerStatus(false);
    }
  };

  const handleBulkAnalyze = async () => {
    if (!interview.job_description) {
      setError(
        "No job description found for this interview. Please add one to enable ATS matching.",
      );

      return;
    }

    if (resumeFiles.length === 0) {
      setError("Please upload at least one resume file.");

      return;
    }

    // Debug logging
    console.log("Bulk analyze triggered:", {
      interviewId: interview.id,
      interviewName: interview.name,
      hasJobDescription: !!interview.job_description,
      jobDescriptionLength: interview.job_description?.length || 0,
      resumeFilesCount: resumeFiles.length,
      resumeFileNames: resumeFiles.map((f) => f?.file?.name || "undefined"),
    });

    setIsLoading(true);
    setError(null);
    setProgress(0);
    setResults([]);

    try {
      // Test if job description is valid
      if (
        !interview.job_description ||
        interview.job_description.trim().length === 0
      ) {
        throw new Error("Job description is empty or missing");
      }

      // Test if files are valid
      if (!resumeFiles || resumeFiles.length === 0) {
        throw new Error("No resume files to process");
      }

      // Check if all files are valid
      for (const fileWithPreview of resumeFiles) {
        if (
          !fileWithPreview ||
          !fileWithPreview.file ||
          fileWithPreview.file.size === 0
        ) {
          throw new Error(
            `Invalid file: ${fileWithPreview?.file?.name || "unknown"}`,
          );
        }
      }

      // Check ATS server status first
      const serverStatus = await atsService.getHealthStatus();
      if (!serverStatus) {
        throw new Error(
          "ATS server is not running. Please start the ATS server first.",
        );
      }

      // Extract File objects from FileWithPreview for the service
      const fileObjects = resumeFiles.map(
        (fileWithPreview) => fileWithPreview.file,
      );

      // Analyze all resumes
      const bulkResult = await atsService.matchMultipleResumesToJDText(
        fileObjects,
        interview.job_description,
      );

      // Extract contact info for each file and add candidate names to results
      const resultsWithNames = await Promise.all(
        bulkResult.results.map(async (result) => {
          // Find the corresponding file to extract contact info
          const resumeFileWithPreview = resumeFiles.find(
            (fileWithPreview) => fileWithPreview?.file?.name === result.file,
          );

          let candidateName = getCleanFileName(result.file); // Use filename as fallback

          // Try to extract contact info from the resume
          if (resumeFileWithPreview && !result.error) {
            try {
              const contactInfo = await atsService.extractContactInfo(
                resumeFileWithPreview.file,
              );

              // Check if contact information was found
              const isContactInfoFound = (
                contactInfo.name && contactInfo.name !== "not found" &&
                contactInfo.email && contactInfo.email !== "not found"
              );

              if (isContactInfoFound) {
                if (
                  contactInfo.name &&
                  contactInfo.name !== "not found" &&
                  contactInfo.name.trim() !== ""
                ) {
                  candidateName = contactInfo.name;
                }
              } else {
                console.log(`Contact information not found for ${result.file}, skipping analytics`);
                // Mark this result as having no contact info

                return {
                  ...result,
                  candidateName,
                  error: "Could not extract contact information from resume. Please ensure the resume contains valid contact details.",
                  noContactInfo: true
                };
              }
            } catch (error) {
              console.warn(
                `Could not extract contact info from ${result.file}:`,
                error,
              );
            }
          }

          return {
            ...result,
            candidateName,
            noContactInfo: false, // Add default value for all results
          };
        }),
      );

      setResults(resultsWithNames);
      setProgress(100);

      // Save successful candidates to database
      const successfulCandidates = [];
      for (const result of resultsWithNames) {
        // Skip candidates with no contact info or errors
        if (result.result && !result.error && !result.noContactInfo) {
          // Find the corresponding file to extract contact info
          const resumeFileWithPreview = resumeFiles.find(
            (fileWithPreview) => fileWithPreview?.file?.name === result.file,
          );

          let candidateName = getDisplayName(result.candidateName, result.file); // Use extracted name or filename as fallback
          let candidateEmail = `candidate-${Date.now()}@example.com`; // Generate placeholder email
          let candidatePhone = "";

          // Try to extract contact info from the resume for email and phone
          if (resumeFileWithPreview) {
            try {
              const contactInfo = await atsService.extractContactInfo(
                resumeFileWithPreview.file,
              );
              if (contactInfo.email && contactInfo.email !== "not found") {
                candidateEmail = contactInfo.email;
              }
              if (contactInfo.phone && contactInfo.phone !== "not found") {
                candidatePhone = contactInfo.phone;
              }
            } catch (error) {
              console.warn(
                `Could not extract contact info from ${result.file}:`,
                error,
              );
            }
          }

          const dbCandidate: DBCandidate = {
            name: candidateName,
            email: candidateEmail,
            phone: candidatePhone,
            interview_id: interview.id,
            organization_id: organization?.id || "",
            resume_filename: result.file,
            ats_score: result.result.match_score,
            ats_missing_skills: result.result.missing_skills,
            ats_feedback: result.result.feedback,
          };

          const savedCandidate =
            await CandidateService.createCandidate(dbCandidate);
          if (savedCandidate) {
            successfulCandidates.push(savedCandidate);
          }
        } else if (result.noContactInfo) {
          console.log(`Skipping database save for ${result.file} - no contact info found`);
        }
      }

      onCandidatesCreated?.(successfulCandidates);

      // Reload candidates to ensure data consistency
      await loadCandidates();

      // Clear processed files
      setResumeFiles([]);
    } catch (err: any) {
      setError(err.message || "Failed to analyze resumes");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFiles = () => {
    setResumeFiles([]);
    setResults([]);
    setError(null);
    setProgress(0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) {
      return "text-green-600";
    }
    if (score >= 60) {
      return "text-yellow-600";
    }

    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    }
    if (score >= 60) {
      return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    }

    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>;
  };

  const getCleanFileName = (filename: string) => {
    return filename.replace(/\.[^/.]+$/, "");
  };

  const getDisplayName = (
    candidateName: string | undefined,
    filename: string,
  ) => {
    if (candidateName && candidateName !== "not found") {
      return candidateName;
    }

    return getCleanFileName(filename);
  };

  // Load existing candidates from database
  const loadCandidates = async () => {
    if (!organization?.id || !interview?.id) {
      return;
    }

    try {
      const dbCandidates = await CandidateService.getCandidatesByInterview(
        interview.id,
      );

      // Convert database candidates to UI format for results display
      const uiResults: BulkUploadResult[] = dbCandidates.map((dbCandidate) => ({
        file: dbCandidate.resume_filename || "Unknown file",
        candidateName: dbCandidate.name,
        result: {
          match_score: dbCandidate.ats_score,
          missing_skills: dbCandidate.ats_missing_skills || [],
          feedback: dbCandidate.ats_feedback || "",
        },
      }));

      setResults(uiResults);
    } catch (error) {
      console.error("Error loading candidates:", error);
    }
  };

  React.useEffect(() => {
    if (isClient) {
      checkServerStatus();
      loadCandidates();
    }
  }, [isClient, organization?.id, interview?.id]);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bulk Upload: {interview.name}
            </CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Interview Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Bulk Upload: {interview.name}
          </CardTitle>
          <CardDescription>
            Upload multiple resumes to analyze against this interview&apos;s job
            description
          </CardDescription>
        </CardHeader>
        <CardContent>
          {interview.job_description ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Job Description</Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm max-h-32 overflow-y-auto">
                {interview.job_description}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                No job description found for this interview. Please add a job
                description to enable ATS matching.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Server Status */}
      {isClient && (
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
      )}

      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Resume Upload
          </CardTitle>
          <CardDescription>
            Drag and drop multiple resume files (PDF, DOC, DOCX) or click to
            browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isClient && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
                }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-blue-600">Drop the files here...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    Drag & drop multiple resume files here, or click to select
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, DOC, DOCX files (up to 10 files)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* File List */}
          {isClient && resumeFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">
                Selected Files ({resumeFiles.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {resumeFiles.map((fileWithPreview, index) => (
                  <div
                    key={`${fileWithPreview?.file?.name}-${index}`}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm truncate">
                      {fileWithPreview?.file?.name || "Unknown file"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {fileWithPreview?.file?.size
                        ? (fileWithPreview.file.size / 1024 / 1024).toFixed(2)
                        : "0"}{" "}
                      MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Debug Info */}
          {isClient && process.env.NODE_ENV === "development" && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
              <p>Debug: {resumeFiles.length} files in state</p>
              <p>
                Files:{" "}
                {resumeFiles
                  .map((f) => f?.file?.name || "undefined")
                  .join(", ")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {isClient && (
        <div className="flex gap-3">
          <Button
            disabled={
              isLoading ||
              resumeFiles.length === 0 ||
              !interview.job_description
            }
            className="flex items-center gap-2"
            onClick={handleBulkAnalyze}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Users className="h-4 w-4" />
            )}
            {isLoading
              ? "Analyzing..."
              : `Analyze ${resumeFiles.length} Candidate${resumeFiles.length !== 1 ? "s" : ""}`}
          </Button>

          <Button variant="outline" disabled={isLoading} onClick={clearFiles}>
            Clear All
          </Button>

          {/* Debug button for testing */}
          {process.env.NODE_ENV === "development" && (
            <Button
              variant="outline"
              onClick={() => {
                console.log("Current files:", resumeFiles);
                console.log("Interview:", interview);
              }}
            >
              Debug Info
            </Button>
          )}
        </div>
      )}

      {/* Progress */}
      {isClient && isLoading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing resumes...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Error Display */}
      {isClient && error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {isClient && results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Analysis Results ({results.length} candidates)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div
                  key={`${result.file}-${index}`}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <h4 className="font-medium">
                        {getDisplayName(result.candidateName, result.file)}
                      </h4>
                      {result.candidateName &&
                        result.candidateName !== "not found" &&
                        result.candidateName !==
                        getCleanFileName(result.file) && (
                          <span className="text-sm text-gray-500">
                            File: {result.file}
                          </span>
                        )}
                      {result.candidateName === "not found" && (
                        <span className="text-sm text-gray-500">
                          Name: Not Found
                        </span>
                      )}
                    </div>
                    {result.error ? (
                      <Badge variant="destructive">Error</Badge>
                    ) : result.noContactInfo ? (
                      <Badge variant="secondary">No Contact Info</Badge>
                    ) : (
                      getScoreBadge(result?.result?.match_score || 0)
                    )}
                  </div>

                  {result.error ? (
                    <div className="text-red-600 text-sm">{result.error}</div>
                  ) : result.noContactInfo ? (
                    <div className="text-amber-600 text-sm">
                      Contact information not found in resume. Analytics skipped.
                    </div>
                  ) : result.result ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Match Score:
                        </span>
                        <span
                          className={`font-bold ${getScoreColor(result.result.match_score)}`}
                        >
                          {result.result.match_score}%
                        </span>
                      </div>

                      {Array.isArray(result.result.missing_skills) &&
                        result.result.missing_skills.length > 0 && (
                          <div>
                            <span className="text-sm font-medium">
                              Missing Skills:
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {result.result.missing_skills.map(
                                (skill, skillIndex) => (
                                  <Badge
                                    key={`${skill}-${skillIndex}`}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {skill}
                                  </Badge>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {result.result.feedback && (
                        <div>
                          <span className="text-sm font-medium">Feedback:</span>
                          <p className="text-sm text-gray-600 mt-1">
                            {result.result.feedback}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
