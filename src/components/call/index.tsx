"use client";

import {
  ArrowUpRightSquareIcon,
  AlarmClockIcon,
  XCircleIcon,
  CheckCircleIcon,
  MicIcon,
  UserIcon,
  Volume2Icon,
  ShieldIcon,
  ClockIcon,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { useResponses } from "@/contexts/responses.context";
import Image from "next/image";
import axios from "axios";
import { RetellWebClient } from "retell-client-js-sdk";
import MiniLoader from "../loaders/mini-loader/miniLoader";
import { toast } from "sonner";
import { isLightColor, testEmail } from "@/lib/utils";
import { ResponseService } from "@/services/responses.service";
import { Interview } from "@/types/interview";
import { FeedbackData } from "@/types/response";
import { FeedbackService } from "@/services/feedback.service";
import { FeedbackForm } from "@/components/call/feedbackForm";
import { useSearchParams } from "next/navigation";
import {
  TabSwitchWarning,
  useTabSwitchPrevention,
} from "./tabSwitchPrevention";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InterviewerService } from "@/services/interviewers.service";
import { CandidateInterviewLinkService } from "@/services/candidateInterviewLinks.service";

const webClient = new RetellWebClient();

type InterviewProps = {
  interview: Interview;
};

type registerCallResponseType = {
  data: {
    registerCallResponse: {
      call_id: string;
      access_token: string;
    };
  };
};

type transcriptType = {
  role: string;
  content: string;
};

function Call({ interview }: InterviewProps) {
  const { createResponse } = useResponses();
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  const uniqueLinkId = searchParams.get("link");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const [lastInterviewerResponse, setLastInterviewerResponse] =
    useState<string>("");
  const [lastUserResponse, setLastUserResponse] = useState<string>("");
  const [activeTurn, setActiveTurn] = useState<string>("");
  const [Loading, setLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isValidEmail, setIsValidEmail] = useState<boolean>(false);
  const [isOldUser, setIsOldUser] = useState<boolean>(false);
  const [callId, setCallId] = useState<string>("");
  const { tabSwitchCount } = useTabSwitchPrevention();
  const [isFeedbackSubmitted, setIsFeedbackSubmitted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [interviewerImg, setInterviewerImg] = useState("");
  const [interviewTimeDuration, setInterviewTimeDuration] =
    useState<string>("1");
  const [time, setTime] = useState(0);
  const [currentTimeDuration, setCurrentTimeDuration] = useState<string>("0");

  const lastUserResponseRef = useRef<HTMLDivElement | null>(null);

  const handleFeedbackSubmit = async (
    formData: Omit<FeedbackData, "interview_id">,
  ) => {
    try {
      const result = await FeedbackService.submitFeedback({
        ...formData,
        interview_id: interview.id,
      });

      if (result) {
        toast.success("Thank you for your feedback!");
        setIsFeedbackSubmitted(true);
        setIsDialogOpen(false);
      } else {
        toast.error("Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("An error occurred. Please try again later.");
    }
  };

  useEffect(() => {
    if (lastUserResponseRef.current) {
      const { current } = lastUserResponseRef;
      current.scrollTop = current.scrollHeight;
    }
  }, [lastUserResponse]);

  useEffect(() => {
    let intervalId: any;
    if (isCalling) {
      // setting time from 0 to 1 every 10 milisecond using javascript setInterval method
      intervalId = setInterval(() => setTime(time + 1), 10);
    }
    setCurrentTimeDuration(String(Math.floor(time / 100)));
    if (Number(currentTimeDuration) == Number(interviewTimeDuration) * 60) {
      webClient.stopCall();
      setIsEnded(true);
    }

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCalling, time, currentTimeDuration]);

  useEffect(() => {
    if (testEmail(email)) {
      setIsValidEmail(true);
    }
  }, [email]);

  useEffect(() => {
    webClient.on("call_started", () => {
      console.log("Call started");
      setIsCalling(true);
    });

    webClient.on("call_ended", () => {
      console.log("Call ended");
      setIsCalling(false);
      setIsEnded(true);
    });

    webClient.on("agent_start_talking", () => {
      setActiveTurn("agent");
    });

    webClient.on("agent_stop_talking", () => {
      // Optional: Add any logic when agent stops talking
      setActiveTurn("user");
    });

    webClient.on("error", (error) => {
      console.error("An error occurred:", error);
      webClient.stopCall();
      setIsEnded(true);
      setIsCalling(false);
    });

    webClient.on("update", (update) => {
      if (update.transcript) {
        const transcripts: transcriptType[] = update.transcript;
        const roleContents: { [key: string]: string } = {};

        transcripts.forEach((transcript) => {
          roleContents[transcript?.role] = transcript?.content;
        });

        setLastInterviewerResponse(roleContents["agent"]);
        setLastUserResponse(roleContents["user"]);
      }
      //TODO: highlight the newly uttered word in the UI
    });

    return () => {
      // Clean up event listeners
      webClient.removeAllListeners();
    };
  }, []);

  const onEndCallClick = async () => {
    if (isStarted) {
      setLoading(true);
      webClient.stopCall();
      setIsEnded(true);
      setLoading(false);
    } else {
      setIsEnded(true);
    }
  };

  const startConversation = async () => {
    const data = {
      mins: interview?.time_duration,
      objective: interview?.objective,
      questions: interview?.questions.map((q) => q.question).join(", "),
      name: name || "not provided",
    };
    setLoading(true);

    // If this is a unique link interview, skip email validation
    if (uniqueLinkId) {
      // For unique links, we don't need to check for old users
      const registerCallResponse: registerCallResponseType = await axios.post(
        "/api/register-call",
        { dynamic_data: data, interviewer_id: interview?.interviewer_id },
      );
      if (registerCallResponse.data.registerCallResponse.access_token) {
        await webClient
          .startCall({
            accessToken:
              registerCallResponse.data.registerCallResponse.access_token,
          })
          .catch(console.error);
        setIsCalling(true);
        setIsStarted(true);

        setCallId(registerCallResponse?.data?.registerCallResponse?.call_id);

        const responseId = await createResponse({
          interview_id: interview.id,
          call_id: registerCallResponse.data.registerCallResponse.call_id,
          email: email,
          name: name,
        });
      } else {
        console.log("Failed to register call");
      }
    } else {
    // Regular interview flow with email validation
      const oldUserEmails: string[] = (
        await ResponseService.getAllEmails(interview.id)
      ).map((item) => item.email);
      const OldUser =
        oldUserEmails.includes(email) ||
        (interview?.respondents && !interview?.respondents.includes(email));

      if (OldUser) {
        setIsOldUser(true);
      } else {
        const registerCallResponse: registerCallResponseType = await axios.post(
          "/api/register-call",
          { dynamic_data: data, interviewer_id: interview?.interviewer_id },
        );
        if (registerCallResponse.data.registerCallResponse.access_token) {
          await webClient
            .startCall({
              accessToken:
                registerCallResponse.data.registerCallResponse.access_token,
            })
            .catch(console.error);
          setIsCalling(true);
          setIsStarted(true);

          setCallId(registerCallResponse?.data?.registerCallResponse?.call_id);

          const responseId = await createResponse({
            interview_id: interview.id,
            call_id: registerCallResponse.data.registerCallResponse.call_id,
            email: email,
            name: name,
          });
        } else {
          console.log("Failed to register call");
        }
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (interview?.time_duration) {
      setInterviewTimeDuration(interview?.time_duration);
    }
  }, [interview]);

  useEffect(() => {
    const fetchInterviewer = async () => {
      const interviewer = await InterviewerService.getInterviewer(
        interview.interviewer_id,
      );
      setInterviewerImg(interviewer.image);
    };
    fetchInterviewer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interview.interviewer_id]);

  useEffect(() => {
    if (isEnded) {
      const updateInterview = async () => {
        await ResponseService.saveResponse(
          { is_ended: true, tab_switch_count: tabSwitchCount },
          callId,
        );

        // Mark unique link as completed if it exists
        if (uniqueLinkId) {
          try {
            const link =
              await CandidateInterviewLinkService.getLinkByUniqueId(
                uniqueLinkId,
              );
            if (link) {
              // Get the response ID for this call
              const response =
                await ResponseService.getResponseByCallId(callId);
              if (response) {
                // If link has no expiration date, mark as expired after completion
                if (!link.expires_at) {
                  await CandidateInterviewLinkService.updateLinkStatus(
                    link.id,
                    "expired",
                    response.id,
                  );
                } else {
                  await CandidateInterviewLinkService.updateLinkStatus(
                    link.id,
                    "completed",
                    response.id,
                  );
                }
              }
            }
          } catch (error) {
            console.error("Error updating link status:", error);
          }
        }
      };

      updateInterview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEnded]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      {isStarted && !isEnded && <TabSwitchWarning />}

      <div className="w-full max-w-6xl">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden h-[80vh]">
          {/* Header with Progress */}
          <div className="bg-gradient-to-r from-[#06546e] to-[#06546e]/90 text-white p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <MicIcon className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">{interview?.name}</h1>
                  <div className="flex items-center gap-2 text-xs text-blue-100">
                    <ClockIcon className="w-3 h-3" />
                    <span>Duration: {interviewTimeDuration} mins</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-blue-100 mb-1">Progress</div>
                  <div className="text-sm font-bold">
                    {Math.round(
                      (Number(currentTimeDuration) /
                        (Number(interviewTimeDuration) * 60)) *
                      100,
                    )}
                    %
                  </div>
                </div>
                {isStarted && !isEnded && !isOldUser && (
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 px-4 rounded-lg border-white/40 text-white hover:bg-[#06546e]/80 hover:border-white/80 hover:text-white transition-all duration-300 text-xs font-semibold shadow-lg hover:shadow-xl"
                        disabled={Loading}
                      >
                        <XCircleIcon className="w-4 h-4 mr-2" />
                        End Interview
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>End Interview?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will end the call
                          immediately.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700"
                          onClick={async () => {
                            await onEndCallClick();
                          }}
                        >
                          End Interview
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-white to-blue-100"
                style={{
                  width: isEnded
                    ? "100%"
                    : `${(Number(currentTimeDuration) /
                      (Number(interviewTimeDuration) * 60)) *
                    100
                    }%`,
                }}
              />
            </div>
          </div>

          {/* Content Area */}
          <div className="h-full flex flex-col">
            {/* Pre-Interview Form */}
            {!isStarted && !isEnded && !isOldUser && (
              <div className="flex-1">
                <div className="h-full flex justify-center">
                  <div className="max-w-4xl w-full max-h-full">
                    <div className="flex gap-8 h-full">
                      {/* Left Side - Information */}
                      <div className="flex-1 space-y-4 max-h-full overflow-y-auto">
                        <div className="text-center mt-7">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#06546e] to-[#06546e]/80 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                            <MicIcon className="w-8 h-8 text-white" />
                          </div>
                          <h2 className="text-lg font-bold text-gray-800 mb-2">
                            Ready to Start?
                          </h2>
                          <p className="text-gray-600 text-sm leading-relaxed max-w-lg mx-auto">
                            {interview?.description}
                          </p>
                        </div>

                        {/* Requirements Cards */}
                        <div className="grid md:grid-cols-3 gap-2">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 text-center">
                            <Volume2Icon className="w-4 h-5 text-blue-600 mx-auto mb-1" />
                            <h3 className="font-semibold text-gray-800 mb-1 text-xs">
                              Volume Up
                            </h3>
                            <p className="text-xs text-gray-600">
                              Ensure your speakers are on
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-2 text-center">
                            <MicIcon className="w-4 h-5 text-green-600 mx-auto mb-1" />
                            <h3 className="font-semibold text-gray-800 mb-1 text-xs">
                              Microphone Access
                            </h3>
                            <p className="text-xs text-gray-600">
                              Grant permission when prompted
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-2 text-center">
                            <ShieldIcon className="w-4 h-5 text-purple-600 mx-auto mb-1" />
                            <h3 className="font-semibold text-gray-800 mb-1 text-xs">
                              Quiet Environment
                            </h3>
                            <p className="text-xs text-gray-600">
                              Find a peaceful space
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - User Information */}
                      {!interview?.is_anonymous && (
                        <div className="w-72 flex-shrink-0 mt-5">
                          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 mt-5 shadow-lg border border-gray-100 flex flex-col">
                            <h3 className="text-base font-semibold text-gray-800 mb-3 text-center">
                              Your Information
                            </h3>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Email Address
                                </label>
                                <input
                                  value={email}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  placeholder="Enter your email address"
                                  onChange={(e) => setEmail(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  First Name
                                </label>
                                <input
                                  value={name}
                                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                                  placeholder="Enter your first name"
                                  onChange={(e) => setName(e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Action Buttons - Inside the card */}
                            <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 flex-shrink-0">
                              <Button
                                className="flex-1 h-10 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-105 shadow-lg"
                                style={{
                                  backgroundColor:
                                    interview.theme_color ?? "#4F46E5",
                                  color: isLightColor(
                                    interview.theme_color ?? "#4F46E5",
                                  )
                                    ? "black"
                                    : "white",
                                }}
                                disabled={
                                  Loading ||
                                  (!interview?.is_anonymous &&
                                    (!isValidEmail || !name))
                                }
                                onClick={startConversation}
                              >
                                {!Loading ? (
                                  <span className="flex items-center gap-2">
                                    <MicIcon className="w-4 h-4" />
                                    Start Interview
                                  </span>
                                ) : (
                                  <MiniLoader />
                                )}
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger>
                                  <Button
                                    variant="outline"
                                    className="flex-1 h-10 rounded-lg border-2 hover:bg-gray-50 transition-all duration-200 text-sm"
                                    style={{
                                      borderColor: interview.theme_color,
                                    }}
                                    disabled={Loading}
                                  >
                                    Exit
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Are you sure?
                                    </AlertDialogTitle>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-[#06546e] hover:bg-[#06546e]/80"
                                      onClick={async () => {
                                        await onEndCallClick();
                                      }}
                                    >
                                      Continue
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Active Interview */}
            {isStarted && !isEnded && !isOldUser && (
              <div className="flex-1 flex flex-col lg:flex-row h-full">
                {/* Interviewer Side */}
                <div className="flex-1 lg:border-r lg:border-gray-200 flex flex-col p-4">
                  <div className="h-52 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 mb-4 overflow-y-auto shadow-inner">
                    <div className="text-base text-gray-700 leading-relaxed">
                      {lastInterviewerResponse || (
                        <div className="text-center text-gray-500 flex flex-col justify-center h-full">
                          <MicIcon className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">Waiting for interviewer...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center flex-shrink-0">
                    <div className="relative inline-block">
                      <div className="relative">
                        <Image
                          src={interviewerImg}
                          alt="Interviewer"
                          width={70}
                          height={70}
                          className={`object-cover rounded-full border-3 transition-all duration-300 shadow-lg ${activeTurn === "agent"
                            ? "border-blue-500 scale-110 shadow-blue-200"
                            : "border-gray-200"
                            }`}
                        />
                        {activeTurn === "agent" && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mt-2">
                      Interviewer
                    </p>
                    {activeTurn === "agent" && (
                      <div className="flex items-center justify-center gap-1 text-green-600 text-xs mt-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Speaking
                      </div>
                    )}
                  </div>
                </div>

                {/* User Side */}
                <div className="flex-1 lg:pl-4 flex flex-col p-4">
                  <div
                    ref={lastUserResponseRef}
                    className="h-52 bg-gradient-to-br from-[#06546e]/5 to-[#06546e]/10 rounded-xl p-4 mb-4 overflow-y-auto shadow-inner"
                  >
                    <div className="text-base text-gray-700 leading-relaxed">
                      {lastUserResponse || (
                        <div className="text-center text-gray-500 flex flex-col justify-center h-full">
                          <UserIcon className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">
                            Your responses will appear here...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-center flex-shrink-0">
                    <div className="relative inline-block">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#06546e] to-[#06546e]/80 rounded-full flex items-center justify-center shadow-lg">
                          <UserIcon className="w-8 h-8 text-white" />
                        </div>
                        {activeTurn === "user" && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mt-2">
                      You
                    </p>
                    {activeTurn === "user" && (
                      <div className="flex items-center justify-center gap-1 text-green-600 text-xs mt-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        Speaking
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* Interview Complete */}
            {isEnded && !isOldUser && (
              <div className="flex-1 flex mt-7 justify-center">
                <div className="max-w-md mx-auto text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CheckCircleIcon className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    {isStarted
                      ? "Interview Complete!"
                      : "Thank you for your time"}
                  </h3>
                  <p className="text-gray-600 mb-4 text-base">
                    {isStarted
                      ? "Thank you for taking the time to participate in this interview."
                      : "Thank you very much for considering."}
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    You can close this tab now.
                  </p>

                  {!isFeedbackSubmitted && (
                    <AlertDialog
                      open={isDialogOpen}
                      onOpenChange={setIsDialogOpen}
                    >
                      <AlertDialogTrigger className="w-full">
                        <Button
                          className="w-full h-12 rounded-lg bg-gradient-to-r from-[#06546e] to-[#06546e]/90 hover:from-[#06546e]/90 hover:to-[#06546e] text-white text-base font-semibold shadow-lg"
                          onClick={() => setIsDialogOpen(true)}
                        >
                          Provide Feedback
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <FeedbackForm
                          email={email}
                          onSubmit={handleFeedbackSubmit}
                        />
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            )}

            {/* Old User Message */}
            {isOldUser && (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-md mx-auto text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <CheckCircleIcon className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    Already Participated
                  </h3>
                  <p className="text-gray-600 mb-4 text-base">
                    You have already responded in this interview or you are not
                    eligible to respond.
                  </p>
                  <p className="text-sm text-gray-500">
                    Thank you! You can close this tab now.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <a
            className="inline-flex items-center gap-3 text-gray-500"
            href="https://stspl.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="text-sm font-medium">Powered by</span>
            <Image
              src="/sts-logo.svg"
              alt="STS Logo"
              width={60}
              height={20}
              className="h-5 w-auto"
            />
            <ArrowUpRightSquareIcon className="h-4 w-4 transition-all duration-300 hover:scale-110 hover:rotate-12" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default Call;
