"use client";

import React, { useState, useEffect } from "react";
import { useOrganization } from "@clerk/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Users,
  Star,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";
import ATSInterviewIntegration from "@/components/ATSInterviewIntegration";
import ATSBulkUpload from "@/components/ATSBulkUpload";
import CandidateInterviewLinkGenerator from "@/components/CandidateInterviewLinkGenerator";
import { InterviewService } from "@/services/interviews.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandidateService } from "@/services/candidates.service";

interface Interview {
  id: string;
  name: string;
  objective: string;
  job_description?: string;
  created_at: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  resumeFile?: File;
  resume_filename?: string;
  atsResult: any;
  createdAt: Date;
  interviewId: string;
}

export default function ATSCandidatesPage() {
  const { organization } = useOrganization();
  const [isClient, setIsClient] = useState(false);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null,
  );
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && organization?.id) {
      loadInterviews();
    }
  }, [isClient, organization]);

  useEffect(() => {
    if (isClient && selectedInterview?.id) {
      loadCandidates();
    }
  }, [isClient, selectedInterview]);

  const loadInterviews = async () => {
    if (!organization?.id) {
      return;
    }

    setLoading(true);
    try {
      const data = await InterviewService.getAllInterviews(
        organization.id,
        organization.id,
      );
      setInterviews(data);
      if (data.length > 0 && !selectedInterview) {
        setSelectedInterview(data[0]);
      }
    } catch (error) {
      console.error("Failed to load interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = async () => {
    if (!selectedInterview?.id || !organization?.id) {
      return;
    }

    setLoading(true);
    try {
      const dbCandidates = await CandidateService.getCandidatesByInterview(
        selectedInterview.id,
      );

      // Convert database candidates to UI format
      const uiCandidates: Candidate[] = dbCandidates.map((dbCandidate) => ({
        id: dbCandidate.id || "",
        name: dbCandidate.name,
        email: dbCandidate.email,
        phone: dbCandidate.phone || "",
        resume_filename: dbCandidate.resume_filename,
        atsResult: {
          match_score: dbCandidate.ats_score,
          missing_skills: dbCandidate.ats_missing_skills || [],
          feedback: dbCandidate.ats_feedback || "",
        },
        createdAt: dbCandidate.created_at
          ? new Date(dbCandidate.created_at)
          : new Date(),
        interviewId: dbCandidate.interview_id,
      }));

      setCandidates(uiCandidates);
    } catch (error) {
      console.error("Failed to load candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateCreated = async (candidate: any) => {
    const candidateWithInterview = {
      ...candidate,
      interviewId: selectedInterview?.id || "",
    };
    setCandidates((prev) => [...prev, candidateWithInterview]);

    // Reload candidates to ensure data consistency
    await loadCandidates();
  };

  const handleCandidatesCreated = async (candidates: any[]) => {
    const candidatesWithInterview = candidates.map((candidate) => ({
      ...candidate,
      interviewId: selectedInterview?.id || "",
    }));
    setCandidates((prev) => [...prev, ...candidatesWithInterview]);

    // Reload candidates to ensure data consistency
    await loadCandidates();
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

  const filteredCandidates = candidates.filter(
    (candidate) =>
      !selectedInterview || candidate.interviewId === selectedInterview.id,
  );

  // Sort candidates by match score
  const sortedCandidates = [...filteredCandidates].sort((a, b) => {
    const scoreA = a.atsResult?.match_score || 0;
    const scoreB = b.atsResult?.match_score || 0;

    return sortOrder === "desc" ? scoreB - scoreA : scoreA - scoreB;
  });

  const averageScore =
    filteredCandidates.length > 0
      ? filteredCandidates.reduce((sum, candidate) => {
        const score = candidate.atsResult?.match_score || 0;

        return sum + score;
      }, 0) / filteredCandidates.length
      : 0;

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-8 pt-0 ml-12 mr-auto rounded-md">
      <div className="flex flex-col items-left">
        <h2 className="mr-2 text-2xl font-semibold tracking-tight mt-8">
          ATS Candidate Management
        </h2>
        <h3 className="text-sm tracking-tight text-gray-600 font-medium">
          Upload resumes and analyze candidates against interview job
          descriptions
        </h3>

        {/* Interview Selection */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Select Interview
            </CardTitle>
            <CardDescription>
              Choose an interview to manage candidates and analyze resumes
              against its job description
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedInterview?.id || ""}
              onValueChange={(value) => {
                const interview = interviews.find((i) => i.id === value);
                setSelectedInterview(interview || null);
              }}
            >
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Select an interview" />
              </SelectTrigger>
              <SelectContent>
                {interviews.map((interview) => (
                  <SelectItem key={interview.id} value={interview.id}>
                    <div className="flex">
                      <span>{interview.name} - </span>
                      <span className="max-w-xs truncate">
                        {interview.objective}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedInterview && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">{selectedInterview.name}</h4>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedInterview.objective}
                </p>
                {selectedInterview.job_description ? (
                  <p className="text-sm text-green-600">
                    ✓ Job description available
                  </p>
                ) : (
                    <p className="text-sm text-red-600">
                      ⚠ No job description found
                    </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        {selectedInterview && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Total Candidates</p>
                    <p className="text-2xl font-bold">
                      {filteredCandidates.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p
                      className={`text-2xl font-bold ${getScoreColor(averageScore)}`}
                    >
                      {averageScore.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Top Performers</p>
                    <p className="text-2xl font-bold">
                      {
                        filteredCandidates.filter(
                          (c) => (c.atsResult?.match_score || 0) >= 80,
                        ).length
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ATS Integration */}
        {selectedInterview && (
          <div className="mt-6">
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single">Single Upload</TabsTrigger>
                <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="mt-4">
                <ATSInterviewIntegration
                  interview={selectedInterview}
                  onCandidateCreated={handleCandidateCreated}
                />
              </TabsContent>
              <TabsContent value="bulk" className="mt-4">
                <ATSBulkUpload
                  interview={selectedInterview}
                  onCandidatesCreated={handleCandidatesCreated}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Candidates Table */}
        {filteredCandidates.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Candidates ({filteredCandidates.length})
                </div>
                <Button
                  className="flex items-center gap-2"
                  disabled={loading}
                  size="sm"
                  variant="outline"
                  onClick={loadCandidates}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                All candidates analyzed for {selectedInterview?.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-2">
                        Match Score
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() =>
                            setSortOrder(sortOrder === "desc" ? "asc" : "desc")
                          }
                        >
                          {sortOrder === "desc" ? "↓" : "↑"}
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead>Missing Skills</TableHead>
                    <TableHead>Feedback</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{candidate.name}</p>
                          <p className="text-sm text-gray-500">
                            {candidate.resumeFile?.name ||
                              candidate.resume_filename ||
                              "Resume file"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {candidate.email}
                          </div>
                          {candidate.phone && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3" />
                              {candidate.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${getScoreColor(candidate.atsResult?.match_score || 0)}`}
                          >
                            {candidate.atsResult?.match_score || 0}%
                          </span>
                          {getScoreBadge(candidate.atsResult?.match_score || 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {candidate.atsResult?.missing_skills
                            ?.slice(0, 3)
                            .map((skill: string, index: number) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            )) || []}
                          {candidate.atsResult?.missing_skills &&
                            candidate.atsResult.missing_skills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{candidate.atsResult.missing_skills.length - 3}{" "}
                                more
                              </Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {candidate.atsResult?.feedback ||
                              "No feedback available"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {candidate.createdAt
                            ? (() => {
                              const date = new Date(candidate.createdAt);
                              return date.toLocaleDateString();
                            })()
                            : "Unknown date"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <CandidateInterviewLinkGenerator
                          candidate={{
                            id: candidate.id,
                            name: candidate.name,
                            email: candidate.email,
                            phone: candidate.phone,
                          }}
                          interview={selectedInterview!}
                          onLinkCreated={(link) => {
                            console.log("New link created:", link);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* No Interview Selected */}
        {!selectedInterview && (
          <Card className="mt-6">
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">
                  Select an interview to start managing candidates
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
