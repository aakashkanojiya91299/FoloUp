"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { InterviewService } from "@/services/interviews.service";
import { ResponseService } from "@/services/responses.service";
import { Interview } from "@/types/interview";
import {
    CandidateInterviewLink,
    CandidateInterviewLinkApiService,
} from "@/services/candidateInterviewLinks.api";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Calendar,
    AlertTriangle,
} from "lucide-react";

interface Props {
    params: {
        uniqueLinkId: string;
    };
}

export default function CandidateInterviewPage({ params }: Props) {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [link, setLink] = useState<CandidateInterviewLink | null>(null);
    const [interview, setInterview] = useState<Interview | null>(null);
    const [hasCompletedInterview, setHasCompletedInterview] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            validateAndLoadLink();
        }
    }, [isClient, params.uniqueLinkId]);

    const validateAndLoadLink = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Get the link by unique ID
            const linkData = await CandidateInterviewLinkApiService.getLinkByUniqueId(
                params.uniqueLinkId,
            );

            if (!linkData) {
                setError("Invalid interview link. Please check the URL and try again.");

                return;
            }

            // Check if link is expired (status-based or time-based)
            if (linkData.status === "expired") {
                setError(
                    "This interview link has expired. Please contact the interviewer for a new link.",
                );

                return;
            }

            // Check for time-based expiration
            if (linkData.expires_at) {
                const expiresAt = new Date(linkData.expires_at);
                const now = new Date();
                if (expiresAt < now) {
                    setError(
                        "This interview link has passed its expiration date. Please contact the interviewer for a new link.",
                    );

                    return;
                }
            }

            // Check if interview is already completed
            if (linkData.status === "completed") {
                setHasCompletedInterview(true);
                setError("This interview has already been completed.");

                return;
            }

            // Load the interview details
            const interviewData = await InterviewService.getInterviewById(
                linkData.interview_id,
            );
            if (!interviewData) {
                setError("Interview not found. Please contact the interviewer.");

                return;
            }

            // Check if interview is active
            if (!interviewData.is_active) {
                setError(
                    "This interview is currently inactive. Please contact the interviewer.",
                );

                return;
            }

            // Check if candidate has already completed this interview
            const existingResponses = await ResponseService.getAllResponses(
                linkData.interview_id,
            );
            const hasResponse = existingResponses.some(
                (response) =>
                    response.email &&
                    response.email.toLowerCase() === linkData.candidate_id.toLowerCase(),
            );

            if (hasResponse) {
                setHasCompletedInterview(true);
                setError("You have already completed this interview.");

                return;
            }

            setLink(linkData);
            setInterview(interviewData);
        } catch (error) {
            console.error("Error validating link:", error);
            setError(
                "An error occurred while validating the interview link. Please try again.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const startInterview = () => {
        if (link && interview) {
            // Redirect to the interview with the unique link ID
            router.push(`/call/${interview.id}?link=${params.uniqueLinkId}`);
        }
    };

    if (!isClient) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-gray-600">Validating interview link...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="max-w-md mx-auto">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4">
                                {hasCompletedInterview ? (
                                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                                ) : (
                                    <XCircle className="h-12 w-12 text-red-600 mx-auto" />
                                )}
                            </div>
                            <CardTitle className="text-xl">
                                {hasCompletedInterview ? "Interview Completed" : "Invalid Link"}
                            </CardTitle>
                            <CardDescription>{error}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => {
                                    if (typeof window !== "undefined") {
                                        window.close();
                                    }
                                }}
                            >
                                Close
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (!link || !interview) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <p className="text-gray-600">Invalid interview link</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4">
                                <Image
                                    src="/sts-logo.svg"
                                    alt="STS Logo"
                                    width={120}
                                    height={40}
                                    className="mx-auto"
                                />
                            </div>
                            <CardTitle className="text-2xl">Interview Invitation</CardTitle>
                            <CardDescription>
                                You have been invited to complete an interview
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Interview Details */}
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg mb-2">
                                        {interview.name}
                                    </h3>
                                    <p className="text-gray-600">{interview.objective}</p>
                                </div>

                                {/* Link Status */}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                        {link.expires_at ? (
                                            <>
                                                Link expires:{" "}
                                                {(() => {
                                                    const date = new Date(link.expires_at);

                                                    return date.toLocaleString();
                                                })()}
                                                {(() => {
                                                    const expiresAt = new Date(link.expires_at);
                                                    const now = new Date();

                                                    return expiresAt < now ? (
                                                        <span className="text-red-600 ml-2">(Expired)</span>
                                                    ) : null;
                                                })()}
                                            </>
                                        ) : (
                                            "Link expires: After Interview Completion"
                                        )}
                                    </span>
                                </div>

                                {link.notes && (
                                    <Alert>
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertDescription>{link.notes}</AlertDescription>
                                    </Alert>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3">
                                <Button className="w-full" size="lg" onClick={startInterview}>
                                    Start Interview
                                </Button>

                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => {
                                        if (typeof window !== "undefined") {
                                            window.close();
                                        }
                                    }}
                                >
                                    Close
                                </Button>
                            </div>

                            {/* Instructions */}
                            <div className="text-sm text-gray-500 text-center">
                                <p>• Make sure you have a quiet environment</p>
                                <p>• Test your microphone before starting</p>
                                <p>• The interview will be recorded for analysis</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
