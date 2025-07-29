"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { atsService, ATSMatchResult, ATSMultipleMatchResult } from "@/services/atsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileText, CheckCircle, XCircle } from "lucide-react";

interface FileWithPreview extends File {
  preview?: string;
}

export default function ATSResumeMatcher() {
  const [resumeFiles, setResumeFiles] = useState<FileWithPreview[]>([]);
  const [jdFile, setJdFile] = useState<FileWithPreview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ATSMultipleMatchResult | null>(null);
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

  const onJDDrop = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = Object.assign(acceptedFiles[0], {
          preview: URL.createObjectURL(acceptedFiles[0]),
        });
        setJdFile(file);
      }
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

  const handleMatch = async () => {
    if (!jdFile || resumeFiles.length === 0) {
      setError("Please upload both a job description and at least one resume.");
      
return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const result = await atsService.matchMultipleResumesToJD(resumeFiles, jdFile);
      setResults(result);
    } catch (err: any) {
      setError(err.message || "Failed to match resumes");
    } finally {
      setIsLoading(false);
    }
  };

  const clearFiles = () => {
    setResumeFiles([]);
    setJdFile(null);
    setResults(null);
    setError(null);
  };

  React.useEffect(() => {
    checkServerStatus();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            ATS Resume Matcher
          </CardTitle>
          <CardDescription>
            Upload resumes and job descriptions to get AI-powered matching scores and feedback
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {/* Job Description Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Description</label>
            <div
              {...onJDDrop.getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                onJDDrop.isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...onJDDrop.getInputProps()} />
              {jdFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  <span className="text-sm">{jdFile.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Drop job description here, or click to select
                  </p>
                  <p className="text-xs text-gray-500">PDF, DOC, or DOCX</p>
                </div>
              )}
            </div>
          </div>

          {/* Resume Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Resumes (up to 5)</label>
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
                <p className="text-xs text-gray-500">PDF, DOC, or DOCX (max 5 files)</p>
              </div>
            </div>
          </div>

          {/* Uploaded Files */}
          {resumeFiles.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Uploaded Resumes:</label>
              <div className="flex flex-wrap gap-2">
                {resumeFiles.map((file, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {file.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              disabled={isLoading || !jdFile || resumeFiles.length === 0 || !serverStatus}
              className="flex items-center gap-2"
              onClick={handleMatch}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {isLoading ? "Matching..." : "Match Resumes"}
            </Button>
            <Button variant="outline" onClick={clearFiles}>
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Matching Results</CardTitle>
            <CardDescription>
              Analysis for {results.jd} against {results.results.length} resume(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{result.file}</h4>
                {result.error ? (
                  <Alert variant="destructive">
                    <AlertDescription>{result.error}</AlertDescription>
                  </Alert>
                ) : result.result ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Match Score:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={result.result.match_score} className="w-20" />
                        <span className="text-sm font-bold">{result.result.match_score}%</span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium">Feedback:</span>
                      <p className="text-sm text-gray-600 mt-1">{result.result.feedback}</p>
                    </div>

                    {result.result.missing_skills.length > 0 && (
                      <div>
                        <span className="text-sm font-medium">Missing Skills:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.result.missing_skills.map((skill, skillIndex) => (
                            <Badge key={skillIndex} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 
